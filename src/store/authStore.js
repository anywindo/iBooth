import { create } from 'zustand';
import { supabase } from '../utils/supabase.js';

const extractError = (error, defaultMsg) => {
  return error?.message || defaultMsg;
};

export const useAuthStore = create((set, get) => {
  // Set up auth state listener once
  supabase.auth.onAuthStateChange(async (event, session) => {
    try {
      if (session) {
        const emailPrefix = session.user?.email ? session.user.email.split('@')[0] : 'User';
        
        // Unblock UI immediately with base user data
        set({ 
          user: { ...session.user, name: emailPrefix }, 
          isAuthenticated: true, 
          isLoading: false 
        });

        // Delay the profile fetch slightly to ensure the Supabase client has 
        // completely finished initializing its internal auth headers for INITIAL_SESSION
        setTimeout(async () => {
          try {
            const { data: profile, error } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();
              
            if (profile?.display_name) {
              set(state => ({ 
                user: { ...state.user, ...session.user, name: profile.display_name }
              }));
            }
          } catch (e) {
            console.error('Failed to fetch profile', e);
          }
        }, 100);
      } else {
        set({ user: null, isAuthenticated: false, isLoading: false });
      }
    } catch (err) {
      console.error('onAuthStateChange error:', err);
      set({ 
        user: session ? { ...session.user } : null, 
        isAuthenticated: !!session, 
        isLoading: false 
      });
    }
  });

  return {
    user: null,
    isAuthenticated: false,
    isLoading: true,
    
    checkAuth: async () => {
      // Prevent indefinite hanging by adding a timeout
      const timeoutId = setTimeout(() => {
        if (get().isLoading) {
          console.warn('checkAuth timed out');
          set({ isLoading: false });
        }
      }, 5000);

      try {
        set({ isLoading: true });
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        if (session) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
            
          const emailPrefix = session.user?.email ? session.user.email.split('@')[0] : 'User';
            
          set({ 
            user: { ...session.user, name: profile?.display_name || emailPrefix }, 
            isAuthenticated: true, 
            isLoading: false 
          });
        } else {
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      } catch (error) {
        console.error('checkAuth error:', error);
        set({ user: null, isAuthenticated: false, isLoading: false });
      } finally {
        clearTimeout(timeoutId);
      }
    },

    login: async ({ email, password }) => {
      try {
        const result = await Promise.race([
          supabase.auth.signInWithPassword({ email, password }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Login request timed out. Please refresh the page and try again.')), 10000))
        ]);
        if (result.error) throw result.error;
        return { success: true };
      } catch (error) {
        return { success: false, error: extractError(error, 'Login failed') };
      }
    },

    logout: async () => {
      try {
        await supabase.auth.signOut();
      } catch (error) {
        console.error('Logout failed', error);
      }
    },

    updateProfile: async (data) => {
      try {
        const user = get().user;
        if (!user) throw new Error('Not authenticated');

        let name = data.name;

        if (name) {
          const { error } = await supabase
            .from('profiles')
            .update({ display_name: name })
            .eq('id', user.id);
            
          if (error) throw error;
        }

        if (data.email && data.email !== user.email) {
          const { error } = await supabase.auth.updateUser({ email: data.email });
          if (error) throw error;
        }
        
        // Update local state
        set({ user: { ...user, name: name || user.name, email: data.email || user.email } });
        
        return { success: true };
      } catch (error) {
        return { success: false, error: extractError(error, 'Profile update failed') };
      }
    },

    updatePassword: async ({ current_password, password }) => {
      try {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        return { success: true };
      } catch (error) {
        return { success: false, error: extractError(error, 'Password update failed') };
      }
    },

    register: async ({ name, email, password }) => {
      try {
        const result = await Promise.race([
          supabase.auth.signUp({ 
            email, 
            password,
            options: { data: { display_name: name } }
          }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Registration request timed out. Please try again.')), 10000))
        ]);
        if (result.error) throw result.error;

        // Create profile
        if (result.data?.user) {
          await supabase.from('profiles').insert({
            id: result.data.user.id,
            display_name: name || email.split('@')[0]
          });
        }

        return { success: true };
      } catch (error) {
        return { success: false, error: extractError(error, 'Registration failed') };
      }
    },

    forgotPassword: async ({ email }) => {
      try {
        const result = await Promise.race([
          supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
          }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Reset password request timed out. Please try again.')), 10000))
        ]);
        if (result.error) throw result.error;
        return { success: true, message: 'Password reset link sent' };
      } catch (error) {
        return { success: false, error: extractError(error, 'Failed to send reset link') };
      }
    },

    resetPassword: async ({ password }) => {
      try {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        return { success: true, message: 'Password has been reset successfully' };
      } catch (error) {
        return { success: false, error: extractError(error, 'Failed to reset password') };
      }
    }
  };
});
