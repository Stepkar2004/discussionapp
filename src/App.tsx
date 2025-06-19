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
  const { loadDiscussion } = useDiscussionsStore();
  
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [selectedDiscussion, setSelectedDiscussion] = useState<Discussion | null>(null);
  const [showDiscussionForm, setShowDiscussionForm] = useState(false);
  const [editingDiscussion, setEditingDiscussion] = useState<Discussion | null>(null);

  // Handle URL parameters on load
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const discussionId = urlParams.get('discussion');
    
    if (discussionId && isAuthenticated) {
      const { discussions } = useDiscussionsStore.getState();
      const discussion = discussions.find(d => d.id === discussionId);
      if (discussion) {
        setSelectedDiscussion(discussion);
        setCurrentView('discussions');
      }
    }
  }, [isAuthenticated]);

  // Update URL when viewing a discussion
  useEffect(() => {
    if (selectedDiscussion) {
      const url = new URL(window.location.href);
      url.searchParams.set('discussion', selectedDiscussion.id);
      window.history.replaceState({}, '', url.toString());
    } else {
      const url = new URL(window.location.href);
      url.searchParams.delete('discussion');
      window.history.replaceState({}, '', url.toString());
    }
  }, [selectedDiscussion]);

  const handleAuthSuccess = () => {
    setCurrentView('dashboard');
  };

  const handleCreateDiscussion = () => {
    setEditingDiscussion(null);
    setShowDiscussionForm(true);
  };

  const handleEditDiscussion = (discussion: Discussion) => {
    setEditingDiscussion(discussion);
    setShowDiscussionForm(true);
  };

  const handleDiscussionFormSuccess = (discussionId: string) => {
    setShowDiscussionForm(false);
    setEditingDiscussion(null);
    
    // Load and view the discussion
    const { discussions } = useDiscussionsStore.getState();
    const discussion = discussions.find(d => d.id === discussionId);
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

  const handleViewFriends = () => {
    setCurrentView('friends');
  };

  // Show authentication page if not logged in
  if (!isAuthenticated) {
    return <AuthPage onAuthSuccess={handleAuthSuccess} />;
  }

  // Render discussion form modal
  const discussionFormModal = showDiscussionForm && (
    <DiscussionForm
      discussion={editingDiscussion || undefined}
      onSuccess={handleDiscussionFormSuccess}
      onCancel={handleDiscussionFormCancel}
    />
  );

  // Render main content based on current view
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
        mainContent = (
          <Dashboard
            onCreateDiscussion={handleCreateDiscussion}
            onViewDiscussion={handleSelectDiscussion}
            onViewFriends={handleViewFriends}
          />
        );
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
        mainContent = (
          <Dashboard
            onCreateDiscussion={handleCreateDiscussion}
            onViewDiscussion={handleSelectDiscussion}
            onViewFriends={handleViewFriends}
          />
        );
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
