import { supabase } from '@/integrations/supabase/client';
import { CheckinSession, CheckinResult } from '@/types';

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
