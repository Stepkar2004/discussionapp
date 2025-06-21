// src/components/friends/AddFriendModal.tsx

import React, { useState, useMemo, useCallback } from 'react';
import { X, UserPlus, Search, Send } from 'lucide-react';
import { useFriendsStore } from '../../stores/friendsStore';
import { useAuthStore } from '../../stores/authStore';
import { getSupabase } from '../../lib/supabaseClient';
import { User } from '../../types';
import { useDebounce } from '../../hooks/useDebounce'; // We will create this hook next

interface AddFriendModalProps {
  onClose: () => void;
}

export function AddFriendModal({ onClose }: AddFriendModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const { sendFriendRequest, friends, friendRequests } = useFriendsStore();
  const { user } = useAuthStore();

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const searchUsers = useCallback(async (query: string) => {
    if (query.length < 2) {
        setSearchResults([]);
        return;
    }
    setIsLoading(true);
    const { data, error } = await getSupabase()
        .from('profiles')
        .select('*')
        .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
        .neq('id', user?.id || '') // Exclude self
        .limit(10);
    
    if (error) {
        console.error("Error searching users:", error);
    } else {
        const foundUsers = data.map(p => ({
            id: p.id,
            username: p.username,
            displayName: p.display_name || '',
            email: '', // Don't expose email in search
            avatar: p.avatar_url || undefined,
            createdAt: p.created_at,
        }));
        setSearchResults(foundUsers);
    }
    setIsLoading(false);
  }, [user?.id]);

  React.useEffect(() => {
    searchUsers(debouncedSearchQuery);
  }, [debouncedSearchQuery, searchUsers]);

  const getUserStatus = (userId: string) => {
    if (friends.some(f => f.id === userId)) return 'friend';
    const hasRequest = friendRequests.some(req => 
      (req.fromUserId === user?.id && req.toUserId === userId) ||
      (req.fromUserId === userId && req.toUserId === user?.id)
    );
    if (hasRequest) return 'pending';
    return 'none';
  };

  const handleSendRequest = async (toUserId: string, displayName: string) => {
    setMessage(null);
    const success = await sendFriendRequest(toUserId);
    if (success) {
      setMessage({ type: 'success', text: `Friend request sent to ${displayName}!` });
    } else {
      setMessage({ type: 'error', text: 'Failed to send request. You may already be friends or a request is pending.' });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2"><UserPlus className="w-5 h-5 text-blue-600" /><h2 className="text-lg font-semibold text-gray-900">Add Friend</h2></div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 transition-colors"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input type="text" placeholder="Search by username or display name..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" autoFocus />
          </div>
          {message && <div className={`mb-4 p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>{message.text}</div>}
        </div>
        
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {isLoading && <div className="text-center py-8 text-gray-500">Searching...</div>}
          {!isLoading && debouncedSearchQuery.length < 2 && (
            <div className="text-center py-8 text-gray-500"><Search className="w-8 h-8 mx-auto mb-2 text-gray-400" /><p>Start typing to search for users</p></div>
          )}
          {!isLoading && debouncedSearchQuery.length >= 2 && searchResults.length === 0 && (
            <div className="text-center py-8 text-gray-500"><p>No users found matching "{debouncedSearchQuery}"</p></div>
          )}
          {!isLoading && searchResults.length > 0 && (
            <div className="space-y-3">
              {searchResults.map((foundUser) => {
                const status = getUserStatus(foundUser.id);
                return (
                  <div key={foundUser.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center"><span className="text-white font-medium text-sm">{foundUser.displayName?.charAt(0) || 'U'}</span></div>
                      <div><h4 className="font-medium text-gray-900">{foundUser.displayName}</h4><p className="text-sm text-gray-600">@{foundUser.username}</p></div>
                    </div>
                    <div>
                      {status === 'friend' && <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">Friends</span>}
                      {status === 'pending' && <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-sm font-medium rounded-full">Pending</span>}
                      {status === 'none' && <button onClick={() => handleSendRequest(foundUser.id, foundUser.displayName)} className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"><Send className="w-3 h-3" /><span>Add</span></button>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}