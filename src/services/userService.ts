import { supabase } from '@/integrations/supabase/client';

export const userService = {
  async getUserByUserId(userId: string) {
    const { data, error } = await supabase
      .from('user_roles')
      .select(`
        *,
        member:members(*)
      `)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async getAssignedByInfo(penalty: any) {
    if (!penalty.assigned_by_user_id) return null;
    
    try {
      const userData = await this.getUserByUserId(penalty.assigned_by_user_id);
      return userData?.member ? userData.member : null;
    } catch (error) {
      console.error('Error fetching assigned-by info:', error);
      return null;
    }
  }
};