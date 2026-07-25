import React, { useState } from 'react';
import { Paper, CollaboratorItem, ResearchRadarItem } from '../types';

interface DiscoverViewProps {
  papers: Paper[];
  topCollaborators: CollaboratorItem[];
  researchRadarItems: ResearchRadarItem[];
  onToggleBookmark: (paperId: string) => void;
  onOpenPdf: (paper: Paper) => void;
  onCollaborate: (paper: Paper) => void;
  onSelectPaper: (paper: Paper) => void;
  searchQuery: string;
}

export const DiscoverView: React.FC<DiscoverViewProps> = ({
  papers,
  topCollaborators,
  researchRadarItems,
  onToggleBookmark,
  onOpenPdf,
  onCollaborate,
  onSelectPaper,
  searchQuery,
}) => {
  const [selectedField, setSelectedField] = useState<string>('All');
  const [selectedStudyType, setSelectedStudyType] = useState<string>('All');
  const [selectedNeeds, setSelectedNeeds] = useState<string>('All');

  const fields = ['All', 'AI & ETHICS', 'CLINICAL MEDICINE', 'ECONOMICS', 'QUANTUM BIOLOGY', 'NEUROSCIENCE'];
  const studyTypes = ['All', 'Quantitative Study', 'Qualitative Study', 'Meta-Analysis', 'Longitudinal Study'];
  const needsList = ['All', 'Data Analysis', 'Peer Review', 'Manuscript Writing', 'Translation', 'Data Scraping', 'Econometrics'];

  const filteredPapers = papers.filter((paper) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      paper.title.toLowerCase().includes(query) ||
      paper.authors.toLowerCase().includes(query) ||
      paper.abstract.toLowerCase().includes(query) ||
      (paper.fieldOfStudy && paper.fieldOfStudy.toLowerCase().includes(query));

    const matchesField = selectedField === 'All' || paper.fieldOfStudy === selectedField;
    const matchesStudyType = selectedStudyType === 'All' || paper.studyType === selectedStudyType;
    const matchesNeeds =
      selectedNeeds === 'All' || (paper.needs && paper.needs.includes(selectedNeeds));

    return matchesSearch && matchesField && matchesStudyType && matchesNeeds;
  });

  const clearAllFilters = () => {
    setSelectedField('All');
    setSelectedStudyType('All');
    setSelectedNeeds('All');
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 lg:px-8 py-6 font-sans">
      {/* Filter Dropdowns Bar */}
      <div className="flex flex-wrap items-center gap-3 mb-6 pb-4 border-b border-[#E2E8F0]">
        <div className="flex items-center gap-2">
          <label className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">Field:</label>
          <select
            value={selectedField}
            onChange={(e) => setSelectedField(e.target.value)}
            className="bg-[#FFFFFF] border border-[#CBD5E1] text-xs font-semibold text-[#1E293B] px-3 py-1.5 rounded-md focus:outline-none focus:border-[#233242] cursor-pointer"
          >
            {fields.map((f) => (
              <option key={f} value={f}>{f === 'All' ? 'Field of Study ▾' : f}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">Type:</label>
          <select
            value={selectedStudyType}
            onChange={(e) => setSelectedStudyType(e.target.value)}
            className="bg-[#FFFFFF] border border-[#CBD5E1] text-xs font-semibold text-[#1E293B] px-3 py-1.5 rounded-md focus:outline-none focus:border-[#233242] cursor-pointer"
          >
            {studyTypes.map((st) => (
              <option key={st} value={st}>{st === 'All' ? 'Study Type ▾' : st}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">Needs:</label>
          <select
            value={selectedNeeds}
            onChange={(e) => setSelectedNeeds(e.target.value)}
            className="bg-[#FFFFFF] border border-[#CBD5E1] text-xs font-semibold text-[#1E293B] px-3 py-1.5 rounded-md focus:outline-none focus:border-[#233242] cursor-pointer"
          >
            {needsList.map((n) => (
              <option key={n} value={n}>{n === 'All' ? 'Stage Needs ▾' : n}</option>
            ))}
          </select>
        </div>

        {(selectedField !== 'All' || selectedStudyType !== 'All' || selectedNeeds !== 'All') && (
          <button
            onClick={clearAllFilters}
            className="text-xs font-bold text-[#64748B] hover:text-[#0F172A] underline ml-auto cursor-pointer"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Grid Layout: Main Project List + Right Sidebar Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Research Projects List (Left / Center) */}
        <div className="lg:col-span-8 space-y-6">
          {filteredPapers.length === 0 ? (
            <div className="p-12 text-center bg-[#FFFFFF] border border-[#E2E8F0] space-y-3">
              <span className="material-symbols-outlined text-4xl text-[#94A3B8]">search_off</span>
              <h3 className="font-bold text-base text-[#1E293B]">No research projects found</h3>
              <p className="text-xs text-[#64748B]">Try adjusting your search query or clear active filters.</p>
              <button
                onClick={clearAllFilters}
                className="px-4 py-2 bg-[#233242] text-white text-xs font-bold rounded-sm mt-2"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            filteredPapers.map((paper) => (
              <article
                key={paper.id}
                className="bg-[#FFFFFF] border border-[#E2E8F0] p-6 shadow-xs hover:border-[#CBD5E1] transition-all relative group"
              >
                {/* Header Metadata Row */}
                <div className="flex justify-between items-start gap-4 mb-3">
                  <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
                    <span className="px-2 py-0.5 bg-[#F1F5F9] text-[#1E293B] border border-[#E2E8F0]">
                      {paper.fieldOfStudy || 'GENERAL RESEARCH'}
                    </span>
                    <span>•</span>
                    <span>{paper.studyType || 'Quantitative Study'}</span>
                  </div>

                  {/* Principal Investigator Tag */}
                  <div className="flex items-center gap-2 text-right">
                    <div>
                      <span className="font-bold text-xs text-[#1E293B] block leading-tight">
                        {paper.authors}
                      </span>
                      <span className="text-[10px] font-medium text-[#64748B] block">
                        {paper.institution || 'Stanford University'}
                      </span>
                    </div>
                    <span className="material-symbols-filled text-[#8CC63F] text-lg shrink-0">
                      verified
                    </span>
                  </div>
                </div>

                {/* Project Title */}
                <h2
                  onClick={() => onSelectPaper(paper)}
                  className="font-bold text-xl text-[#0F172A] leading-snug mb-3 cursor-pointer hover:text-[#233242] transition-colors"
                >
                  {paper.title}
                </h2>

                {/* Abstract Text */}
                <p className="text-xs text-[#475569] leading-relaxed mb-5 font-normal">
                  {paper.abstract}
                </p>

                {/* Project Requirements & Needs Tags */}
                {paper.needs && paper.needs.length > 0 && (
                  <div className="flex items-center gap-2 mb-5">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#64748B]">
                      NEEDS:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {paper.needs.map((need) => (
                        <span
                          key={need}
                          className="px-3 py-1 bg-[#F1F5F9] border border-[#E2E8F0] text-[#1E293B] text-[10px] font-semibold rounded-xs"
                        >
                          {need}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Card Footer: Co-authorship & Action Button */}
                <div className="pt-4 border-t border-[#F1F5F9] flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs text-[#64748B]">
                    <span className="material-symbols-outlined text-base">co_present</span>
                    <span className="italic font-serif">{paper.coauthorshipNote || 'Co-authorship for substantial work'}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onOpenPdf(paper)}
                      className="px-3.5 py-2 border border-[#CBD5E1] text-[#1E293B] hover:bg-[#F8FAFC] text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <span className="material-symbols-filled text-sm text-[#8CC63F]">folder_shared</span>
                      <span>Google Doc Link</span>
                    </button>
                    <button
                      onClick={() => onCollaborate(paper)}
                      className="px-5 py-2 bg-[#233242] hover:bg-[#1A2633] text-white text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
                    >
                      Apply to Project
                    </button>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>

        {/* Right Sidebar Widgets */}
        <div className="lg:col-span-4 space-y-6">
          {/* Research Radar Widget */}
          <div className="bg-[#233242] text-white p-6 shadow-md border border-[#1A2633] relative overflow-hidden">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-[#8CC63F] text-xl">radar</span>
              <h3 className="font-bold text-sm tracking-wide">Research Radar</h3>
            </div>
            <p className="text-xs text-[#CBD5E1] leading-relaxed mb-4">
              Based on your publications in <strong className="text-white">Neural Networks</strong>, these projects need your skills:
            </p>

            <div className="space-y-2.5">
              {researchRadarItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onCollaborate(papers[0])}
                  className="p-3.5 bg-[#2E3F52] hover:bg-[#384A5E] border border-[#3E5166] transition-colors cursor-pointer group flex justify-between items-center"
                >
                  <div>
                    <h4 className="font-bold text-xs text-white group-hover:text-[#8CC63F] transition-colors">
                      {item.title}
                    </h4>
                    <span className="text-[10px] text-[#94A3B8] font-medium block mt-0.5">
                      {item.skillNeeded}
                    </span>
                  </div>
                  <span className="material-symbols-outlined text-sm text-[#94A3B8] group-hover:text-white group-hover:translate-x-1 transition-transform">
                    arrow_forward
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Collaborators Widget */}
          <div className="bg-[#FFFFFF] border border-[#E2E8F0] p-6 shadow-xs">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-sm text-[#0F172A]">Top Collaborators</h3>
              <span className="material-symbols-outlined text-base text-[#94A3B8]" title="Verified Collaborators Network">
                info
              </span>
            </div>

            <div className="space-y-3.5 mb-5">
              {topCollaborators.map((collab) => (
                <div key={collab.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img
                        src={collab.avatar}
                        alt={collab.name}
                        className="w-10 h-10 rounded-full object-cover border border-[#E2E8F0]"
                      />
                      {collab.isOnline && (
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#8CC63F] border-2 border-white"></span>
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-[#0F172A] leading-snug">
                        {collab.name}
                      </h4>
                      <p className="text-[10px] text-[#64748B] font-medium">
                        {collab.field} • {collab.collabsCount} Collabs
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => alert(`Connect proposal sent to ${collab.name}`)}
                    className="w-8 h-8 rounded-full border border-[#CBD5E1] hover:border-[#233242] hover:bg-[#233242] hover:text-white text-[#475569] flex items-center justify-center transition-all cursor-pointer"
                    title={`Invite ${collab.name} to collaborate`}
                  >
                    <span className="material-symbols-outlined text-sm">person_add</span>
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={() => alert('Opening full Researcher Network Map...')}
              className="w-full py-2.5 border border-[#CBD5E1] hover:border-[#233242] text-[#1E293B] hover:bg-[#233242] hover:text-white text-xs font-bold transition-all cursor-pointer text-center"
            >
              View Network
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
