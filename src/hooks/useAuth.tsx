import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { UserProfile } from '@/types';
import { authService } from '@/services/authService';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isOberadmin: boolean;
  isChargierte: boolean;
  isAuthenticated: boolean;
  signIn: (credentials: { email: string; password: string }) => Promise<void>;
  signUp: (credentials: { email: string; password: string; memberId: string }) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: (sessionToUse?: Session | null) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = async (sessionToUse?: Session | null) => {
    const currentSession = sessionToUse || session;
    if (currentSession?.user) {
      try {
        console.log('Refreshing profile for user:', currentSession.user.id);
        const profile = await authService.getCurrentUserProfile();
        console.log('Profile loaded:', profile);
        if (!profile) {
          console.error('No profile found for user - user may not be linked to a member record');
        }
        setUserProfile(profile);
      } catch (error) {
        console.error('Error refreshing profile:', error);
        console.error('Full error details:', error);
        setUserProfile(null);
      }
    } else {
      console.log('No session user, clearing profile - session:', !!currentSession, 'user:', !!currentSession?.user);
      setUserProfile(null);
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = authService.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change event:', event, 'Session:', !!session);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          console.log('Session user found, setting timeout to refresh profile');
          setTimeout(async () => {
            await refreshProfile(session);
          }, 0);
        } else {
          console.log('No session user, clearing profile');
          setUserProfile(null);
        }
        
        setLoading(false);
      }
    );

    // Get initial session
    authService.getCurrentSession().then((session) => {
      console.log('Initial session check:', !!session);
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        console.log('Initial session user found, refreshing profile');
        refreshProfile(session).finally(() => setLoading(false));
      } else {
        console.log('No initial session user found');
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (credentials: { email: string; password: string }) => {
    setLoading(true);
    try {
      await authService.signIn(credentials);
      // Auth state change will handle the rest
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const signUp = async (credentials: { email: string; password: string; memberId: string }) => {
    setLoading(true);
    try {
      await authService.signUp(credentials);
      // Auth state change will handle the rest
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await authService.signOut();
      setUser(null);
      setSession(null);
      setUserProfile(null);
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const isOberadmin = userProfile?.is_oberadmin || false;
  const isChargierte = userProfile?.is_chargierte || false;
  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        userProfile,
        loading,
        isOberadmin,
        isChargierte,
        isAuthenticated,
        signIn,
        signUp,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}