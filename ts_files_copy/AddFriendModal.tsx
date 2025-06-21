import React, { useState, useMemo } from 'react';
import { X, UserPlus, Search, Send } from 'lucide-react';
import { useFriendsStore } from '../../stores/friendsStore';
import { useAuthStore } from '../../stores/authStore';
import { validateEmail } from '../../lib/utils';

interface AddFriendModalProps {
  onClose: () => void;
}

export function AddFriendModal({ onClose }: AddFriendModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const { sendFriendRequest, friends, friendRequests } = useFriendsStore();
  const { user } = useAuthStore();

  // Get all users
  const allUsers = useMemo(() => {
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
    return [...mockUsers, ...storedUsers].filter(u => u.id !== user?.id);
  }, [user?.id]);

  // Filter users based on search query
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return [];
    
    return allUsers.filter(u => 
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.displayName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [allUsers, searchQuery]);

  // Check if user is already a friend or has pending request
  const getUserStatus = (userId: string) => {
    if (friends.some(f => f.id === userId)) {
      return 'friend';
    }
    
    const hasRequest = friendRequests.some(req => 
      (req.fromUserId === user?.id && req.toUserId === userId && req.status === 'pending') ||
      (req.fromUserId === userId && req.toUserId === user?.id && req.status === 'pending')
    );
    
    if (hasRequest) {
      return 'pending';
    }
    
    return 'none';
  };

  const handleSendRequest = async (toUserId: string, displayName: string) => {
    setIsLoading(true);
    setMessage(null);
    
    try {
      sendFriendRequest(toUserId);
      setMessage({
        type: 'success',
        text: `Friend request sent to ${displayName}!`
      });
      
      // Clear search after sending request
      setTimeout(() => {
        setSearchQuery('');
        setMessage(null);
      }, 2000);
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Failed to send friend request. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <UserPlus className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Add Friend</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Search Input */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by username, email, or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              autoFocus
            />
          </div>

          {/* Message */}
          {message && (
            <div className={`mb-4 p-3 rounded-lg ${
              message.type === 'success' 
                ? 'bg-green-50 border border-green-200 text-green-700'
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}>
              <p className="text-sm">{message.text}</p>
            </div>
          )}

          {/* Search Results */}
          <div className="max-h-64 overflow-y-auto">
            {searchQuery.length < 2 ? (
              <div className="text-center py-8 text-gray-500">
                <Search className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p>Start typing to search for users</p>
                <p className="text-xs mt-1">Search by username, email, or display name</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No users found matching "{searchQuery}"</p>
                <p className="text-xs mt-1">Try a different search term</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredUsers.map((user) => {
                  const status = getUserStatus(user.id);
                  
                  return (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-medium text-sm">
                            {user.displayName?.charAt(0) || user.username?.charAt(0) || 'U'}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{user.displayName}</h4>
                          <p className="text-sm text-gray-600">@{user.username}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </div>
                      
                      <div>
                        {status === 'friend' ? (
                          <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
                            Friends
                          </span>
                        ) : status === 'pending' ? (
                          <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-sm font-medium rounded-full">
                            Pending
                          </span>
                        ) : (
                          <button
                            onClick={() => handleSendRequest(user.id, user.displayName)}
                            disabled={isLoading}
                            className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            <Send className="w-3 h-3" />
                            <span>Add</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <p className="text-xs text-gray-600">
            💡 Tip: Search for users by their username, email address, or display name to send friend requests.
          </p>
        </div>
      </div>
    </div>
  );
}
