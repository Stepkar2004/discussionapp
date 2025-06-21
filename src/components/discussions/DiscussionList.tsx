// src/components/discussions/DiscussionList.tsx

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Search, Plus, Filter, Globe, Users, Lock, Calendar, MessageSquare, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { Discussion, User } from '../../types';
import { useDiscussionsStore } from '../../stores/discussionsStore';
import { useAuthStore } from '../../stores/authStore';
import { formatTimeAgo, searchInText } from '../../lib/utils';
import { getSupabase } from '../../lib/supabaseClient';

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
  const [isLoading, setIsLoading] = useState(true);
  const [creatorProfiles, setCreatorProfiles] = useState<User[]>([]); // State for creator profiles

  const { discussions, deleteDiscussion, fetchDiscussions } = useDiscussionsStore();
  const { user } = useAuthStore();

  const fetchCreatorProfiles = useCallback(async (discussionsToFetch: Discussion[]) => {
    if (discussionsToFetch.length === 0) {
      setCreatorProfiles([]);
      return;
    }
    const creatorIds = [...new Set(discussionsToFetch.map(d => d.creatorId))];
    
    const { data, error } = await getSupabase()
        .from('profiles')
        .select('*')
        .in('id', creatorIds);

    if (error) {
        console.error("Error fetching creator profiles:", error);
        setCreatorProfiles([]);
    } else {
        const profiles = data.map(p => ({
            id: p.id,
            username: p.username,
            displayName: p.display_name || p.username,
            email: '', // Not needed for display
            avatar: p.avatar_url || undefined,
            createdAt: p.created_at,
        }));
        setCreatorProfiles(profiles);
    }
  }, []);

  useEffect(() => {
    const loadDiscussions = async () => {
      setIsLoading(true);
      await fetchDiscussions();
      setIsLoading(false);
    };
    loadDiscussions();
  }, [fetchDiscussions]);

  useEffect(() => {
    // After discussions are fetched, fetch the profiles for their creators
    if (discussions.length > 0) {
      fetchCreatorProfiles(discussions);
    }
  }, [discussions, fetchCreatorProfiles]);

  const filteredAndSortedDiscussions = useMemo(() => {
    // ... filtering and sorting logic is unchanged ...
    let filtered = discussions;

    if (searchQuery.trim()) {
      filtered = filtered.filter(discussion =>
        searchInText(discussion.title, searchQuery) ||
        searchInText(discussion.description, searchQuery) ||
        discussion.tags?.some(tag => searchInText(tag, searchQuery))
      );
    }

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
  
  // This function now uses the state fetched from the database
  const getCreatorName = (creatorId: string) => {
    const creator = creatorProfiles.find(p => p.id === creatorId);
    return creator?.displayName || creator?.username || '...'; // Show '...' while loading
  };

  const handleDeleteDiscussion = async (discussion: Discussion, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete "${discussion.title}"? This action cannot be undone.`)) {
      try {
        await deleteDiscussion(discussion.id);
      } catch (error) {
        console.error("Failed to delete discussion:", error);
      }
    }
    setActiveDropdown(null);
  };

  const handleEditDiscussion = (discussion: Discussion, e: React.MouseEvent) => {
    e.stopPropagation();
    onEditDiscussion(discussion);
    setActiveDropdown(null);
  };

  // The entire return block with JSX is the same as before,
  // but it will now work because getCreatorName has the correct data.
  // I am including it for completeness.
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
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="recent">Recent</option>
            <option value="title">Title A-Z</option>
            <option value="oldest">Oldest</option>
          </select>
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
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
        ) : filteredAndSortedDiscussions.length === 0 ? (
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
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0 pr-4">
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                      {discussion.title}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {discussion.description}
                    </p>
                  </div>
                  
                  {discussion.creatorId === user?.id && (
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
                        </div>
                      )}
                    </div>
                  )}
                </div>

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