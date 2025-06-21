// src/components/dashboard/Dashboard.tsx

import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { MessageSquare, Users, TrendingUp, Plus, Clock, Globe, Lock, Eye } from 'lucide-react';
import { useDiscussionsStore } from '../../stores/discussionsStore';
import { useFriendsStore } from '../../stores/friendsStore';
import { useAuthStore } from '../../stores/authStore';
import { formatTimeAgo } from '../../lib/utils';
import { Discussion, User } from '../../types';
import { getSupabase } from '../../lib/supabaseClient';

interface DashboardProps {
  onCreateDiscussion: () => void;
  onViewDiscussion: (discussion: Discussion) => void;
  onViewFriends: () => void;
  onViewChange: (view: string) => void; // Prop for "View all"
}

export function Dashboard({ onCreateDiscussion, onViewDiscussion, onViewFriends, onViewChange }: DashboardProps) {
  // --- Start of New Code ---
  const [isLoading, setIsLoading] = useState(true);
  const [creatorProfiles, setCreatorProfiles] = useState<User[]>([]);
  
  const { discussions, fetchDiscussions } = useDiscussionsStore();
  const { friends, friendRequests, fetchFriends, fetchFriendRequests } = useFriendsStore();
  const { user } = useAuthStore();

  // Fetch all data needed for the dashboard on initial component load
  useEffect(() => {
    const loadDashboardData = async () => {
        setIsLoading(true);
        await Promise.all([
            fetchDiscussions(),
            fetchFriends(),
            fetchFriendRequests(),
        ]);
        setIsLoading(false);
    };
    loadDashboardData();
  }, [fetchDiscussions, fetchFriends, fetchFriendRequests]);
  // --- End of New Code ---

  const stats = useMemo(() => {
    const myDiscussions = discussions.filter(d => d.creatorId === user?.id);
    const publicDiscussions = discussions.filter(d => d.privacy === 'public');
    const pendingRequests = friendRequests.filter(req => 
      req.toUserId === user?.id && req.status === 'pending'
    );

    return {
      totalDiscussions: discussions.length,
      myDiscussions: myDiscussions.length,
      publicDiscussions: publicDiscussions.length,
      friends: friends.length,
      pendingRequests: pendingRequests.length
    };
  }, [discussions, friends, friendRequests, user?.id]);

  const recentDiscussions = useMemo(() => {
    // YOUR ORIGINAL, CORRECT LOGIC IS PRESERVED HERE
    return discussions
      .filter(d => 
        d.privacy === 'public' || 
        d.creatorId === user?.id ||
        (d.privacy === 'friends' && friends.some(f => f.id === d.creatorId))
      )
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5);
  }, [discussions, user?.id, friends]);

  // --- Start of New Code ---
  const fetchRecentDiscussionCreators = useCallback(async () => {
      if (recentDiscussions.length === 0) return;
      
      const creatorIds = [...new Set(recentDiscussions.map(d => d.creatorId))];
      const { data, error } = await getSupabase()
          .from('profiles')
          .select('id, username, display_name, created_at, avatar_url') // Select only needed fields
          .in('id', creatorIds);

      if (error) {
          console.error("Error fetching dashboard creators:", error);
      } else {
          const profiles: User[] = data.map(p => ({
              id: p.id,
              username: p.username,
              displayName: p.display_name || p.username,
              email: '', // Not needed
              createdAt: p.created_at,
              avatar: p.avatar_url || undefined,
          }));
          setCreatorProfiles(profiles);
      }
  }, [recentDiscussions]);

  useEffect(() => {
    // This effect runs whenever the list of recent discussions changes
    fetchRecentDiscussionCreators();
  }, [recentDiscussions, fetchRecentDiscussionCreators]);

  const getCreatorName = (creatorId: string) => {
    const creator = creatorProfiles.find(p => p.id === creatorId);
    return creator?.displayName || '...'; // Show '...' while profiles are loading
  };
  // --- End of New Code ---
  
  const getPrivacyIcon = (privacy: string) => {
    switch (privacy) {
      case 'public':
        return <Globe className="w-4 h-4 text-green-600" />;
      case 'friends':
        return <Users className="w-4 h-4 text-blue-600" />;
      case 'private':
        return <Lock className="w-4 h-4 text-gray-600" />;
      default:
        return <Globe className="w-4 h-4 text-green-600" />;
    }
  };

  // The rest of the return statement is your original code,
  // with only the two necessary fixes applied.
  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.displayName || user?.username}! 👋
          </h1>
          <p className="text-gray-600">
            Here's what's happening in your discussion community.
          </p>
        </div>

        {/* Stats Cards */}
        {/* This section is unchanged */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"><div className="flex items-center"><div className="p-2 bg-blue-100 rounded-lg"><MessageSquare className="w-6 h-6 text-blue-600" /></div><div className="ml-4"><p className="text-sm font-medium text-gray-600">My Discussions</p><p className="text-2xl font-bold text-gray-900">{stats.myDiscussions}</p></div></div></div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"><div className="flex items-center"><div className="p-2 bg-green-100 rounded-lg"><Globe className="w-6 h-6 text-green-600" /></div><div className="ml-4"><p className="text-sm font-medium text-gray-600">Public Discussions</p><p className="text-2xl font-bold text-gray-900">{stats.publicDiscussions}</p></div></div></div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"><div className="flex items-center"><div className="p-2 bg-purple-100 rounded-lg"><Users className="w-6 h-6 text-purple-600" /></div><div className="ml-4"><p className="text-sm font-medium text-gray-600">Friends</p><p className="text-2xl font-bold text-gray-900">{stats.friends}</p></div></div></div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"><div className="flex items-center"><div className="p-2 bg-orange-100 rounded-lg"><TrendingUp className="w-6 h-6 text-orange-600" /></div><div className="ml-4"><p className="text-sm font-medium text-gray-600">Total Discussions</p><p className="text-2xl font-bold text-gray-900">{stats.totalDiscussions}</p></div></div></div>
        </div>

        {/* Quick Actions */}
        {/* This section is unchanged */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <button onClick={onCreateDiscussion} className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-sm hover:from-blue-600 hover:to-blue-700 transition-all transform hover:scale-105"><div className="flex items-center"><Plus className="w-8 h-8 mr-4" /><div className="text-left"><h3 className="text-lg font-semibold">Create Discussion</h3><p className="text-blue-100">Start a new argument visualization</p></div></div></button>
          <button onClick={onViewFriends} className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-xl shadow-sm hover:from-purple-600 hover:to-purple-700 transition-all transform hover:scale-105"><div className="flex items-center"><Users className="w-8 h-8 mr-4" /><div className="text-left"><h3 className="text-lg font-semibold">Manage Friends</h3><p className="text-purple-100">{stats.pendingRequests > 0 ? `${stats.pendingRequests} pending requests` : 'Connect with others'}</p></div></div></button>
          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-xl shadow-sm"><div className="flex items-center"><TrendingUp className="w-8 h-8 mr-4" /><div className="text-left"><h3 className="text-lg font-semibold">Activity</h3><p className="text-green-100">Explore trending discussions</p></div></div></div>
        </div>

        {/* Recent Discussions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Recent Discussions</h2>
              {/* FIX #1: "View all" button now works */}
              <button
                onClick={() => onViewChange('discussions')}
                className="text-blue-600 hover:text-blue-700 font-medium text-sm"
              >
                View all
              </button>
            </div>
          </div>

          <div className="p-6">
            {isLoading ? (
                <div className="text-center py-8 text-gray-500">Loading recent discussions...</div>
            ) : recentDiscussions.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No discussions yet</p>
                <button onClick={onCreateDiscussion} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  Create your first discussion
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {recentDiscussions.map((discussion) => (
                  <div
                    key={discussion.id}
                    onClick={() => onViewDiscussion(discussion)}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group"
                  >
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors truncate">{discussion.title}</h3>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-1">{discussion.description}</p>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                        <div className="flex items-center space-x-1">{getPrivacyIcon(discussion.privacy)}<span className="capitalize">{discussion.privacy}</span></div>
                        <div className="flex items-center space-x-1"><Clock className="w-3 h-3" /><span>{formatTimeAgo(discussion.updatedAt)}</span></div>
                        {/* FIX #2: Creator name is now fetched */}
                        <span>By {getCreatorName(discussion.creatorId)}</span>
                      </div>
                    </div>
                    <div className="ml-4"><Eye className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" /></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}