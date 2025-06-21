// src/stores/authStore.ts

import { create } from 'zustand';
import { supabase } from '../lib/supabaseClient';
import { User, AuthState } from '../types';

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  session: null,
  isAuthenticated: false,

  login: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      console.error('Login Error:', error.message);
      return false;
    }
    // Auth state change will be handled by the listener
    return true;
  },

  register: async (userData) => {
    const { email, password, username, displayName } = userData;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username.toLowerCase(),
          displayName: displayName,
          // We can add a default avatar later if we want
          // avatar_url: `https://...`
        },
      },
    });

    if (error) {
      console.error('Registration Error:', error.message);
      return false;
    }
    // Auth state change will be handled by the listener
    return true;
  },

  logout: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Logout Error:', error.message);
    }
    // The listener will handle setting state to logged-out
  },

  _init: async () => {
    // This handles the case where the user is already logged in
    // when the application loads.
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { data: profile } = await supabase
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
            email: session.user.email!, // Email is from the secure user object
            displayName: profile.display_name,
            avatar: profile.avatar_url,
            createdAt: profile.created_at,
          }, 
          session 
        });
      }
    }

    // This is the main listener for auth changes.
    supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        // User is logged in
        const { data: profile } = await supabase
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
                  displayName: profile.display_name,
                  avatar: profile.avatar_url,
                  createdAt: profile.created_at,
                }, 
                session 
            });
        }
      } else {
        // User is logged out
        set({ isAuthenticated: false, user: null, session: null });
      }
    });
  },
}));

// Initialize the auth listener when the app starts
useAuthStore.getState()._init();