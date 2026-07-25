import React, { useState } from 'react';
import { Paper, PaperStatus } from '../types';

interface PapersViewProps {
  papers: Paper[];
  onSelectPaper: (paper: Paper) => void;
  onOpenNewPaperModal: () => void;
  onNavigateToTab: (tab: 'home' | 'discover' | 'profile') => void;
}

export const PapersView: React.FC<PapersViewProps> = ({
  papers,
  onSelectPaper,
  onOpenNewPaperModal,
  onNavigateToTab,
}) => {
  const [activeFilter, setActiveFilter] = useState<'All Papers' | 'Idea' | 'Literature' | 'Analysis'>('All Papers');

  const filterTabs: ('All Papers' | 'Idea' | 'Literature' | 'Analysis')[] = [
    'All Papers',
    'Idea',
    'Literature',
    'Analysis',
  ];

  // Group papers by pipeline category
  const analysisPapers = papers.filter(
    (p) => p.status === 'Analysis' || p.status === 'In Progress'
  );
  const literaturePapers = papers.filter(
    (p) => p.status === 'Literature' || p.status === 'Overdue'
  );
  const ideaPapers = papers.filter(
    (p) => p.status === 'Idea' || p.status === 'Drafting'
  );

  return (
    <div className="pb-28 max-w-lg mx-auto w-full px-4 pt-3 font-serif-4">
      {/* Top App Bar */}
      <header className="flex justify-between items-center py-3 sticky top-0 bg-[#F5F2ED]/90 backdrop-blur-md z-40 mb-4 border-b border-[#1A1A1A]/15">
        <div className="flex items-center gap-3">
          <div
            onClick={() => onNavigateToTab('profile')}
            className="w-8 h-8 rounded-full overflow-hidden border border-[#1A1A1A]/30 cursor-pointer hover:ring-2 hover:ring-[#1A1A1A] transition-all"
          >
            <img
              className="w-full h-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDruQJoTJtmB0dw-KiVx4RyONxjz_SuI_DRV2hpcCHBIucmDuUrNXXEM7R4lMrCFu0JAGDN77zs_8Vc4WT7K0rHSGmyPBDDLLzdG6hwJWKGoqwlts2PBfbjV0eMQuTIio_5cXQJaAyU6MSXYZTOeH5h4Qso2r_vDBuuyC9uPz6clAtPOpPMBmjKWygh4NUSQWPJbAYoT8htGpx3Ijan5BbL5LaDxJbk7trLaG-Lt9kEUBiTwv2kwAhkmGSpMaGSYCE8XgFFiel8CxA"
              alt="Researcher portrait"
            />
          </div>
          <div>
            <span className="text-[9px] uppercase tracking-[0.3em] font-bold text-[#1A1A1A]/50 block font-hanken">
              Pipeline Index
            </span>
            <h1 className="font-serif-4 italic font-bold text-lg text-[#1A1A1A]">ScholarHub</h1>
          </div>
        </div>
        <button
          onClick={() => onNavigateToTab('discover')}
          className="p-2 transition-all duration-200 active:scale-95 border border-[#1A1A1A]/20 hover:bg-[#1A1A1A] hover:text-[#F5F2ED] rounded-full text-[#1A1A1A]"
        >
          <span className="material-symbols-outlined text-lg">search</span>
        </button>
      </header>

      {/* Title + Action */}
      <div className="flex items-center justify-between mb-5 font-hanken">
        <div>
          <span className="text-[10px] uppercase tracking-[0.35em] font-bold text-[#1A1A1A]/50 block">
            Research Archive
          </span>
          <h2 className="font-bold text-xl text-[#1A1A1A] tracking-tight">Publication Tracker</h2>
        </div>
        <button
          onClick={onOpenNewPaperModal}
          className="bg-[#1A1A1A] text-[#F5F2ED] rounded-full px-4 py-2 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 shadow-sm transition-all active:scale-95 hover:bg-[#2A2A2A] cursor-pointer border border-[#1A1A1A]"
        >
          <span className="material-symbols-outlined text-base">add</span>
          New Paper
        </button>
      </div>

      {/* Horizontal Scroll Section Filters (Tab Style) */}
      <div className="flex overflow-x-auto gap-2 mb-6 hide-scrollbar font-hanken">
        {filterTabs.map((tab) => {
          const isActive = activeFilter === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveFilter(tab)}
              className={`shrink-0 text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-full transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#1A1A1A] text-[#F5F2ED] border border-[#1A1A1A]'
                  : 'border border-[#1A1A1A]/20 text-[#1A1A1A]/70 hover:border-[#1A1A1A]'
              }`}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* Pipeline Sections */}
      <div className="space-y-6">
        {/* Analysis Section */}
        {(activeFilter === 'All Papers' || activeFilter === 'Analysis') && (
          <section className="space-y-3 font-hanken">
            <div className="flex items-center gap-2 border-b border-[#1A1A1A]/10 pb-1.5">
              <span className="w-2 h-2 rounded-full bg-[#1A1A1A]"></span>
              <h3 className="text-[11px] font-bold text-[#1A1A1A] uppercase tracking-[0.25em]">
                Analysis Phase
              </h3>
            </div>

            <div className="space-y-3">
              {analysisPapers.map((paper) => (
                <div
                  key={paper.id}
                  onClick={() => onSelectPaper(paper)}
                  className="bg-[#FFFFFF] border border-[#1A1A1A]/15 p-4 space-y-2 hover:border-[#1A1A1A] cursor-pointer transition-all"
                >
                  <div className="flex justify-between items-start text-xs">
                    <span className="px-2 py-0.5 bg-[#E5E2DD] border border-[#1A1A1A]/10 text-[#1A1A1A] font-bold uppercase text-[9px] tracking-widest">
                      {paper.badge || 'In Progress'}
                    </span>
                    <span className="text-[#1A1A1A]/60 text-[10px] font-bold uppercase tracking-wider">
                      {paper.dueDate || 'Due soon'}
                    </span>
                  </div>

                  <h4 className="font-bold text-sm text-[#1A1A1A] leading-snug">
                    {paper.title}
                  </h4>
                  <p className="font-serif-4 italic text-xs text-[#1A1A1A]/80 line-clamp-2">
                    {paper.abstract}
                  </p>

                  {/* Progress bar if present */}
                  {paper.progressPercent !== undefined && (
                    <div className="pt-1">
                      <div className="flex justify-between items-center mb-1 text-[10px] uppercase tracking-wider font-bold text-[#1A1A1A]">
                        <span>{paper.progressLabel}</span>
                        <span>{paper.progressPercent}%</span>
                      </div>
                      <div className="w-full bg-[#E5E2DD] h-1 overflow-hidden">
                        <div
                          className="bg-[#1A1A1A] h-full transition-all duration-700"
                          style={{ width: `${paper.progressPercent}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {/* Team & Actions */}
                  <div className="flex justify-between items-center pt-2 border-t border-[#1A1A1A]/10">
                    <div className="flex -space-x-2">
                      {paper.team.map((member, i) => (
                        <img
                          key={i}
                          src={member.avatar}
                          alt={member.name}
                          className="w-6 h-6 rounded-full border border-[#F5F2ED] object-cover"
                        />
                      ))}
                      {paper.commentsCount > 0 && (
                        <div className="w-6 h-6 rounded-full border border-[#F5F2ED] bg-[#E5E2DD] text-[9px] font-bold text-[#1A1A1A] flex items-center justify-center">
                          +{paper.commentsCount}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-[#1A1A1A]/60 font-bold text-xs">
                      <span className="material-symbols-outlined text-base">forum</span>
                      <span className="text-[10px] uppercase tracking-wider">{paper.commentsCount}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Literature Review Section */}
        {(activeFilter === 'All Papers' || activeFilter === 'Literature') && (
          <section className="space-y-3 font-hanken">
            <div className="flex items-center gap-2 border-b border-[#1A1A1A]/10 pb-1.5">
              <span className="w-2 h-2 rounded-full bg-[#1A1A1A]"></span>
              <h3 className="text-[11px] font-bold text-[#1A1A1A] uppercase tracking-[0.25em]">
                Literature Review
              </h3>
            </div>

            <div className="space-y-3">
              {literaturePapers.map((paper) => (
                <div
                  key={paper.id}
                  onClick={() => onSelectPaper(paper)}
                  className="bg-[#FFFFFF] border border-[#1A1A1A]/25 p-4 space-y-2 hover:border-[#1A1A1A] cursor-pointer transition-all"
                >
                  <div className="flex justify-between items-start text-xs">
                    <span className="px-2 py-0.5 bg-[#1A1A1A] text-[#F5F2ED] font-bold uppercase text-[9px] tracking-widest">
                      {paper.badge || 'Overdue'}
                    </span>
                    <span className="text-[#1A1A1A] text-[10px] font-bold uppercase tracking-wider">
                      {paper.delayText || 'Delayed'}
                    </span>
                  </div>

                  <h4 className="font-bold text-sm text-[#1A1A1A] leading-snug">
                    {paper.title}
                  </h4>
                  <p className="font-serif-4 italic text-xs text-[#1A1A1A]/80">
                    {paper.abstract}
                  </p>

                  {paper.progressPercent !== undefined && (
                    <div className="pt-1">
                      <div className="flex justify-between items-center mb-1 text-[10px] uppercase tracking-wider font-bold text-[#1A1A1A]">
                        <span>{paper.progressLabel}</span>
                        <span>{paper.progressPercent}%</span>
                      </div>
                      <div className="w-full bg-[#E5E2DD] h-1 overflow-hidden">
                        <div
                          className="bg-[#1A1A1A] h-full transition-all duration-700"
                          style={{ width: `${paper.progressPercent}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-2 border-t border-[#1A1A1A]/10">
                    <div className="flex -space-x-2">
                      {paper.team.map((m, i) => (
                        <img
                          key={i}
                          src={m.avatar}
                          alt={m.name}
                          className="w-6 h-6 rounded-full border border-[#F5F2ED] object-cover"
                        />
                      ))}
                    </div>
                    <span className="material-symbols-outlined text-[#1A1A1A]/60 text-lg">
                      more_vert
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Ideation & Planning Section */}
        {(activeFilter === 'All Papers' || activeFilter === 'Idea') && (
          <section className="space-y-3 font-hanken">
            <div className="flex items-center gap-2 border-b border-[#1A1A1A]/10 pb-1.5">
              <span className="w-2 h-2 rounded-full bg-[#1A1A1A]/40"></span>
              <h3 className="text-[11px] font-bold text-[#1A1A1A] uppercase tracking-[0.25em]">
                Ideation & Planning
              </h3>
            </div>

            <div className="space-y-3">
              {ideaPapers.map((paper) => (
                <div
                  key={paper.id}
                  onClick={() => onSelectPaper(paper)}
                  className="bg-[#FFFFFF] border border-[#1A1A1A]/15 p-4 space-y-2 hover:border-[#1A1A1A] cursor-pointer transition-all"
                >
                  <div className="flex justify-between items-start text-xs">
                    <span className="px-2 py-0.5 bg-[#E5E2DD] text-[#1A1A1A] font-bold uppercase text-[9px] tracking-widest border border-[#1A1A1A]/10">
                      {paper.badge || 'Drafting'}
                    </span>
                  </div>

                  <h4 className="font-bold text-sm text-[#1A1A1A] leading-snug">
                    {paper.title}
                  </h4>
                  <p className="font-serif-4 italic text-xs text-[#1A1A1A]/80">
                    {paper.abstract}
                  </p>

                  <div className="flex justify-between items-center pt-2 border-t border-[#1A1A1A]/10">
                    <div className="flex -space-x-2">
                      {paper.team.map((m, i) => (
                        <img
                          key={i}
                          src={m.avatar}
                          alt={m.name}
                          className="w-6 h-6 rounded-full border border-[#F5F2ED] object-cover"
                        />
                      ))}
                    </div>
                    <div className="flex items-center gap-1 text-[#1A1A1A]/60 text-[10px] font-bold uppercase tracking-wider">
                      <span className="material-symbols-outlined text-sm">
                        attachment
                      </span>
                      <span>{paper.attachmentCount || 3} Files</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
