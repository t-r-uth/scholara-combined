import React from 'react';
import { UserProfile, Paper, TabType } from '../types';

interface ProfileViewProps {
  user: UserProfile;
  papers: Paper[];
  onSelectPaper: (paper: Paper) => void;
  onNavigateToTab: (tab: TabType) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  user,
  papers,
  onSelectPaper,
  onNavigateToTab,
}) => {
  const bookmarkedPapers = papers.filter((p) => p.isBookmarked);

  return (
    <div className="w-full max-w-4xl mx-auto px-4 lg:px-8 py-6 font-sans">
      {/* Profile Header Card */}
      <div className="bg-[#FFFFFF] p-8 border border-[#E2E8F0] shadow-xs text-center space-y-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-20 bg-[#233242]"></div>

        <div className="relative z-10 w-24 h-24 rounded-full overflow-hidden border-4 border-[#FFFFFF] mx-auto shadow-md">
          <img className="w-full h-full object-cover" src={user.avatar} alt={user.name} />
        </div>

        <div className="space-y-1">
          <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#64748B] block">
            VERIFIED PRINCIPAL INVESTIGATOR
          </span>
          <h2 className="font-extrabold text-2xl text-[#0F172A]">{user.name}</h2>
          <p className="text-xs text-[#475569] font-serif italic">{user.title}</p>
          <p className="text-[10px] text-[#64748B] font-bold uppercase tracking-wider">
            Stanford University • Computational Systems Lab
          </p>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#233242] text-white text-[10px] font-bold uppercase tracking-widest">
          <span className="material-symbols-filled text-xs text-[#8CC63F]">verified_user</span>
          <span>ORCID: {user.orcid}</span>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4 pt-6 border-t border-[#E2E8F0]">
          <div>
            <span className="text-2xl font-extrabold text-[#0F172A] block">24</span>
            <span className="text-[10px] text-[#64748B] uppercase font-bold tracking-wider">Publications</span>
          </div>
          <div>
            <span className="text-2xl font-extrabold text-[#0F172A] block">1,482</span>
            <span className="text-[10px] text-[#64748B] uppercase font-bold tracking-wider">Citations</span>
          </div>
          <div>
            <span className="text-2xl font-extrabold text-[#0F172A] block">18</span>
            <span className="text-[10px] text-[#64748B] uppercase font-bold tracking-wider">h-index</span>
          </div>
        </div>
      </div>

      {/* Bookmarked Papers */}
      <section className="mt-8 space-y-4">
        <div className="flex justify-between items-center border-b border-[#E2E8F0] pb-2">
          <h3 className="font-bold text-xs uppercase tracking-wider text-[#0F172A]">
            Saved Bookmarks ({bookmarkedPapers.length})
          </h3>
          <button
            onClick={() => onNavigateToTab('discover')}
            className="text-xs text-[#233242] font-bold uppercase tracking-wider hover:underline cursor-pointer"
          >
            Explore More
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {bookmarkedPapers.map((paper) => (
            <div
              key={paper.id}
              onClick={() => onSelectPaper(paper)}
              className="p-4 bg-[#FFFFFF] border border-[#E2E8F0] hover:border-[#CBD5E1] cursor-pointer transition-all flex items-start justify-between gap-3 shadow-xs"
            >
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block">
                  {paper.journal || paper.fieldOfStudy || 'Research'}
                </span>
                <h4 className="font-bold text-xs text-[#0F172A] line-clamp-2 leading-snug">
                  {paper.title}
                </h4>
                <p className="text-[11px] text-[#64748B] font-serif italic">{paper.authors}</p>
              </div>
              <span className="material-symbols-filled text-[#8CC63F] text-lg shrink-0">
                bookmark
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Settings Options */}
      <section className="mt-8 space-y-4">
        <h3 className="font-bold text-xs uppercase tracking-wider text-[#0F172A] border-b border-[#E2E8F0] pb-2">
          Researcher Preferences & Integrations
        </h3>

        <div className="bg-[#FFFFFF] border border-[#E2E8F0] divide-y divide-[#E2E8F0] text-xs">
          {/* Google Workspace Integration Row */}
          <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#F8FAFC]">
            <div className="flex items-start gap-3">
              <span className="material-symbols-filled text-xl text-[#8CC63F] shrink-0 mt-0.5">folder_shared</span>
              <div>
                <span className="font-bold text-[#0F172A] block text-xs">Google Drive Workspace Integration</span>
                <p className="text-[11px] text-[#64748B] mt-0.5">
                  OAuth Scopes: <code className="bg-[#E2E8F0] px-1 py-0.5 rounded text-[10px]">drive.readonly</code>, <code className="bg-[#E2E8F0] px-1 py-0.5 rounded text-[10px]">drive.file</code>. Manuscript files remain hosted on Google Drive without local data retention.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-center">
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 bg-[#F0FDF4] text-[#166534] border border-[#8CC63F]/40">
                <span className="w-1.5 h-1.5 rounded-full bg-[#8CC63F]"></span>
                Connected
              </span>
            </div>
          </div>

          <button
            onClick={() => alert('ORCID Credentials synced successfully.')}
            className="w-full p-4 flex items-center justify-between hover:bg-[#F8FAFC] text-left transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-base text-[#233242]">verified</span>
              <span className="font-bold text-[#0F172A]">ORCID Profile Settings</span>
            </div>
            <span className="material-symbols-outlined text-sm text-[#94A3B8]">chevron_right</span>
          </button>

          <button
            onClick={() => onNavigateToTab('my-papers')}
            className="w-full p-4 flex items-center justify-between hover:bg-[#F8FAFC] text-left transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-base text-[#233242]">menu_book</span>
              <span className="font-bold text-[#0F172A]">My Published Pre-prints</span>
            </div>
            <span className="material-symbols-outlined text-sm text-[#94A3B8]">chevron_right</span>
          </button>

          <button
            onClick={() => alert('Citation Export Format set to BibTeX / Nature Standard.')}
            className="w-full p-4 flex items-center justify-between hover:bg-[#F8FAFC] text-left transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-base text-[#233242]">format_quote</span>
              <span className="font-bold text-[#0F172A]">Citation Preferences (BibTeX / RIS)</span>
            </div>
            <span className="material-symbols-outlined text-sm text-[#94A3B8]">chevron_right</span>
          </button>
        </div>
      </section>
    </div>
  );
};

