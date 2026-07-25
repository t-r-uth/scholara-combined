import React, { useState } from 'react';
import { UserProfile, TabType } from '../types';

interface HeaderProps {
  user: UserProfile;
  activeTab: TabType;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onNavigateToTab: (tab: TabType) => void;
  onOpenNewPaperModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  activeTab,
  searchQuery,
  setSearchQuery,
  onNavigateToTab,
  onOpenNewPaperModal,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [isGoogleDriveConnected, setIsGoogleDriveConnected] = useState(true);

  const handleToggleGoogleDrive = () => {
    if (isGoogleDriveConnected) {
      if (confirm('Disconnect Google Drive Workspace access?')) {
        setIsGoogleDriveConnected(false);
      }
    } else {
      setIsGoogleDriveConnected(true);
    }
  };

  return (
    <header className="sticky top-0 z-20 bg-[#F4F6F8]/90 backdrop-blur-md border-b border-[#E2E8F0] px-4 lg:px-8 py-3.5 flex items-center justify-between font-sans">
      {/* Search Input Bar */}
      <div className="flex-1 max-w-xl pr-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-[#94A3B8]">
            <span className="material-symbols-outlined text-[20px]">search</span>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search papers, disciplines, or methodologies..."
            className="w-full h-10 pl-11 pr-8 bg-[#E2E8F0]/50 hover:bg-[#E2E8F0]/70 focus:bg-[#FFFFFF] border border-transparent focus:border-[#CBD5E1] rounded-lg text-xs font-medium text-[#1E293B] placeholder:text-[#64748B] focus:outline-none transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-3 flex items-center text-[#94A3B8] hover:text-[#475569]"
            >
              <span className="material-symbols-outlined text-sm">cancel</span>
            </button>
          )}
        </div>
      </div>

      {/* Right Side Tools & Profile */}
      <div className="flex items-center gap-3.5 shrink-0">
        {/* Google Drive Connection Badge / Sign-in */}
        <button
          onClick={handleToggleGoogleDrive}
          className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold border transition-all cursor-pointer ${
            isGoogleDriveConnected
              ? 'bg-[#F0FDF4] border-[#8CC63F]/40 text-[#166534] hover:bg-[#DCFCE7]'
              : 'bg-[#FFFFFF] border-[#CBD5E1] text-[#475569] hover:bg-[#F8FAFC]'
          }`}
          title={isGoogleDriveConnected ? 'Google Drive Connected' : 'Sign in with Google to Share Documents'}
        >
          <span className={`material-symbols-filled text-base ${isGoogleDriveConnected ? 'text-[#8CC63F]' : 'text-[#64748B]'}`}>
            folder_shared
          </span>
          <span>{isGoogleDriveConnected ? 'Google Drive Connected' : 'Sign in with Google'}</span>
        </button>

        {/* Post New Paper Quick Button */}
        {activeTab === 'my-papers' && (
          <button
            onClick={onOpenNewPaperModal}
            className="hidden sm:flex items-center gap-1.5 px-4 py-2 bg-[#233242] hover:bg-[#1A2633] text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">post_add</span>
            <span>Post New Paper</span>
          </button>
        )}

        {/* Notifications Icon with Badge */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-[#475569] hover:text-[#0F172A] hover:bg-[#E2E8F0]/60 rounded-full transition-colors cursor-pointer"
            title="Notifications"
          >
            <span className="material-symbols-outlined text-[22px]">notifications</span>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#E11D48]"></span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-12 w-80 bg-[#FFFFFF] shadow-xl border border-[#CBD5E1] p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#E2E8F0]">
                <span className="font-bold text-xs uppercase tracking-wider text-[#1E293B]">
                  Notifications
                </span>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-[10px] font-bold text-[#64748B] hover:text-[#0F172A] uppercase"
                >
                  Close
                </button>
              </div>
              <div className="space-y-2.5 text-xs">
                <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0]">
                  <span className="font-bold text-[#0F172A] block text-xs">
                    Peer Review Live
                  </span>
                  <p className="text-[#475569] text-[11px] mt-0.5">
                    Your latest review for "Quantum Lattice Dynamics" is live on Nature.
                  </p>
                </div>
                <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0]">
                  <span className="font-bold text-[#0F172A] block text-xs">
                    New Applicant
                  </span>
                  <p className="text-[#475569] text-[11px] mt-0.5">
                    Dr. Julian Thorne applied for Data Analysis stage.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Verified Shield Badge */}
        <div
          className="p-1.5 text-[#8CC63F] hover:bg-[#E2E8F0]/60 rounded-full transition-colors cursor-pointer"
          title="Verified ORCID Researcher"
        >
          <span className="material-symbols-filled text-[22px]">verified_user</span>
        </div>

        {/* User Profile Header Badge */}
        <div
          onClick={() => onNavigateToTab('profile')}
          className="flex items-center gap-3 pl-2 border-l border-[#CBD5E1] cursor-pointer hover:opacity-85 transition-opacity"
        >
          <div className="text-right hidden md:block">
            <span className="font-bold text-xs text-[#0F172A] uppercase tracking-wider block leading-tight">
              {user.name}
            </span>
            <span className="text-[10px] font-semibold text-[#64748B] block">
              ORCID: {user.orcid}
            </span>
          </div>
          <div className="w-9 h-9 rounded-full overflow-hidden border border-[#CBD5E1] shrink-0">
            <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
          </div>
        </div>
      </div>
    </header>
  );
};
