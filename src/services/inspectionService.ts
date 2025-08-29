import { supabase } from '@/integrations/supabase/client';
import { InspectionSession, InspectionResult, InspectionData } from '@/types';

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
  async startSession(anlass: string): Promise<InspectionSession> {
    // End any existing active session first
    await this.endActiveSession();
    
    const { data, error } = await supabase
      .from('inspection_sessions')
      .insert({
        anlass,
        is_active: true
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

  // Create penalties based on inspection failures
  async createPenaltiesFromInspection(
    sessionId: string,
    memberId: string,
    inspectionData: InspectionData,
    penaltyCatalog: any[]
  ): Promise<void> {
    const penaltyPromises: Promise<void>[] = [];
    
    // Process penalties with multipliers
    Object.entries(inspectionData).forEach(([categoryKey, categoryData]) => {
      Object.entries(categoryData).forEach(([itemKey, multiplier]) => {
        const multiplierValue = multiplier as number;
        if (multiplierValue > 0) {
          // Find the penalty in catalog by ID (itemKey)
          const matchingPenalty = penaltyCatalog.find(p => p.id === itemKey && p.is_active);
          
          if (matchingPenalty) {
            // Create penalty with multiplier
            const penaltyPromise = async (): Promise<void> => {
              const { error } = await supabase
                .from('penalties')
                .insert({
                  member_id: memberId,
                  penalty_type_id: matchingPenalty.id,
                  amount: matchingPenalty.amount,
                  multiplier: multiplierValue,
                  notes: `Musterung: ${matchingPenalty.name}`,
                  date: new Date().toISOString().split('T')[0]
                });

              if (error) {
                console.error('Failed to create penalty:', error);
                throw error;
              }
            };
            
            penaltyPromises.push(penaltyPromise());
          }
        }
      });
    });

    await Promise.all(penaltyPromises);
  }
};