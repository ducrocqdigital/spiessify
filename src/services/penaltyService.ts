import { supabase } from '@/integrations/supabase/client';
import { Penalty, PenaltyCategory } from '@/types';

export const penaltyService = {
  // Get all penalties with member information
  async getAll(): Promise<Penalty[]> {
    const { data, error } = await supabase
      .from('penalties')
      .select(`
        *,
        member:members(*)
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return (data || []) as Penalty[];
  },

  // Get penalties for a specific member
  async getByMemberId(memberId: string): Promise<Penalty[]> {
    const { data, error } = await supabase
      .from('penalties')
      .select(`
        *,
        member:members(*)
      `)
      .eq('member_id', memberId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return (data || []) as Penalty[];
  },

  // Get recent penalties (last 5)
  async getRecent(limit: number = 5): Promise<Penalty[]> {
    const { data, error } = await supabase
      .from('penalties')
      .select(`
        *,
        member:members(*)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return (data || []) as Penalty[];
  },

  // Get penalties for today
  async getToday(): Promise<Penalty[]> {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('penalties')
      .select(`
        *,
        member:members(*)
      `)
      .eq('date', today)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return (data || []) as Penalty[];
  },

  // Create new penalty
  async create(penalty: {
    member_id: string;
    category: PenaltyCategory;
    amount: number;
    date?: string;
    notes?: string;
  }): Promise<Penalty> {
    const { data, error } = await supabase
      .from('penalties')
      .insert([{
        ...penalty,
        date: penalty.date || new Date().toISOString().split('T')[0]
      }])
      .select(`
        *,
        member:members(*)
      `)
      .single();
    
    if (error) throw error;
    return data as Penalty;
  },

  // Update penalty
  async update(id: string, updates: Partial<Penalty>): Promise<Penalty> {
    const { data, error } = await supabase
      .from('penalties')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        member:members(*)
      `)
      .single();
    
    if (error) throw error;
    return data as Penalty;
  },

  // Delete penalty
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('penalties')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // Get penalty statistics
  async getStats(): Promise<{
    totalPenalties: number;
    totalAmount: number;
    todayCount: number;
    activeMembers: number;
  }> {
    const [penalties, todayPenalties, activeMembers] = await Promise.all([
      supabase.from('penalties').select('amount'),
      this.getToday(),
      supabase.from('members').select('id').eq('is_active', true)
    ]);

    return {
      totalPenalties: penalties.data?.length || 0,
      totalAmount: penalties.data?.reduce((sum, p) => sum + Number(p.amount), 0) || 0,
      todayCount: todayPenalties.length,
      activeMembers: activeMembers.data?.length || 0
    };
  }
};