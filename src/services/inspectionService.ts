import { supabase } from '@/integrations/supabase/client';
import { InspectionSession, InspectionResult, InspectionData } from '@/types';
import { localDateString } from '@/lib/dates';

// Inspection categories and items
export const INSPECTION_CATEGORIES = {
  kopf: {
    name: 'Kopf',
    items: {
      hut: 'Hut',
      krawatte: 'Krawatte', 
      frisur: 'Frisur'
    }
  },
  oberkoerper: {
    name: 'Oberkörper',
    items: {
      jacke: 'Jacke',
      hemd: 'Hemd',
      abzeichen: 'Abzeichen'
    }
  },
  unterkoerper: {
    name: 'Unterkörper',
    items: {
      hose: 'Hose',
      hosenstege: 'Hosenstege',
      schuhe: 'Schuhe'
    }
  },
  ausruestung: {
    name: 'Ausrüstung',
    items: {
      gewehr_saebel: 'Gewehr/Säbel',
      handschuhe: 'Handschuhe',
      schuetzenstock: 'Schützenstock'
    }
  },
  sonstiges: {
    name: 'Sonstiges',
    items: {
      auftreten: 'Auftreten',
      benehmen: 'Benehmen'
    }
  }
};

export const inspectionService = {
  // Start a new inspection session
  async startSession(anlass: string, eventId?: string): Promise<InspectionSession> {
    // End any existing active session first
    await this.endActiveSession();
    
    const { data, error } = await supabase
      .from('inspection_sessions')
      .insert({
        anlass,
        is_active: true,
        event_id: eventId
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Get active inspection session
  async getActiveSession(): Promise<InspectionSession | null> {
    const { data, error } = await supabase
      .from('inspection_sessions')
      .select('*')
      .eq('is_active', true)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  // End active inspection session
  async endActiveSession(): Promise<void> {
    const { error } = await supabase
      .from('inspection_sessions')
      .update({ 
        is_active: false,
        end_time: new Date().toISOString()
      })
      .eq('is_active', true);

    if (error) throw error;
  },

  // Get all inspection results for a session
  async getSessionResults(sessionId: string): Promise<InspectionResult[]> {
    const { data, error } = await supabase
      .from('inspection_results')
      .select('*')
      .eq('session_id', sessionId);

    if (error) throw error;
    return (data || []) as InspectionResult[];
  },

  // Get inspection result for a specific member in session
  async getMemberResult(sessionId: string, memberId: string): Promise<InspectionResult | null> {
    const { data, error } = await supabase
      .from('inspection_results')
      .select('*')
      .eq('session_id', sessionId)
      .eq('member_id', memberId)
      .maybeSingle();

    if (error) throw error;
    return data as InspectionResult | null;
  },

  // Initialize inspection result for a member
  async initializeMemberResult(sessionId: string, memberId: string): Promise<InspectionResult> {
    const initialData: InspectionData = {
      kopf: {},
      oberkoerper: {},
      unterkoerper: {},
      ausruestung: {},
      sonstiges: {}
    };

    const { data, error } = await supabase
      .from('inspection_results')
      .upsert({
        session_id: sessionId,
        member_id: memberId,
        status: 'offen' as const,
        inspection_data: initialData as any
      }, {
        onConflict: 'session_id,member_id'
      })
      .select()
      .single();

    if (error) throw error;
    return data as InspectionResult;
  },

  // Update inspection result
  async updateMemberResult(
    sessionId: string, 
    memberId: string, 
    inspectionData: InspectionData,
    status: 'offen' | 'gemustert'
  ): Promise<InspectionResult> {
    const { data, error } = await supabase
      .from('inspection_results')
      .update({
        inspection_data: inspectionData as any,
        status
      })
      .eq('session_id', sessionId)
      .eq('member_id', memberId)
      .select()
      .single();

    if (error) throw error;
    return data as InspectionResult;
  },

  // Create penalties from the part-based inspection (Teil + Zustand).
  // Idempotent: penalties from an earlier save are replaced.
  async createPenaltiesFromParts(
    sessionId: string,
    memberId: string,
    partStates: { partLabel: string; stateLabel: string; catalogEntry: any }[]
  ): Promise<void> {
    const { data: activeEvent } = await supabase.rpc('get_active_event');
    const activeEventId = activeEvent && activeEvent.length > 0 ? activeEvent[0].id : null;

    const { data: existingResult, error: resultError } = await supabase
      .from('inspection_results')
      .select('penalty_ids')
      .eq('session_id', sessionId)
      .eq('member_id', memberId)
      .maybeSingle();

    if (resultError) throw resultError;

    const oldPenaltyIds: string[] = existingResult?.penalty_ids || [];
    if (oldPenaltyIds.length > 0) {
      const { error: deleteError } = await supabase
        .from('penalties')
        .delete()
        .in('id', oldPenaltyIds);
      if (deleteError) throw deleteError;
    }

    const inserts = partStates
      .filter(ps => ps.catalogEntry)
      .map(ps => ({
        member_id: memberId,
        penalty_type_id: ps.catalogEntry.id,
        amount: Number(ps.catalogEntry.amount),
        multiplier: 1,
        notes: `Musterung: ${ps.partLabel} – ${ps.stateLabel}`,
        date: localDateString(),
        event_id: activeEventId
      }));

    let newPenaltyIds: string[] = [];
    if (inserts.length > 0) {
      const { data: created, error } = await supabase
        .from('penalties')
        .insert(inserts)
        .select('id');

      if (error) throw error;
      newPenaltyIds = (created || []).map(row => row.id);
    }

    const { error: updateError } = await supabase
      .from('inspection_results')
      .update({ penalty_ids: newPenaltyIds })
      .eq('session_id', sessionId)
      .eq('member_id', memberId);

    if (updateError) throw updateError;
  },

  // Create penalties based on inspection failures.
  // Idempotent: penalties created by an earlier save of the same
  // member in the same session are deleted first (no double booking).
  async createPenaltiesFromInspection(
    sessionId: string,
    memberId: string,
    inspectionData: InspectionData,
    penaltyCatalog: any[]
  ): Promise<void> {
    // Get the active event ID
    const { data: activeEvent } = await supabase.rpc('get_active_event');
    const activeEventId = activeEvent && activeEvent.length > 0 ? activeEvent[0].id : null;

    // Remove penalties from a previous save of this inspection
    const { data: existingResult, error: resultError } = await supabase
      .from('inspection_results')
      .select('penalty_ids')
      .eq('session_id', sessionId)
      .eq('member_id', memberId)
      .maybeSingle();

    if (resultError) throw resultError;

    const oldPenaltyIds: string[] = existingResult?.penalty_ids || [];
    if (oldPenaltyIds.length > 0) {
      const { error: deleteError } = await supabase
        .from('penalties')
        .delete()
        .in('id', oldPenaltyIds);
      if (deleteError) throw deleteError;
    }

    // Collect the penalties to create
    const inserts: any[] = [];
    Object.entries(inspectionData).forEach(([categoryKey, categoryData]) => {
      Object.entries(categoryData).forEach(([itemKey, multiplier]) => {
        const multiplierValue = multiplier as number;
        if (multiplierValue > 0) {
          const matchingPenalty = penaltyCatalog.find(p => p.id === itemKey && p.is_active);

          if (matchingPenalty) {
            inserts.push({
              member_id: memberId,
              penalty_type_id: matchingPenalty.id,
              // amount is the total: catalog amount times count
              amount: Number(matchingPenalty.amount) * multiplierValue,
              multiplier: multiplierValue,
              notes: `Musterung: ${matchingPenalty.name}`,
              date: localDateString(),
              event_id: activeEventId
            });
          }
        }
      });
    });

    let newPenaltyIds: string[] = [];
    if (inserts.length > 0) {
      const { data: created, error } = await supabase
        .from('penalties')
        .insert(inserts)
        .select('id');

      if (error) {
        console.error('Failed to create penalties:', error);
        throw error;
      }
      newPenaltyIds = (created || []).map(row => row.id);
    }

    // Remember which penalties belong to this inspection
    const { error: updateError } = await supabase
      .from('inspection_results')
      .update({ penalty_ids: newPenaltyIds })
      .eq('session_id', sessionId)
      .eq('member_id', memberId);

    if (updateError) throw updateError;
  }
};