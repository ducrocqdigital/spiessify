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
    // For the first signup, check if this should be an oberadmin
    if (data.user && !error) {
      // Check if any oberadmin exists yet
      const { data: existingOberadmin } = await supabase
        .from('user_roles')
        .select('id')
        .eq('is_oberadmin', true)
        .limit(1);
      
      const isFirstOberadmin = !existingOberadmin || existingOberadmin.length === 0;
      await this.linkUserToMember(data.user.id, memberId, isFirstOberadmin);
    }

    return data;
  }

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth?reset=true`
    });
    if (error) throw error;
  }

  async getCurrentSession() {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
  }

  async getCurrentUserProfile(): Promise<UserProfile | null> {
    const session = await this.getCurrentSession();
    if (!session?.user) {
      console.log('No session in getCurrentUserProfile');
      return null;
    }

    console.log('Fetching profile for user:', session.user.id);

    try {
      // Query user_roles directly instead of using RPC
      const { data: userRole, error } = await supabase
        .from('user_roles')
        .select(`
          *,
          member:members(*)
        `)
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user profile:', error);
        throw error;
      }

      if (!userRole) {
        console.log('No user role found for user:', session.user.id);
        return null;
      }

      console.log('User role found:', userRole);

      // Define leadership ranks that count as "chargierte"
      const chargiereRanks = ['leutnant', 'oberleutnant', 'hauptmann', 'major', 'oberst'];
      const isChargierte = userRole.member?.rank ? chargiereRanks.includes(userRole.member.rank) : false;

      return {
        user_id: userRole.user_id,
        member_id: userRole.member_id,
        is_oberadmin: userRole.is_oberadmin,
        is_chargierte: isChargierte,
        member_data: userRole.member as unknown as Member
      };
    } catch (error) {
      console.error('Error in getCurrentUserProfile:', error);
      throw error;
    }
  }

  async linkUserToMember(userId: string, memberId: string, isOberadmin: boolean = false) {
    const { error } = await supabase.rpc('link_user_to_member_on_signup', {
      _user_id: userId,
      _member_id: memberId,
      _is_oberadmin: isOberadmin
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