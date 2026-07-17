import { create } from 'zustand';
import { supabase } from '../utils/supabase.js';
import { isElectron } from '../core/platform.js';

const extractError = (error, defaultMsg) => {
  return error?.message || defaultMsg;
};

export const useAuthStore = create((set, get) => {
  // Set up auth state listener once
  supabase.auth.onAuthStateChange(async (event, session) => {
    try {
      if (session) {
        const emailPrefix = session.user?.email ? session.user.email.split('@')[0] : 'User';
        
        if (session.user) {
          localStorage.setItem('lastKnownName', emailPrefix);
        }
        
        // Unblock UI immediately with base user data
        set({ 
          user: { ...session.user, name: emailPrefix }, 
          isAuthenticated: true, 
          isLoading: false 
        });

        // Delay the profile fetch slightly to ensure the Supabase client has 
        // completely finished initializing its internal auth headers for INITIAL_SESSION
        // Use user_metadata or emailPrefix
        const name = session.user?.user_metadata?.display_name || emailPrefix;
        if (name) {
          localStorage.setItem('lastKnownName', name);
        }
        set(state => ({ 
          user: { ...state.user, ...session.user, name }
        }));
      } else {
        if (isElectron()) {
          set({ 
            user: { id: 'local', name: 'Local User', email: 'local@app.offline' }, 
            isAuthenticated: true, 
            isLoading: false 
          });
        } else {
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      }
    } catch (err) {
      console.error('onAuthStateChange error:', err);
      if (isElectron()) {
        set({ 
          user: session ? { ...session.user } : { id: 'local', name: 'Local User', email: 'local@app.offline' }, 
          isAuthenticated: true, 
          isLoading: false 
        });
      } else {
        set({ 
          user: session ? { ...session.user } : null, 
          isAuthenticated: !!session, 
          isLoading: false 
        });
      }
    }
  });

  return {
    user: null,
    isAuthenticated: false,
    isLoading: true,
    
    checkAuth: async () => {
      if (isElectron()) {
        set({ 
          user: { id: 'local', name: 'Local User', email: 'local@app.offline' }, 
          isAuthenticated: true, 
          isLoading: false 
        });
        // We still check Supabase in the background if online, but we don't block
      }

      // Prevent indefinite hanging by adding a timeout
      const timeoutId = setTimeout(() => {
        if (get().isLoading) {
          console.warn('checkAuth timed out');
          set({ isLoading: false });
        }
      }, 5000);

      try {
        if (!isElectron()) {
          set({ isLoading: true });
        }
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        if (session) {
          const name = session.user?.user_metadata?.display_name;
            
          const emailPrefix = session.user?.email ? session.user.email.split('@')[0] : 'User';
          
          const resolvedName = name || emailPrefix;
          if (resolvedName) {
            localStorage.setItem('lastKnownName', resolvedName);
          }
            
          set({ 
            user: { ...session.user, name: resolvedName }, 
            isAuthenticated: true, 
            isLoading: false 
          });
        } else {
          if (!isElectron()) {
            set({ user: null, isAuthenticated: false, isLoading: false });
          }
        }
      } catch (error) {
        console.error('checkAuth error:', error);
        if (!isElectron()) {
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      } finally {
        clearTimeout(timeoutId);
      }
    },

    login: async (params) => {
      try {
        const email = (typeof params === 'object' ? params.email : params)?.trim();
        const password = typeof params === 'object' ? params.password : undefined;
        const captchaToken = typeof params === 'object' ? params.captchaToken : undefined;
        
        const signInOptions = { email, password };
        if (captchaToken) {
          signInOptions.options = { captchaToken };
        }
        
        const result = await Promise.race([
          supabase.auth.signInWithPassword(signInOptions),
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
          const { error } = await supabase.auth.updateUser({ data: { display_name: name } });
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

    register: async (params) => {
      try {
        const email = (typeof params === 'object' ? params.email : params)?.trim();
        const password = typeof params === 'object' ? params.password : undefined;
        const name = typeof params === 'object' ? params.name : undefined;
        const captchaToken = typeof params === 'object' ? params.captchaToken : undefined;
        
        const options = { 
          data: { display_name: name },
          emailRedirectTo: `${window.location.origin}/`
        };
        if (captchaToken) {
          options.captchaToken = captchaToken;
        }
        
        const result = await Promise.race([
          supabase.auth.signUp({
            email,
            password,
            options
          }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Registration request timed out. Please try again.')), 10000))
        ]);
        if (result.error) throw result.error;

        // If session is null, email confirmation is required by Supabase settings
        const requiresEmailConfirmation = !result.data?.session && result.data?.user;

        return { success: true, requiresEmailConfirmation };
      } catch (error) {
        return { success: false, error: extractError(error, 'Registration failed') };
      }
    },

    forgotPassword: async (params) => {
      try {
        const email = (typeof params === 'object' ? params.email : params)?.trim();
        if (!email) {
          throw new Error('Email is missing in forgotPassword call');
        }
        const result = await Promise.race([
          supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
          }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Reset password request timed out. Please try again.')), 10000))
        ]);
        if (result.error) throw result.error;
        return { success: true, message: 'Password reset link sent' };
      } catch (error) {
        return { success: false, error: extractError(error, 'Password reset failed') };
      }
    },

    signInWithGoogle: async () => {
      try {
        const result = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${window.location.origin}/profile`
          }
        });
        if (result.error) throw result.error;
        return { success: true };
      } catch (error) {
        return { success: false, error: extractError(error, 'Google sign in failed') };
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
