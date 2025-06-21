// src/components/friends/FriendsPage.tsx

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Users, UserPlus, Search, Check, X, Mail, Clock, MessageSquare } from 'lucide-react';
import { useFriendsStore } from '../../stores/friendsStore';
import { useAuthStore } from '../../stores/authStore';
import { useDiscussionsStore } from '../../stores/discussionsStore';
import { formatTimeAgo, searchInText } from '../../lib/utils';
import { AddFriendModal } from './AddFriendModal';
import { User } from '../../types';
import { getSupabase } from '../../lib/supabaseClient';

export function FriendsPage() {
  const [activeTab, setActiveTab] = useState<'friends' | 'requests'>('friends');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [requestProfiles, setRequestProfiles] = useState<User[]>([]); // State to hold profiles for requests

  const { 
    friends, 
    friendRequests, 
    acceptFriendRequest, 
    declineFriendRequest, 
    removeFriend,
    fetchFriends,
    fetchFriendRequests
  } = useFriendsStore();
  
  const { user } = useAuthStore();
  const { discussions } = useDiscussionsStore();

  const fetchRequestProfiles = useCallback(async () => {
    if (friendRequests.length === 0) {
        setRequestProfiles([]);
        return;
    }
    // Get all unique user IDs from the friend requests
    const userIds = [...new Set(friendRequests.flatMap(req => [req.fromUserId, req.toUserId]))];
    
    const { data, error } = await getSupabase()
        .from('profiles')
        .select('*')
        .in('id', userIds);

    if (error) {
        console.error("Error fetching profiles for requests:", error);
        setRequestProfiles([]);
    } else {
        const profiles = data.map(p => ({
            id: p.id,
            username: p.username,
            displayName: p.display_name || '',
            email: '',
            avatar: p.avatar_url || undefined,
            createdAt: p.created_at,
        }));
        setRequestProfiles(profiles);
    }
  }, [friendRequests]);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      // Fetch core data first
      await Promise.all([fetchFriends(), fetchFriendRequests()]);
      setIsLoading(false); // Set loading to false after core data is fetched
    };
    if (user) {
      loadData();
    }
  }, [user, fetchFriends, fetchFriendRequests]);

  // This effect runs after friendRequests has been updated
  useEffect(() => {
    fetchRequestProfiles();
  }, [friendRequests, fetchRequestProfiles]);

  const pendingRequests = useMemo(() => {
    return friendRequests.filter(req => req.toUserId === user?.id && req.status === 'pending');
  }, [friendRequests, user?.id]);

  const sentRequests = useMemo(() => {
    return friendRequests.filter(req => req.fromUserId === user?.id && req.status === 'pending');
  }, [friendRequests, user?.id]);

  const filteredFriends = useMemo(() => {
    if (!searchQuery.trim()) return friends;
    return friends.filter(friend =>
      searchInText(friend.displayName, searchQuery) ||
      searchInText(friend.username, searchQuery)
    );
  }, [friends, searchQuery]);

  // This function now uses the state we fetched from the database
  const getUserById = (userId: string): User | undefined => {
    return requestProfiles.find(p => p.id === userId);
  };

  const getFriendDiscussions = (friendId: string) => {
    return discussions.filter(d => d.creatorId === friendId && (d.privacy === 'public' || d.privacy === 'friends')).length;
  };

  const handleRemoveFriend = async (friendId: string, friendName: string) => {
    if (window.confirm(`Are you sure you want to remove ${friendName} from your friends?`)) {
      await removeFriend(friendId);
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    await acceptFriendRequest(requestId);
  };

  const handleDeclineRequest = async (requestId: string) => {
    await declineFriendRequest(requestId);
  };

  const tabs = [
    { id: 'friends', label: 'Friends', count: friends.length },
    { id: 'requests', label: 'Requests', count: pendingRequests.length },
  ];

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-full p-6">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
      );
    }
    
    // ... The JSX for rendering the friends tab and requests tab remains largely the same
    // but will now work correctly because getUserById has the correct data.
    // I'm including the full return block for completeness.

    if (activeTab === 'friends') {
        return (
          <div className="p-6">
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input type="text" placeholder="Search friends..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            {filteredFriends.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-900 mb-2">{searchQuery ? 'No friends found' : 'No friends yet'}</p>
                <p className="text-gray-600 mb-4">{searchQuery ? 'Try adjusting your search terms' : 'Use the "Add Friend" button to connect with others!'}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredFriends.map((friend) => (
                  <div key={friend.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3"><div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center"><span className="text-white font-medium text-sm">{friend.displayName?.charAt(0) || friend.username?.charAt(0) || 'U'}</span></div><div><h3 className="font-medium text-gray-900">{friend.displayName}</h3><p className="text-sm text-gray-600">@{friend.username}</p></div></div>
                      <button onClick={() => handleRemoveFriend(friend.id, friend.displayName)} className="text-gray-400 hover:text-red-600 transition-colors" title="Remove friend"><X className="w-4 h-4" /></button>
                    </div>
                    <div className="space-y-2 text-sm text-gray-600"><div className="flex items-center space-x-2"><MessageSquare className="w-4 h-4" /><span className="truncate">{getFriendDiscussions(friend.id)} shared discussions</span></div></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      }
      
      if (activeTab === 'requests') {
          return (
            <div className="p-6 space-y-6">
              {pendingRequests.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Incoming Requests ({pendingRequests.length})</h3>
                  <div className="space-y-4">
                    {pendingRequests.map((request) => {
                      const sender = getUserById(request.fromUserId);
                      if (!sender) return <div key={request.id} className="p-4 bg-gray-100 rounded-lg text-sm text-gray-500">Loading request details...</div>;
                      return (
                        <div key={request.id} className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center"><span className="text-white font-medium text-sm">{sender.displayName?.charAt(0) || 'U'}</span></div>
                            <div><h4 className="font-medium text-gray-900">{sender.displayName}</h4><p className="text-sm text-gray-600">@{sender.username}</p><p className="text-xs text-gray-500">Sent {formatTimeAgo(request.createdAt)}</p></div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button onClick={() => handleAcceptRequest(request.id)} className="flex items-center space-x-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"><Check className="w-4 h-4" /><span>Accept</span></button>
                            <button onClick={() => handleDeclineRequest(request.id)} className="flex items-center space-x-1 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"><X className="w-4 h-4" /><span>Decline</span></button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
               {sentRequests.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Sent Requests ({sentRequests.length})</h3>
                    <div className="space-y-4">
                      {sentRequests.map((request) => {
                        const recipient = getUserById(request.toUserId);
                        if (!recipient) return <div key={request.id} className="p-4 bg-gray-100 rounded-lg text-sm text-gray-500">Loading request details...</div>;
                        return (
                           <div key={request.id} className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg">
                              <div className="flex items-center space-x-3">
                                  <div className="w-10 h-10 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center"><span className="text-white font-medium text-sm">{recipient.displayName?.charAt(0) || 'U'}</span></div>
                                  <div><h4 className="font-medium text-gray-900">{recipient.displayName}</h4><p className="text-sm text-gray-600">@{recipient.username}</p><p className="text-xs text-gray-500">Sent {formatTimeAgo(request.createdAt)}</p></div>
                              </div>
                              <div className="flex items-center space-x-2 text-gray-500"><Clock className="w-4 h-4" /><span>Pending</span></div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              {pendingRequests.length === 0 && sentRequests.length === 0 && (
                <div className="text-center py-12"><Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" /><p className="text-lg font-medium text-gray-900 mb-2">No friend requests</p><p className="text-gray-600">This is where you'll see incoming and outgoing friend requests.</p></div>
              )}
            </div>
          );
      }
  }

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <div><h1 className="text-2xl font-bold text-gray-900">Friends</h1><p className="text-gray-600 mt-1">Manage your connections and collaborate on discussions</p></div>
          <button onClick={() => setShowAddModal(true)} className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"><UserPlus className="w-4 h-4" /><span>Add Friend</span></button>
        </div>
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === tab.id ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>
              <span>{tab.label}</span>
              {tab.count > 0 && <span className={`px-2 py-1 rounded-full text-xs font-medium ${activeTab === tab.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-600'}`}>{tab.count}</span>}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">{renderContent()}</div>
      {showAddModal && <AddFriendModal onClose={() => setShowAddModal(false)} />}
    </div>
  );
}