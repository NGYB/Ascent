'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import ChangelogModal from '@/components/ChangelogModal';
import { hasUnreadChangelog, markChangelogAsRead } from '@/lib/changelog';

interface ChangelogContextType {
  isChangelogOpen: boolean;
  openChangelog: () => void;
  closeChangelog: () => void;
  hasUnread: boolean;
}

const ChangelogContext = createContext<ChangelogContextType | undefined>(undefined);

export function ChangelogProvider({ children }: { children: React.ReactNode }) {
  const [isChangelogOpen, setIsChangelogOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);

  const checkUnread = () => {
    setHasUnread(hasUnreadChangelog());
  };

  useEffect(() => {
    checkUnread();

    const handleReadEvent = () => {
      setHasUnread(false);
    };

    const handleOpenEvent = () => {
      setIsChangelogOpen(true);
    };

    window.addEventListener('ascent-changelog-read', handleReadEvent);
    window.addEventListener('ascent-open-changelog', handleOpenEvent);

    return () => {
      window.removeEventListener('ascent-changelog-read', handleReadEvent);
      window.removeEventListener('ascent-open-changelog', handleOpenEvent);
    };
  }, []);

  const openChangelog = () => {
    setIsChangelogOpen(true);
    markChangelogAsRead();
    setHasUnread(false);
  };

  const closeChangelog = () => {
    setIsChangelogOpen(false);
  };

  const handleOpenFeedback = () => {
    window.dispatchEvent(new Event('ascent-open-feedback'));
  };

  return (
    <ChangelogContext.Provider
      value={{
        isChangelogOpen,
        openChangelog,
        closeChangelog,
        hasUnread
      }}
    >
      {children}
      <ChangelogModal
        isOpen={isChangelogOpen}
        onClose={closeChangelog}
        onOpenFeedback={handleOpenFeedback}
      />
    </ChangelogContext.Provider>
  );
}

export function useChangelog() {
  const context = useContext(ChangelogContext);
  if (!context) {
    throw new Error('useChangelog must be used within a ChangelogProvider');
  }
  return context;
}
