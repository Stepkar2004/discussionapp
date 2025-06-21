// src/App.tsx

import React, { useState, useEffect } from 'react';
import { useAuthStore } from './stores/authStore';
import { AuthPage } from './components/auth/AuthPage';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './components/dashboard/Dashboard';
import { DiscussionList } from './components/discussions/DiscussionList';
import { DiscussionView } from './components/discussions/DiscussionView';
import { DiscussionForm } from './components/discussions/DiscussionForm';
import { FriendsPage } from './components/friends/FriendsPage';
import { ProfilePage } from './components/profile/ProfilePage';
import { SettingsPage } from './components/settings/SettingsPage';
import { Discussion } from './types';
import { useDiscussionsStore } from './stores/discussionsStore';
import './index.css';

type ViewType = 'dashboard' | 'discussions' | 'friends' | 'profile' | 'settings';

function App() {
  const { isAuthenticated } = useAuthStore();
  const { loadDiscussion, fetchDiscussions } = useDiscussionsStore();
  
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [selectedDiscussion, setSelectedDiscussion] = useState<Discussion | null>(null);
  const [showDiscussionForm, setShowDiscussionForm] = useState(false);
  const [editingDiscussion, setEditingDiscussion] = useState<Discussion | null>(null);
  const [isAppLoading, setIsAppLoading] = useState(true);

  // Handle URL parameters and initial data fetching
  useEffect(() => {
    const loadInitialData = async () => {
      if (isAuthenticated) {
        setIsAppLoading(true);
        await fetchDiscussions(); 
        
        const urlParams = new URLSearchParams(window.location.search);
        const discussionId = urlParams.get('discussion');
        
        if (discussionId) {
          await loadDiscussion(discussionId);
          const discussion = useDiscussionsStore.getState().currentDiscussion;
          if (discussion) {
            setSelectedDiscussion(discussion);
            setCurrentView('discussions');
          }
        }
        setIsAppLoading(false);
      } else {
        setIsAppLoading(false);
      }
    };

    loadInitialData();
  }, [isAuthenticated, loadDiscussion, fetchDiscussions]);

  // ... rest of the file is unchanged ...
  // Update URL when viewing a discussion
  useEffect(() => {
    const url = new URL(window.location.href);
    if (selectedDiscussion) {
      url.searchParams.set('discussion', selectedDiscussion.id);
      window.history.replaceState({}, '', url.toString());
    } else {
      url.searchParams.delete('discussion');
      window.history.replaceState({}, '', url.toString());
    }
  }, [selectedDiscussion]);

  const handleCreateDiscussion = () => {
    setEditingDiscussion(null);
    setShowDiscussionForm(true);
  };

  const handleEditDiscussion = (discussion: Discussion) => {
    setEditingDiscussion(discussion);
    setShowDiscussionForm(true);
  };

  const handleDiscussionFormSuccess = async (discussionId: string) => {
    setShowDiscussionForm(false);
    setEditingDiscussion(null);
    
    await loadDiscussion(discussionId);
    const discussion = useDiscussionsStore.getState().currentDiscussion;
    if (discussion) {
      setSelectedDiscussion(discussion);
      setCurrentView('discussions');
    }
  };

  const handleDiscussionFormCancel = () => {
    setShowDiscussionForm(false);
    setEditingDiscussion(null);
  };

  const handleSelectDiscussion = (discussion: Discussion) => {
    setSelectedDiscussion(discussion);
    setCurrentView('discussions');
  };

  const handleBackToDiscussions = () => {
    setSelectedDiscussion(null);
  };

  const handleViewChange = (view: string) => {
    setCurrentView(view as ViewType);
    if (view !== 'discussions') {
      setSelectedDiscussion(null);
    }
  };

  if (!isAuthenticated && !isAppLoading) {
    return <AuthPage onAuthSuccess={() => setCurrentView('dashboard')} />;
  }

  if (isAppLoading) {
      return (
          <div className="h-screen w-screen flex items-center justify-center bg-gray-50">
              <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
      );
  }

  const discussionFormModal = showDiscussionForm && (
    <DiscussionForm
      discussion={editingDiscussion || undefined}
      onSuccess={handleDiscussionFormSuccess}
      onCancel={handleDiscussionFormCancel}
    />
  );

  let mainContent: React.ReactNode;
  if (currentView === 'discussions') {
    if (selectedDiscussion) {
      mainContent = (
        <DiscussionView
          discussion={selectedDiscussion}
          onBack={handleBackToDiscussions}
          onEdit={() => handleEditDiscussion(selectedDiscussion)}
        />
      );
    } else {
      mainContent = (
        <DiscussionList
          onCreateNew={handleCreateDiscussion}
          onSelectDiscussion={handleSelectDiscussion}
          onEditDiscussion={handleEditDiscussion}
        />
      );
    }
  } else {
    switch (currentView) {
      case 'dashboard':
        mainContent = <Dashboard onCreateDiscussion={handleCreateDiscussion} onViewDiscussion={handleSelectDiscussion} onViewFriends={() => handleViewChange('friends')} />;
        break;
      case 'friends':
        mainContent = <FriendsPage />;
        break;
      case 'profile':
        mainContent = <ProfilePage />;
        break;
      case 'settings':
        mainContent = <SettingsPage />;
        break;
      default:
        mainContent = <Dashboard onCreateDiscussion={handleCreateDiscussion} onViewDiscussion={handleSelectDiscussion} onViewFriends={() => handleViewChange('friends')} />;
    }
  }

  return (
    <div className="App">
      <Layout currentView={currentView} onViewChange={handleViewChange}>
        {mainContent}
      </Layout>
      {discussionFormModal}
    </div>
  );
}

export default App;