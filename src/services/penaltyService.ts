import { supabase } from '@/integrations/supabase/client';
import { Penalty } from '@/types';

export const penaltyService = {
  // Get all penalties with member information
  async getAll(): Promise<Penalty[]> {
    const { data, error } = await supabase
      .from('penalties')
      .select(`
        *,
        member:members(*),
        penalty_type:penalty_catalog(*)
      `)
      .order('created_time', { ascending: false });
    
    if (error) throw error;
    return (data || []) as Penalty[];
  },

  // Get penalties with filters and pagination
  async getFiltered(options: {
    limit?: number;
    offset?: number;
    memberId?: string;
    categoryFilter?: string;
    dateFrom?: string;
    dateTo?: string;
  } = {}): Promise<Penalty[]> {
    const { limit = 10, offset = 0, memberId, categoryFilter, dateFrom, dateTo } = options;
    
    let query = supabase
      .from('penalties')
      .select(`
        *,
        member:members(*),
        penalty_type:penalty_catalog(*)
      `)
      .order('created_time', { ascending: false });

    console.log('penaltyService.getFiltered called with:', { memberId, categoryFilter, dateFrom, dateTo });

    if (memberId && memberId.trim() !== '') {
      console.log('Applying member filter:', memberId);
      query = query.eq('member_id', memberId.trim());
    }

    if (dateFrom && dateFrom.trim() !== '') {
      console.log('Applying date from filter:', dateFrom);
      query = query.gte('date', dateFrom.trim());
    }

    if (dateTo && dateTo.trim() !== '') {
      console.log('Applying date to filter:', dateTo);
      query = query.lte('date', dateTo.trim());
    }

    if (categoryFilter && categoryFilter !== 'all' && categoryFilter.trim() !== '') {
      console.log('Applying category filter:', categoryFilter);
      // We need to filter by category through the penalty_catalog relationship
      const { data: penaltyTypes, error: catalogError } = await supabase
        .from('penalty_catalog')
        .select('id')
        .eq('category', categoryFilter.trim());
      
      if (catalogError) {
        console.error('Error fetching penalty types for category filter:', catalogError);
      } else if (penaltyTypes && penaltyTypes.length > 0) {
        const penaltyTypeIds = penaltyTypes.map(pt => pt.id);
        console.log('Category filter resolved to penalty type IDs:', penaltyTypeIds);
        query = query.in('penalty_type_id', penaltyTypeIds);
      } else {
        console.log('No penalty types found for category:', categoryFilter);
        // Return empty result if no penalty types found for the category
        return [];
      }
    }

    console.log('Final query will be executed with filters applied');
    console.log('Query parameters before execution:', query);
    
    const { data, error } = await query.range(offset, offset + limit - 1);
    
    console.log('Query executed. Results:', {
      dataLength: data?.length || 0,
      error: error?.message || 'none',
      firstItem: data?.[0] || 'none'
    });
    
    if (error) {
      console.error('Database query error:', error);
      throw error;
    }
    
    return (data || []) as Penalty[];
  },

  // Get penalties for a specific member
  async getByMemberId(memberId: string): Promise<Penalty[]> {
    const { data, error } = await supabase
      .from('penalties')
      .select(`
        *,
        member:members(*),
        penalty_type:penalty_catalog(*)
      `)
      .eq('member_id', memberId)
      .order('created_time', { ascending: false });
    
    if (error) throw error;
    return (data || []) as Penalty[];
  },

  // Get recent penalties with pagination
  async getRecent(limit: number = 10, offset: number = 0): Promise<Penalty[]> {
    const { data, error } = await supabase
      .from('penalties')
      .select(`
        *,
        member:members(*),
        penalty_type:penalty_catalog(*)
      `)
      .order('created_time', { ascending: false })
      .range(offset, offset + limit - 1);
    
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
        member:members(*),
        penalty_type:penalty_catalog(*)
      `)
      .eq('date', today)
      .order('created_time', { ascending: false });
    
    if (error) throw error;
    return (data || []) as Penalty[];
  },

  // Create new penalty
  async create(penalty: {
    member_id: string;
    penalty_type_id: string;
    amount: number;
    multiplier?: number;
    date?: string;
    notes?: string;
    location_latitude?: number;
    location_longitude?: number;
  }): Promise<Penalty> {
    const { data, error } = await supabase
      .from('penalties')
      .insert([{
        ...penalty,
        date: penalty.date || new Date().toISOString().split('T')[0],
        created_time: new Date().toISOString()
      }])
      .select(`
        *,
        member:members(*),
        penalty_type:penalty_catalog(*)
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
        member:members(*),
        penalty_type:penalty_catalog(*)
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
  },

  // Get the member with the most penalties (Zugsau)
  async getZugsau(): Promise<{ member: any; totalAmount: number; penaltyCount: number } | null> {
    const { data, error } = await supabase
      .from('members')
      .select(`
        *,
        penalties!inner(amount)
      `)
      .eq('is_active', true);

    if (error) throw error;
    
    if (!data || data.length === 0) return null;

    // Calculate totals for each member
    const memberStats = data.map(member => {
      const totalAmount = member.penalties.reduce((sum: number, penalty: any) => sum + Number(penalty.amount), 0);
      const penaltyCount = member.penalties.length;
      
      return {
        member: {
          id: member.id,
          first_name: member.first_name,
          last_name: member.last_name,
          nickname: member.nickname
        },
        totalAmount,
        penaltyCount
      };
    });

    // Find the member with the highest total amount
    const zugsau = memberStats.reduce((max, current) => 
      current.totalAmount > max.totalAmount ? current : max
    );

    return zugsau.totalAmount > 0 ? zugsau : null;
  }
};