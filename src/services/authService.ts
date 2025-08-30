import { supabase } from '@/integrations/supabase/client';
import { UserProfile, Member } from '@/types';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials {
  email: string;
  password: string;
  memberId: string;
}

class AuthService {
  async signIn(credentials: LoginCredentials) {
    const { email, password } = credentials;
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;
    return data;
  }

  async signUp(credentials: SignupCredentials) {
    const { email, password, memberId } = credentials;
    
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl
      }
    });

    if (error) throw error;

    // Link the user to the member profile
    if (data.user && !error) {
      await this.linkUserToMember(data.user.id, memberId);
    }

    return data;
  }

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  async getCurrentSession() {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
  }

  async getCurrentUserProfile(): Promise<UserProfile | null> {
    const session = await this.getCurrentSession();
    if (!session?.user) return null;

    const { data, error } = await supabase.rpc('get_user_profile', {
      _user_id: session.user.id
    });

    if (error) throw error;
    
    if (!data || data.length === 0) return null;
    
    const profileData = data[0];
    return {
      user_id: profileData.user_id,
      member_id: profileData.member_id,
      is_oberadmin: profileData.is_oberadmin,
      is_chargierte: profileData.is_chargierte,
      member_data: profileData.member_data as unknown as Member
    };
  }

  async linkUserToMember(userId: string, memberId: string) {
    const { error } = await supabase
      .from('user_roles')
      .insert({
        user_id: userId,
        member_id: memberId,
        is_oberadmin: false
      });

    if (error) throw error;
  }

  async hasPermission(permission: 'oberadmin' | 'chargierte' | 'schuetze'): Promise<boolean> {
    const session = await this.getCurrentSession();
    if (!session?.user) return false;

    const { data, error } = await supabase.rpc('has_role', {
      _user_id: session.user.id,
      _role: permission
    });

    if (error) throw error;
    return data || false;
  }

  async getEligibleMembers(): Promise<Member[]> {
    // Get members who are not yet linked to users
    const { data: linkedMemberIds } = await supabase
      .from('user_roles')
      .select('member_id');

    const linkedIds = linkedMemberIds?.map(r => r.member_id) || [];

    const { data: members, error } = await supabase
      .from('members')
      .select('*')
      .eq('is_active', true)
      .not('id', 'in', `(${linkedIds.join(',')})`)
      .order('last_name');

    if (error) throw error;
    return members || [];
  }

  async updateUserRole(userId: string, isOberadmin: boolean) {
    const { error } = await supabase
      .from('user_roles')
      .update({ is_oberadmin: isOberadmin })
      .eq('user_id', userId);

    if (error) throw error;
  }

  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  }
}

export const authService = new AuthService();