import React, { useState, useMemo } from 'react';
import { Search, Plus, Filter, Globe, Users, Lock, Calendar, MessageSquare, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { Discussion } from '../../types';
import { useDiscussionsStore } from '../../stores/discussionsStore';
import { useAuthStore } from '../../stores/authStore';
import { formatTimeAgo, searchInText } from '../../lib/utils';

interface DiscussionListProps {
  onCreateNew: () => void;
  onSelectDiscussion: (discussion: Discussion) => void;
  onEditDiscussion: (discussion: Discussion) => void;
}

type SortOption = 'recent' | 'title' | 'oldest';
type FilterOption = 'all' | 'public' | 'friends' | 'private' | 'mine';

export function DiscussionList({ onCreateNew, onSelectDiscussion, onEditDiscussion }: DiscussionListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  
  const { discussions, deleteDiscussion } = useDiscussionsStore();
  const { user } = useAuthStore();

  // Get stored users for creator names
  const storedUsers = useMemo(() => {
    const users = JSON.parse(localStorage.getItem('discussion-app-users') || '[]');
    const mockUsers = [
      {
        id: '1',
        username: 'admin',
        displayName: 'Admin User'
      }
    ];
    return [...mockUsers, ...users];
  }, []);

  // Filter and sort discussions
  const filteredAndSortedDiscussions = useMemo(() => {
    let filtered = discussions;

    // Apply text search
    if (searchQuery.trim()) {
      filtered = filtered.filter(discussion =>
        searchInText(discussion.title, searchQuery) ||
        searchInText(discussion.description, searchQuery) ||
        discussion.tags?.some(tag => searchInText(tag, searchQuery))
      );
    }

    // Apply filters
    switch (filterBy) {
      case 'public':
        filtered = filtered.filter(d => d.privacy === 'public');
        break;
      case 'friends':
        filtered = filtered.filter(d => d.privacy === 'friends');
        break;
      case 'private':
        filtered = filtered.filter(d => d.privacy === 'private');
        break;
      case 'mine':
        filtered = filtered.filter(d => d.creatorId === user?.id);
        break;
    }

    // Apply sorting
    switch (sortBy) {
      case 'recent':
        filtered.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case 'title':
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
    }

    return filtered;
  }, [discussions, searchQuery, sortBy, filterBy, user?.id]);

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

  const getCreatorName = (creatorId: string) => {
    const creator = storedUsers.find(u => u.id === creatorId);
    return creator?.displayName || creator?.username || 'Unknown User';
  };

  const handleDeleteDiscussion = (discussion: Discussion, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete "${discussion.title}"? This action cannot be undone.`)) {
      deleteDiscussion(discussion.id);
    }
    setActiveDropdown(null);
  };

  const handleEditDiscussion = (discussion: Discussion, e: React.MouseEvent) => {
    e.stopPropagation();
    onEditDiscussion(discussion);
    setActiveDropdown(null);
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Discussions</h1>
          <button
            onClick={onCreateNew}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New Discussion</span>
          </button>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search discussions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="recent">Recent</option>
            <option value="title">Title A-Z</option>
            <option value="oldest">Oldest</option>
          </select>

          {/* Filter */}
          <select
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value as FilterOption)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Discussions</option>
            <option value="mine">My Discussions</option>
            <option value="public">Public</option>
            <option value="friends">Friends Only</option>
            <option value="private">Private</option>
          </select>
        </div>
      </div>

      {/* Discussion List */}
      <div className="flex-1 overflow-y-auto">
        {filteredAndSortedDiscussions.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium mb-2">
                {searchQuery || filterBy !== 'all' ? 'No discussions found' : 'No discussions yet'}
              </p>
              <p className="text-sm">
                {searchQuery || filterBy !== 'all' 
                  ? 'Try adjusting your search or filters'
                  : 'Create your first discussion to get started'
                }
              </p>
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-4">
            {filteredAndSortedDiscussions.map((discussion) => (
              <div
                key={discussion.id}
                onClick={() => onSelectDiscussion(discussion)}
                className="group bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer relative"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0 pr-4">
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                      {discussion.title}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {discussion.description}
                    </p>
                  </div>
                  
                  {/* Actions */}
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveDropdown(activeDropdown === discussion.id ? null : discussion.id);
                      }}
                      className="p-1 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    
                    {activeDropdown === discussion.id && (
                      <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                        {discussion.creatorId === user?.id && (
                          <>
                            <button
                              onClick={(e) => handleEditDiscussion(discussion, e)}
                              className="flex items-center space-x-2 w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                            >
                              <Edit className="w-4 h-4" />
                              <span>Edit Discussion</span>
                            </button>
                            <button
                              onClick={(e) => handleDeleteDiscussion(discussion, e)}
                              className="flex items-center space-x-2 w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                              <span>Delete Discussion</span>
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Tags */}
                {discussion.tags && discussion.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {discussion.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      {getPrivacyIcon(discussion.privacy)}
                      <span className="capitalize">{discussion.privacy}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>{formatTimeAgo(discussion.updatedAt)}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div>By {getCreatorName(discussion.creatorId)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
