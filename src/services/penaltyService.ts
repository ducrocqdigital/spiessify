import { supabase } from '@/integrations/supabase/client';
import { authService } from './authService';
import { Penalty } from '@/types';

// Add new secure public methods
const securePublicMethods = {
  // SECURE: Get recent penalties for public display (no sensitive data)
  async getRecentPublic(limit: number = 10, offset: number = 0): Promise<any[]> {
    const { data, error } = await supabase
      .from('penalties')
      .select(`
        id,
        amount,
        date,
        created_at,
        penalty_type:penalty_catalog(name),
        member:members(first_name, last_name, family_name_particle, nickname)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    
    return (data || []).map(p => ({
      id: p.id,
      amount: p.amount,
      penalty_date: p.date,
      created_time: p.created_at,
      penalty_type_name: p.penalty_type?.name,
      member_first_name: p.member?.first_name,
      member_last_name: p.member?.last_name,
      member_family_name_particle: p.member?.family_name_particle,
      member_nickname: p.member?.nickname
    }));
  },

  // SECURE: Get penalty statistics for public display
  async getStatsPublic(): Promise<{ totalPenalties: number; totalAmount: number; uniqueDays: number }> {
    const { data, error } = await supabase
      .from('penalties')
      .select('amount, date');

    if (error) throw error;
    
    const penalties = data || [];
    const uniqueDaysSet = new Set(penalties.map(p => p.date));
    
    return {
      totalPenalties: penalties.length,
      totalAmount: penalties.reduce((sum, p) => sum + Number(p.amount), 0),
      uniqueDays: uniqueDaysSet.size
    };
  },
};

export const penaltyService = {
  // Add secure public methods
  ...securePublicMethods,
  // Get all penalties with member information (only from active event)
  async getAll(): Promise<Penalty[]> {
    // First get the active event
    const { data: activeEvent } = await supabase.rpc('get_active_event');
    
    let query = supabase
      .from('penalties')
      .select(`
        *,
        member:members(*),
        penalty_type:penalty_catalog(*)
      `)
      .order('created_time', { ascending: false });
    
    // Filter by active event if one exists
    if (activeEvent && activeEvent.length > 0) {
      query = query.eq('event_id', activeEvent[0].id);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return (data || []) as Penalty[];
  },

  // Get penalties with filters and pagination (only from active event)
  async getFiltered(options: {
    limit?: number;
    offset?: number;
    memberId?: string;
    categoryFilter?: string;
    dateFrom?: string;
    dateTo?: string;
  } = {}): Promise<Penalty[]> {
    const { limit = 10, offset = 0, memberId, categoryFilter, dateFrom, dateTo } = options;
    
    // First get the active event
    const { data: activeEvent } = await supabase.rpc('get_active_event');
    
    let query = supabase
      .from('penalties')
      .select(`
        *,
        member:members(*),
        penalty_type:penalty_catalog(*)
      `)
      .order('created_time', { ascending: false });

    // Filter by active event if one exists
    if (activeEvent && activeEvent.length > 0) {
      query = query.eq('event_id', activeEvent[0].id);
    }

    if (memberId && memberId.trim() !== '') {
      query = query.eq('member_id', memberId.trim());
    }

    if (dateFrom && dateFrom.trim() !== '') {
      query = query.gte('date', dateFrom.trim());
    }

    if (dateTo && dateTo.trim() !== '') {
      query = query.lte('date', dateTo.trim());
    }

    if (categoryFilter && categoryFilter !== 'all' && categoryFilter.trim() !== '') {
      // We need to filter by category through the penalty_catalog relationship
      const { data: penaltyTypes, error: catalogError } = await supabase
        .from('penalty_catalog')
        .select('id')
        .eq('category', categoryFilter.trim());
      
      if (catalogError) {
        console.error('Error fetching penalty types for category filter:', catalogError);
      } else if (penaltyTypes && penaltyTypes.length > 0) {
        const penaltyTypeIds = penaltyTypes.map(pt => pt.id);
        query = query.in('penalty_type_id', penaltyTypeIds);
      } else {
        // Return empty result if no penalty types found for the category
        return [];
      }
    }
    
    const { data, error } = await query.range(offset, offset + limit - 1);
    
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

  // Get recent penalties with pagination (only from active event)
  async getRecent(limit: number = 10, offset: number = 0): Promise<Penalty[]> {
    // First get the active event
    const { data: activeEvent } = await supabase.rpc('get_active_event');
    
    let query = supabase
      .from('penalties')
      .select(`
        *,
        member:members(*),
        penalty_type:penalty_catalog(*)
      `)
      .order('created_time', { ascending: false })
      .range(offset, offset + limit - 1);
    
    // Filter by active event if one exists
    if (activeEvent && activeEvent.length > 0) {
      query = query.eq('event_id', activeEvent[0].id);
    }
    
    const { data, error } = await query;
    
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
    event_id?: string;
  }): Promise<Penalty> {
    try {
      // Get current user session for tracking who assigned the penalty
      const session = await authService.getCurrentSession();
      
      // Get active event if no event_id provided
      let eventId = penalty.event_id;
      if (!eventId) {
        const { data: activeEvent } = await supabase.rpc('get_active_event');
        if (activeEvent && activeEvent.length > 0) {
          eventId = activeEvent[0].id;
        }
      }
      
      const penaltyData = {
        ...penalty,
        event_id: eventId,
        date: penalty.date || new Date().toISOString().split('T')[0],
        created_time: new Date().toISOString(),
        assigned_by_user_id: session?.user?.id || null
      };
      
      const { data, error } = await supabase
        .from('penalties')
        .insert([penaltyData])
        .select(`
          *,
          member:members(*),
          penalty_type:penalty_catalog(*)
        `)
        .single();
      
      if (error) throw error;
      return data as Penalty;
    } catch (error) {
      console.error('Error creating penalty:', error);
      throw error;
    }
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

  // Get the member with the most penalties (Zugsau) - only from active event
  async getZugsau(): Promise<{ member: any; totalAmount: number; penaltyCount: number } | null> {
    // First get the active event
    const { data: activeEvent } = await supabase.rpc('get_active_event');
    
    let query = supabase
      .from('members')
      .select(`
        *,
        penalties!inner(amount, event_id)
      `)
      .eq('is_active', true);

    const { data, error } = await query;

    if (error) throw error;
    
    if (!data || data.length === 0) return null;

    // Calculate totals for each member (filter penalties by active event)
    const memberStats = data.map(member => {
      // Filter penalties by active event
      const activePenalties = activeEvent && activeEvent.length > 0 
        ? member.penalties.filter((penalty: any) => penalty.event_id === activeEvent[0].id)
        : member.penalties;
        
      const totalAmount = activePenalties.reduce((sum: number, penalty: any) => sum + Number(penalty.amount), 0);
      const penaltyCount = activePenalties.length;
      
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