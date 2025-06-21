import React from 'react';
import { Navigation } from './Navigation';

interface LayoutProps {
  children: React.ReactNode;
  currentView: string;
  onViewChange: (view: string) => void;
}

export function Layout({ children, currentView, onViewChange }: LayoutProps) {
  return (
    <div className="h-screen flex bg-gray-50">
      <Navigation currentView={currentView} onViewChange={onViewChange} />
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  );
}
