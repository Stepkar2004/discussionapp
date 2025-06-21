import React from 'react';
import { 
  MessageSquare, 
  Users, 
  User, 
  Home, 
  LogOut,
  Bell,
  Settings
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useFriendsStore } from '../../stores/friendsStore';

interface NavigationProps {
  currentView: string;
  onViewChange: (view: string) => void;
}

export function Navigation({ currentView, onViewChange }: NavigationProps) {
  const { user, logout } = useAuthStore();
  const { friendRequests } = useFriendsStore();
  
  const pendingRequests = friendRequests.filter(req => 
    req.toUserId === user?.id && req.status === 'pending'
  ).length;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'discussions', label: 'Discussions', icon: MessageSquare },
    { id: 'friends', label: 'Friends', icon: Users, badge: pendingRequests > 0 ? pendingRequests : undefined },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <nav className="bg-white border-r border-gray-200 w-64 h-full flex flex-col">
      {/* Logo and App Name */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">DiscussionApp</h1>
            <p className="text-sm text-gray-500">Visualize Arguments</p>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center">
            <span className="text-white font-medium text-sm">
              {user?.displayName?.charAt(0) || user?.username?.charAt(0) || 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.displayName || user?.username}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {user?.email}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Items */}
      <div className="flex-1 px-4 py-4">
        <div className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </div>
                {item.badge && (
                  <span className="bg-red-500 text-white text-xs font-medium px-2 py-1 rounded-full min-w-[20px] text-center">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-gray-200 space-y-2">
        <button
          onClick={() => onViewChange('settings')}
          className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
            currentView === 'settings'
              ? 'bg-blue-50 text-blue-700 border border-blue-200'
              : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
          }`}
        >
          <Settings className="w-5 h-5" />
          <span className="font-medium">Settings</span>
        </button>
        
        <button
          onClick={logout}
          className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Sign Out</span>
        </button>
      </div>
    </nav>
  );
}
