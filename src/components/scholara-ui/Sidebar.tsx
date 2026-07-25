import React from 'react';
import { TabType } from '../types';

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  onOpenNewPaperModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  onOpenNewPaperModal,
}) => {
  const navItems: { id: TabType; label: string; icon: string }[] = [
    { id: 'discover', label: 'Discover', icon: 'search' },
    { id: 'my-papers', label: 'My Papers', icon: 'menu_book' },
    { id: 'applied', label: 'Applied', icon: 'badge' },
    { id: 'tracker', label: 'Tracker', icon: 'analytics' },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 h-screen bg-[#FFFFFF] border-r border-[#E2E8F0] fixed left-0 top-0 z-30 select-none">
      {/* Brand & Logo */}
      <div className="p-6 pb-5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-[#233242] flex items-center justify-center text-white font-bold text-base rounded-xs">
            S
          </div>
          <span className="font-sans text-xl font-extrabold tracking-tight text-[#1A2633]">
            ScholarHub
          </span>
        </div>
        <div className="flex items-center gap-1.5 mt-2.5">
          <span className="w-2 h-2 rounded-full bg-[#8CC63F] shrink-0"></span>
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#64748B]">
            VERIFIED RESEARCHER
          </span>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-1">
        {navItems.map((item) => {
          const isActive = activeTab === item.id || (item.id === 'my-papers' && activeTab === 'discussion');
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-4 py-3 text-xs font-semibold font-sans transition-all duration-150 cursor-pointer ${
                isActive
                  ? 'bg-[#EEF4FA] text-[#1E293B] font-bold border-r-4 border-[#8CC63F]'
                  : 'text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`material-symbols-outlined text-[20px] ${
                    isActive ? 'text-[#1E293B] material-symbols-filled' : 'text-[#64748B]'
                  }`}
                >
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </div>
            </button>
          );
        })}
      </nav>

      {/* Action Button */}
      <div className="px-4 mb-4">
        <button
          onClick={onOpenNewPaperModal}
          className="w-full flex items-center justify-center gap-2 py-3 bg-[#233242] hover:bg-[#1A2633] text-white text-xs font-bold font-sans transition-all active:scale-[0.98] shadow-sm cursor-pointer"
        >
          <span className="material-symbols-outlined text-sm">add_circle</span>
          <span>Submit Paper</span>
        </button>
      </div>

      {/* Footer Navigation */}
      <div className="p-4 border-t border-[#E2E8F0] space-y-1 font-sans text-xs text-[#64748B]">
        <button
          onClick={() => setActiveTab('profile')}
          className={`w-full flex items-center gap-3 px-3 py-2 hover:text-[#0F172A] hover:bg-[#F8FAFC] transition-colors ${
            activeTab === 'profile' ? 'text-[#0F172A] font-bold' : ''
          }`}
        >
          <span className="material-symbols-outlined text-lg">settings</span>
          <span>Settings</span>
        </button>
        <a
          href="#support"
          onClick={(e) => {
            e.preventDefault();
            alert('ScholarHub Support: Please contact support@scholarhub.org for assistance.');
          }}
          className="w-full flex items-center gap-3 px-3 py-2 hover:text-[#0F172A] hover:bg-[#F8FAFC] transition-colors"
        >
          <span className="material-symbols-outlined text-lg">help</span>
          <span>Support</span>
        </a>
      </div>
    </aside>
  );
};
