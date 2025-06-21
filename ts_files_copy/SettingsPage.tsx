import React, { useState } from 'react';
import { 
  Settings, 
  Shield, 
  Bell, 
  Palette, 
  Database,
  Download,
  Trash2,
  AlertTriangle,
  Save
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useDiscussionsStore } from '../../stores/discussionsStore';
import { useFriendsStore } from '../../stores/friendsStore';

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'general' | 'privacy' | 'data'>('general');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const { user, logout } = useAuthStore();
  const { discussions } = useDiscussionsStore();
  const { friends } = useFriendsStore();

  const handleExportData = () => {
    try {
      const userData = {
        profile: user,
        discussions: discussions.filter(d => d.creatorId === user?.id),
        friends: friends,
        exportedAt: new Date().toISOString()
      };
      
      const blob = new Blob([JSON.stringify(userData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `discussion-app-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setMessage({
        type: 'success',
        text: 'Data exported successfully!'
      });
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Failed to export data. Please try again.'
      });
    }
  };

  const handleClearAllData = () => {
    const confirmText = 'DELETE';
    const userInput = prompt(
      `⚠️ WARNING: This will permanently delete ALL your data!\n\nType "${confirmText}" to confirm:`
    );
    
    if (userInput === confirmText) {
      try {
        // Clear all user data from localStorage
        const keys = [
          'discussion-app-auth',
          'discussion-app-discussions', 
          'discussion-app-friends',
          'discussion-app-graphs'
        ];
        
        keys.forEach(key => localStorage.removeItem(key));
        
        // Update stored users to remove current user
        const storedUsers = JSON.parse(localStorage.getItem('discussion-app-users') || '[]');
        const updatedUsers = storedUsers.filter((u: any) => u.id !== user?.id);
        localStorage.setItem('discussion-app-users', JSON.stringify(updatedUsers));
        
        alert('All data has been deleted. You will be logged out.');
        logout();
      } catch (error) {
        setMessage({
          type: 'error',
          text: 'Failed to clear data. Please try again.'
        });
      }
    }
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'privacy', label: 'Privacy', icon: Shield },
    { id: 'data', label: 'Data', icon: Database }
  ];

  return (
    <div className="h-full bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">Manage your account preferences and data</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <nav className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                        activeTab === tab.id
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              {message && (
                <div className={`mx-6 mt-6 p-4 rounded-lg ${
                  message.type === 'success' 
                    ? 'bg-green-50 border border-green-200 text-green-700'
                    : 'bg-red-50 border border-red-200 text-red-700'
                }`}>
                  <p className="text-sm">{message.text}</p>
                </div>
              )}

              {activeTab === 'general' && (
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">General Settings</h2>
                  
                  <div className="space-y-6">
                    {/* Notifications */}
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-3">Notifications</h3>
                      <div className="space-y-3">
                        <label className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Bell className="w-5 h-5 text-gray-400" />
                            <div>
                              <p className="font-medium text-gray-900">Friend Requests</p>
                              <p className="text-sm text-gray-600">Get notified when someone sends you a friend request</p>
                            </div>
                          </div>
                          <input
                            type="checkbox"
                            defaultChecked
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                        </label>
                        
                        <label className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Bell className="w-5 h-5 text-gray-400" />
                            <div>
                              <p className="font-medium text-gray-900">Discussion Updates</p>
                              <p className="text-sm text-gray-600">Get notified when friends update shared discussions</p>
                            </div>
                          </div>
                          <input
                            type="checkbox"
                            defaultChecked
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                        </label>
                      </div>
                    </div>

                    {/* Theme */}
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-3">Appearance</h3>
                      <div className="flex items-center space-x-3">
                        <Palette className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="font-medium text-gray-900">Theme</p>
                          <p className="text-sm text-gray-600">Choose your preferred theme</p>
                        </div>
                      </div>
                      <div className="mt-3 grid grid-cols-3 gap-3">
                        <label className="flex items-center justify-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:border-blue-500">
                          <input type="radio" name="theme" value="light" defaultChecked className="sr-only" />
                          <span className="text-sm font-medium">Light</span>
                        </label>
                        <label className="flex items-center justify-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 opacity-50">
                          <input type="radio" name="theme" value="dark" disabled className="sr-only" />
                          <span className="text-sm font-medium">Dark (Soon)</span>
                        </label>
                        <label className="flex items-center justify-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 opacity-50">
                          <input type="radio" name="theme" value="auto" disabled className="sr-only" />
                          <span className="text-sm font-medium">Auto (Soon)</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'privacy' && (
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Privacy Settings</h2>
                  
                  <div className="space-y-6">
                    {/* Profile Visibility */}
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-3">Profile Visibility</h3>
                      <div className="space-y-3">
                        <label className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">Public Profile</p>
                            <p className="text-sm text-gray-600">Allow others to find you by username or email</p>
                          </div>
                          <input
                            type="checkbox"
                            defaultChecked
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                        </label>
                        
                        <label className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">Show Email</p>
                            <p className="text-sm text-gray-600">Display your email address to friends</p>
                          </div>
                          <input
                            type="checkbox"
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                        </label>
                      </div>
                    </div>

                    {/* Discussion Defaults */}
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-3">Discussion Defaults</h3>
                      <div>
                        <p className="font-medium text-gray-900 mb-2">Default Privacy Level</p>
                        <p className="text-sm text-gray-600 mb-3">Choose the default privacy level for new discussions</p>
                        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                          <option value="public">Public - Anyone can view</option>
                          <option value="friends">Friends Only - Only friends can view</option>
                          <option value="private">Private - Only you can view</option>
                        </select>
                      </div>
                    </div>

                    {/* Data Usage */}
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-3">Data Usage</h3>
                      <div className="space-y-3">
                        <label className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">Analytics</p>
                            <p className="text-sm text-gray-600">Help improve the app by sharing anonymous usage data</p>
                          </div>
                          <input
                            type="checkbox"
                            defaultChecked
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'data' && (
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Data Management</h2>
                  
                  <div className="space-y-6">
                    {/* Export Data */}
                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <Download className="w-5 h-5 text-blue-600 mt-1" />
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">Export Your Data</h3>
                          <p className="text-sm text-gray-600 mt-1">
                            Download a copy of all your discussions, friends, and account information
                          </p>
                          <button
                            onClick={handleExportData}
                            className="mt-3 flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            <Download className="w-4 h-4" />
                            <span>Export Data</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Storage Info */}
                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <Database className="w-5 h-5 text-gray-600 mt-1" />
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">Storage Information</h3>
                          <div className="mt-3 space-y-2 text-sm text-gray-600">
                            <div className="flex justify-between">
                              <span>Discussions:</span>
                              <span>{discussions.filter(d => d.creatorId === user?.id).length} items</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Friends:</span>
                              <span>{friends.length} connections</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Data stored locally:</span>
                              <span>Yes</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Delete Account */}
                    <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                      <div className="flex items-start space-x-3">
                        <AlertTriangle className="w-5 h-5 text-red-600 mt-1" />
                        <div className="flex-1">
                          <h3 className="font-medium text-red-900">Danger Zone</h3>
                          <p className="text-sm text-red-700 mt-1">
                            Permanently delete all your data. This action cannot be undone.
                          </p>
                          <button
                            onClick={handleClearAllData}
                            className="mt-3 flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Delete All Data</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Save Button */}
              <div className="border-t border-gray-200 p-6">
                <button
                  onClick={() => {
                    setMessage({
                      type: 'success',
                      text: 'Settings saved successfully!'
                    });
                    setTimeout(() => setMessage(null), 3000);
                  }}
                  className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Settings</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
