// src/stores/authStore.ts

import { create } from 'zustand';
import { getSupabase } from '../lib/supabaseClient';
import { User, AuthState, Session } from '../types';

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  session: null,
  isAuthenticated: false,

  login: async (email, password) => {
    const { error } = await getSupabase().auth.signInWithPassword({ email, password });
    if (error) {
      console.error('Login Error:', error.message);
      return false;
    }
    return true; // The listener will handle the UI update
  },

  register: async (userData) => {
    const { email, password, username, displayName } = userData;
    const { error } = await getSupabase().auth.signUp({
      email,
      password,
      options: { data: { username: username.toLowerCase(), displayName } },
    });
    if (error) {
      console.error('Registration Error:', error.message);
      return false;
    }
    return true; // The listener will handle the UI update
  },

  logout: async () => {
    await getSupabase().auth.signOut();
    // The listener will handle the UI update
  },

  _init: () => {
    // --- The Listener is now "Fire and Forget" ---
    getSupabase().auth.onAuthStateChange((_event, session) => {
      if (session) {
        // We have a session. Kick off the process to get the profile and update state.
        // DO NOT await this. Let it run in the background.
        // This prevents the listener from deadlocking the Supabase client.
        (async () => {
          const { data: profile } = await getSupabase()
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          if (profile) {
              set({ 
                  isAuthenticated: true, 
                  user: {
                    id: profile.id,
                    username: profile.username,
                    email: session.user.email!,
                    displayName: profile.display_name || '',
                    avatar: profile.avatar_url || undefined,
                    createdAt: profile.created_at,
                  }, 
                  session 
              });
          } else {
              // Profile is missing, something is wrong. Log out.
              await getSupabase().auth.signOut();
          }
        })();
      } else {
        // Session is null, user is logged out. This is a synchronous state update.
        set({ isAuthenticated: false, user: null, session: null });
      }
    });

    // We still need an initial check for the very first page load, as the listener might
    // not fire for an existing session right away.
    (async () => {
        const { data: { session } } = await getSupabase().auth.getSession();
        if (session) {
            const { data: profile } = await getSupabase().from('profiles').select('*').eq('id', session.user.id).single();
            if (profile) {
                set({ 
                    isAuthenticated: true, 
                    user: {
                        id: profile.id,
                        username: profile.username,
                        email: session.user.email!,
                        displayName: profile.display_name || '',
                        avatar: profile.avatar_url || undefined,
                        createdAt: profile.created_at,
                    }, 
                    session 
                });
            }
        }
    })();
  },
}));

useAuthStore.getState()._init();