import React from 'react';
import { TabType } from '../types';

interface NavigationProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab }) => {
  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'discover', label: 'Discover', icon: 'search' },
    { id: 'my-papers', label: 'My Papers', icon: 'menu_book' },
    { id: 'applied', label: 'Applied', icon: 'badge' },
    { id: 'tracker', label: 'Tracker', icon: 'analytics' },
    { id: 'profile', label: 'Profile', icon: 'person' },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-2 pb-safe pt-2 bg-[#FFFFFF]/95 backdrop-blur-md border-t border-[#E2E8F0] shadow-md">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id || (tab.id === 'my-papers' && activeTab === 'discussion');
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center justify-center px-3 py-1.5 rounded-lg transition-all duration-200 active:scale-95 cursor-pointer ${
              isActive
                ? 'bg-[#EEF4FA] text-[#1E293B] font-bold'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <span
              className={`material-symbols-outlined text-[20px] ${
                isActive ? 'material-symbols-filled text-[#1E293B]' : ''
              }`}
            >
              {tab.icon}
            </span>
            <span className="font-sans text-[9px] font-bold uppercase tracking-wider mt-0.5">
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};

