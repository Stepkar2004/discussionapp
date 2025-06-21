// src/stores/friendsStore.ts

import { create } from 'zustand';
import { getSupabase } from '../lib/supabaseClient';
import { User, FriendRequest, FriendsState } from '../types';
import { useAuthStore } from './authStore';
import { Database } from '../types/database.types';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];

const mapProfileRowToUser = (profile: ProfileRow): User => ({
  id: profile.id,
  username: profile.username,
  displayName: profile.display_name || '',
  email: '', // Email is not public, so we don't fetch it for friends
  avatar: profile.avatar_url || undefined,
  createdAt: profile.created_at,
});

export const useFriendsStore = create<FriendsState>()(
  (set, get) => ({
    friends: [],
    friendRequests: [],

    fetchFriends: async () => {
      const user = useAuthStore.getState().user;
      if (!user) return;

      // We use a remote procedure call (RPC) to a database function for this
      // complex query. We will create this function in the next step.
      const { data, error } = await getSupabase().rpc('get_friends_for_user', { user_id: user.id });

      if (error) {
        console.error('Error fetching friends:', error);
        set({ friends: [] });
        return;
      }
      
      const friendsList = data.map(mapProfileRowToUser);
      set({ friends: friendsList });
    },

    fetchFriendRequests: async () => {
      const user = useAuthStore.getState().user;
      if (!user) return;

      const { data, error } = await getSupabase()
        .from('friend_requests')
        .select('*')
        .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)
        .in('status', ['pending', 'accepted']); // Also fetch accepted to know who are friends

      if (error) {
        console.error('Error fetching friend requests:', error);
        set({ friendRequests: [] });
        return;
      }

      const requests = data.map(req => ({
        id: req.id,
        fromUserId: req.from_user_id,
        toUserId: req.to_user_id,
        status: req.status as 'pending' | 'accepted' | 'declined',
        createdAt: req.created_at,
      }));
      
      set({ friendRequests: requests });
    },
    
    sendFriendRequest: async (toUserId: string) => {
      const user = useAuthStore.getState().user;
      if (!user) return false;

      // Prevent sending request to self or existing friends/requests
      const { friends, friendRequests } = get();
      if (toUserId === user.id || friends.some(f => f.id === toUserId) || friendRequests.some(r => (r.fromUserId === user.id && r.toUserId === toUserId) || (r.fromUserId === toUserId && r.toUserId === user.id))) {
          return false;
      }

      const { error } = await getSupabase().from('friend_requests').insert({
        from_user_id: user.id,
        to_user_id: toUserId,
        status: 'pending',
      });

      if (error) {
        console.error('Error sending friend request:', error);
        return false;
      }

      // Re-fetch requests to update the UI state
      await get().fetchFriendRequests();
      return true;
    },

    acceptFriendRequest: async (requestId: string) => {
        const user = useAuthStore.getState().user;
        if (!user) return;

        // We will create a database function to handle this atomically
        const { error } = await getSupabase().rpc('accept_friend_request', { request_id: requestId, user_id: user.id });

        if(error) {
            console.error('Error accepting friend request:', error);
            throw error;
        }

        // Re-fetch both friends and requests to get the latest state
        await Promise.all([get().fetchFriends(), get().fetchFriendRequests()]);
    },

    declineFriendRequest: async (requestId: string) => {
      const { error } = await getSupabase()
        .from('friend_requests')
        .update({ status: 'declined' })
        .eq('id', requestId);

      if (error) {
        console.error('Error declining friend request:', error);
        throw error;
      }
      
      await get().fetchFriendRequests();
    },

    removeFriend: async (friendId: string) => {
      const user = useAuthStore.getState().user;
      if (!user) return;

      const { error } = await getSupabase().rpc('remove_friend', { user_id: user.id, friend_id: friendId });
      
      if (error) {
        console.error('Error removing friend:', error);
        throw error;
      }
      
      await get().fetchFriends();
    },
  })
);