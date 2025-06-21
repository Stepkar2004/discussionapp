import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { User, FriendRequest, Friendship, FriendsState } from '../types';
import { useAuthStore } from './authStore';

export const useFriendsStore = create<FriendsState>()(
  persist(
    (set, get) => ({
      friends: [],
      friendRequests: [],

      sendFriendRequest: (toUserId: string) => {
        const currentUser = useAuthStore.getState().user;
        if (!currentUser) return;

        const existingRequest = get().friendRequests.find(
          req => req.fromUserId === currentUser.id && req.toUserId === toUserId && req.status === 'pending'
        );

        if (existingRequest) return;

        const newRequest: FriendRequest = {
          id: uuidv4(),
          fromUserId: currentUser.id,
          toUserId,
          status: 'pending',
          createdAt: new Date().toISOString()
        };

        set(state => ({
          friendRequests: [...state.friendRequests, newRequest]
        }));
      },

      acceptFriendRequest: (requestId: string) => {
        const currentUser = useAuthStore.getState().user;
        if (!currentUser) return;

        const request = get().friendRequests.find(req => req.id === requestId);
        if (!request || request.toUserId !== currentUser.id) return;

        // Mark request as accepted
        set(state => ({
          friendRequests: state.friendRequests.map(req =>
            req.id === requestId ? { ...req, status: 'accepted' as const } : req
          )
        }));

        // Add to friends list (get user info from stored users)
        const storedUsers = JSON.parse(localStorage.getItem('discussion-app-users') || '[]');
        const mockUsers = [
          {
            id: '1',
            username: 'admin',
            email: 'admin@discussion.app',
            displayName: 'Admin User',
            createdAt: '2024-01-01T00:00:00Z'
          }
        ];
        const allUsers = [...mockUsers, ...storedUsers];
        const friendUser = allUsers.find(u => u.id === request.fromUserId);

        if (friendUser) {
          set(state => ({
            friends: [...state.friends.filter(f => f.id !== friendUser.id), friendUser]
          }));
        }
      },

      declineFriendRequest: (requestId: string) => {
        const currentUser = useAuthStore.getState().user;
        if (!currentUser) return;

        set(state => ({
          friendRequests: state.friendRequests.map(req =>
            req.id === requestId && req.toUserId === currentUser.id
              ? { ...req, status: 'declined' as const }
              : req
          )
        }));
      },

      removeFriend: (friendId: string) => {
        set(state => ({
          friends: state.friends.filter(friend => friend.id !== friendId)
        }));
      }
    }),
    {
      name: 'discussion-app-friends'
    }
  )
);
