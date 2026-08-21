import { supabase } from '@/integrations/supabase/client';
import { CheckinSession, CheckinResult } from '@/types';
import { penaltyService } from '@/services/penaltyService';

// Find the late-arrival catalog entry (same lookup the old modal used)
export function findLatePenaltyType(catalog: any[]): any | undefined {
  return catalog.find(
    pt => pt.name.toLowerCase().includes('verspätung') ||
          pt.category === 'timing' ||
          pt.name.toLowerCase().includes('zu spät')
  );
}

// Standard amount for X minutes late (1 EUR/min fallback)
export function computeLateAmount(latePenaltyType: any | undefined, minutesLate: number): number {
  if (!latePenaltyType) return minutesLate * 1;
  const base = Number(latePenaltyType.amount);
  return latePenaltyType.has_multiplier ? base * minutesLate : base;
}


export const checkinService = {
  // Start a new check-in session (reference time as full timestamp)
  async startSession(referenceTime: Date, occasion: string, eventId?: string): Promise<CheckinSession> {
    // End any existing active session first (safety, unique index enforces one active)
    await this.endActiveSession();

    const { data, error } = await supabase
      .from('checkin_sessions')
      .insert({
        occasion,
        reference_time: referenceTime.toISOString(),
        is_active: true,
        event_id: eventId
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Get the active check-in session (if any)
  async getActiveSession(): Promise<CheckinSession | null> {
    const { data, error } = await supabase
      .from('checkin_sessions')
      .select('*')
      .eq('is_active', true)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  // End the active check-in session
  async endActiveSession(): Promise<void> {
    const { error } = await supabase
      .from('checkin_sessions')
      .update({
        is_active: false,
        end_time: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('is_active', true);

    if (error) throw error;
  },

  // All results of a session (who is already checked in)
  async getSessionResults(sessionId: string): Promise<CheckinResult[]> {
    const { data, error } = await supabase
      .from('checkin_results')
      .select('*')
      .eq('session_id', sessionId);

    if (error) throw error;
    return data || [];
  },

  // Check a member in (on time or late); penaltyId links a created penalty
  async checkInMember(
    sessionId: string,
    memberId: string,
    minutesLate: number,
    penaltyId?: string
  ): Promise<CheckinResult> {
    const { data, error } = await supabase
      .from('checkin_results')
      .insert({
        session_id: sessionId,
        member_id: memberId,
        check_time: new Date().toISOString(),
        minutes_late: Math.max(0, minutesLate),
        is_on_time: minutesLate <= 0,
        penalty_id: penaltyId
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Correct a check-in: new arrival time and/or new penalty amount.
  // Creates, updates or deletes the linked penalty as needed.
  async updateCheckIn(
    session: CheckinSession,
    result: CheckinResult,
    newCheckTime: Date,
    amount: number,
    latePenaltyType: any | undefined
  ): Promise<CheckinResult> {
    const referenceTime = new Date(session.reference_time);
    const minutesLate = Math.max(0, Math.floor((newCheckTime.getTime() - referenceTime.getTime()) / 60000));
    const isOnTime = minutesLate <= 0;

    let penaltyId: string | null = result.penalty_id || null;

    if (isOnTime) {
      // Now on time: remove an existing penalty
      if (penaltyId) {
        const { error } = await supabase.from('penalties').delete().eq('id', penaltyId);
        if (error) throw error;
        penaltyId = null;
      }
    } else if (penaltyId) {
      // Still late: update amount and note
      const { error } = await supabase
        .from('penalties')
        .update({
          amount,
          multiplier: latePenaltyType?.has_multiplier ? minutesLate : 1,
          notes: `${session.occasion}: +${minutesLate} Min.`
        })
        .eq('id', penaltyId);
      if (error) throw error;
    } else if (latePenaltyType) {
      // Was on time, is now late: create penalty
      const penalty = await penaltyService.create({
        member_id: result.member_id,
        penalty_type_id: latePenaltyType.id,
        amount,
        multiplier: latePenaltyType?.has_multiplier ? minutesLate : 1,
        notes: `${session.occasion}: +${minutesLate} Min.`,
        event_id: session.event_id || undefined
      });
      penaltyId = penalty.id;
    }

    const { data, error } = await supabase
      .from('checkin_results')
      .update({
        check_time: newCheckTime.toISOString(),
        minutes_late: minutesLate,
        is_on_time: isOnTime,
        penalty_id: penaltyId
      })
      .eq('id', result.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Undo a check-in; also deletes the linked penalty if one was created
  async undoCheckIn(result: CheckinResult): Promise<void> {
    if (result.penalty_id) {
      const { error: penaltyError } = await supabase
        .from('penalties')
        .delete()
        .eq('id', result.penalty_id);
      if (penaltyError) throw penaltyError;
    }

    const { error } = await supabase
      .from('checkin_results')
      .delete()
      .eq('id', result.id);

    if (error) throw error;
  }
};
