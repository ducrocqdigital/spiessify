import { supabase } from '@/integrations/supabase/client';
import { Member, MemberRank } from '@/types';

export const memberService = {
  // Get all members
  async getAll(): Promise<Member[]> {
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .order('last_name', { ascending: true });
    
    if (error) throw error;
    return data || [];
  },

  // Get only active members
  async getActive(): Promise<Member[]> {
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .eq('is_active', true)
      .order('last_name', { ascending: true });
    
    if (error) throw error;
    return data || [];
  },

  // Get member by ID
  async getById(id: string): Promise<Member | null> {
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Create new member
  async create(member: Omit<Member, 'id' | 'created_at' | 'updated_at'>): Promise<Member> {
    const { data, error } = await supabase
      .from('members')
      .insert([member])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Update member
  async update(id: string, updates: Partial<Member>): Promise<Member> {
    const { data, error } = await supabase
      .from('members')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Delete member
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('members')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // Toggle active status
  async toggleActive(id: string): Promise<Member> {
    const member = await this.getById(id);
    if (!member) throw new Error('Member not found');
    
    return this.update(id, { is_active: !member.is_active });
  },

  // Upload profile photo
  async uploadProfilePhoto(memberId: string, file: File): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${memberId}-${Date.now()}.${fileExt}`;
    const filePath = `profiles/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('member-photos')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('member-photos')
      .getPublicUrl(filePath);

    // Update member with photo URL
    await this.update(memberId, { profile_photo: publicUrl });

    return publicUrl;
  },

  // Get member display name (nickname or first+last name)
  getDisplayName(member: Member): string {
    return member.nickname || `${member.first_name} ${member.last_name}`;
  },

  // Get member with penalty statistics
  async getMembersWithStats(): Promise<Member[]> {
    const { data, error } = await supabase
      .from('members')
      .select(`
        *,
        penalties!inner(
          amount
        )
      `)
      .eq('is_active', true);

    if (error) throw error;

    // Calculate stats for each member
    return (data || []).map(member => {
      const penalties = member.penalties || [];
      return {
        ...member,
        totalPenalties: penalties.length,
        totalAmount: penalties.reduce((sum: number, p: any) => sum + Number(p.amount), 0),
        penalties: undefined // Remove the raw penalties data
      };
    });
  }
};