import React, { useState } from 'react';
import { User, Mail, Calendar, Edit, Save, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useAuthStore } from '../../stores/authStore';
import { useDiscussionsStore } from '../../stores/discussionsStore';
import { useFriendsStore } from '../../stores/friendsStore';
import { formatTimeAgo, validateEmail } from '../../lib/utils';

interface ProfileFormData {
  displayName: string;
  email: string;
  username: string;
}

export function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const { user } = useAuthStore();
  const { discussions } = useDiscussionsStore();
  const { friends } = useFriendsStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<ProfileFormData>({
    defaultValues: {
      displayName: user?.displayName || '',
      email: user?.email || '',
      username: user?.username || ''
    }
  });

  const stats = React.useMemo(() => {
    const myDiscussions = discussions.filter(d => d.creatorId === user?.id);
    const publicDiscussions = myDiscussions.filter(d => d.privacy === 'public');
    const privateDiscussions = myDiscussions.filter(d => d.privacy === 'private');
    const friendsDiscussions = myDiscussions.filter(d => d.privacy === 'friends');

    return {
      totalDiscussions: myDiscussions.length,
      publicDiscussions: publicDiscussions.length,
      privateDiscussions: privateDiscussions.length,
      friendsDiscussions: friendsDiscussions.length,
      totalFriends: friends.length
    };
  }, [discussions, friends, user?.id]);

  const onSubmit = async (data: ProfileFormData) => {
    setIsLoading(true);
    setMessage(null);
    
    try {
      // In a real app, this would update the user profile via API
      // For now, we'll simulate the update by updating localStorage
      const storedUsers = JSON.parse(localStorage.getItem('discussion-app-users') || '[]');
      const updatedUsers = storedUsers.map((u: any) => 
        u.id === user?.id 
          ? { ...u, ...data }
          : u
      );
      localStorage.setItem('discussion-app-users', JSON.stringify(updatedUsers));
      
      // Update auth store
      if (user) {
        useAuthStore.setState({
          user: { ...user, ...data }
        });
      }
      
      setMessage({
        type: 'success',
        text: 'Profile updated successfully!'
      });
      setIsEditing(false);
      
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Failed to update profile. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditToggle = () => {
    if (isEditing) {
      reset({
        displayName: user?.displayName || '',
        email: user?.email || '',
        username: user?.username || ''
      });
    }
    setIsEditing(!isEditing);
    setMessage(null);
  };

  if (!user) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-gray-500">Unable to load profile</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
          <p className="text-gray-600 mt-1">Manage your account information and preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Information */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">Personal Information</h2>
                  <button
                    onClick={handleEditToggle}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                      isEditing
                        ? 'bg-gray-600 text-white hover:bg-gray-700'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {isEditing ? (
                      <>
                        <X className="w-4 h-4" />
                        <span>Cancel</span>
                      </>
                    ) : (
                      <>
                        <Edit className="w-4 h-4" />
                        <span>Edit</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="p-6">
                {message && (
                  <div className={`mb-6 p-4 rounded-lg ${
                    message.type === 'success' 
                      ? 'bg-green-50 border border-green-200 text-green-700'
                      : 'bg-red-50 border border-red-200 text-red-700'
                  }`}>
                    <p className="text-sm">{message.text}</p>
                  </div>
                )}

                {isEditing ? (
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div>
                      <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-2">
                        Display Name
                      </label>
                      <input
                        id="displayName"
                        type="text"
                        {...register('displayName', {
                          required: 'Display name is required',
                          minLength: { value: 2, message: 'Display name must be at least 2 characters' }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      {errors.displayName && (
                        <p className="mt-1 text-sm text-red-600">{errors.displayName.message}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                        Username
                      </label>
                      <input
                        id="username"
                        type="text"
                        {...register('username', {
                          required: 'Username is required',
                          minLength: { value: 3, message: 'Username must be at least 3 characters' },
                          pattern: {
                            value: /^[a-zA-Z0-9_]+$/,
                            message: 'Username can only contain letters, numbers, and underscores'
                          }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      {errors.username && (
                        <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                      </label>
                      <input
                        id="email"
                        type="email"
                        {...register('email', {
                          required: 'Email is required',
                          validate: (value) => validateEmail(value) || 'Please enter a valid email address'
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      {errors.email && (
                        <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                      )}
                    </div>

                    <div className="flex items-center space-x-3 pt-4">
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {isLoading ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                        <span>Save Changes</span>
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-xl">
                          {user.displayName?.charAt(0) || user.username?.charAt(0) || 'U'}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">{user.displayName}</h3>
                        <p className="text-gray-600">@{user.username}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <Mail className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Email</p>
                          <p className="text-sm text-gray-600">{user.email}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <Calendar className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Member Since</p>
                          <p className="text-sm text-gray-600">{formatTimeAgo(user.createdAt)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Statistics */}
          <div className="space-y-6">
            {/* Activity Stats */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Statistics</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Total Discussions</span>
                  <span className="font-semibold text-gray-900">{stats.totalDiscussions}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Public Discussions</span>
                  <span className="font-semibold text-green-600">{stats.publicDiscussions}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Friends Only</span>
                  <span className="font-semibold text-blue-600">{stats.friendsDiscussions}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Private Discussions</span>
                  <span className="font-semibold text-gray-600">{stats.privateDiscussions}</span>
                </div>
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Friends</span>
                    <span className="font-semibold text-purple-600">{stats.totalFriends}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Account Info */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-600">User ID:</span>
                  <span className="ml-2 font-mono text-gray-900">{user.id}</span>
                </div>
                <div>
                  <span className="text-gray-600">Account Type:</span>
                  <span className="ml-2 text-gray-900">Standard User</span>
                </div>
                <div>
                  <span className="text-gray-600">Status:</span>
                  <span className="ml-2 text-green-600">Active</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
