import React, { useState } from 'react';
import { Paper, Applicant, DiscussionComment } from '../types';

interface MyPapersViewProps {
  papers: Paper[];
  applicants: Applicant[];
  comments: DiscussionComment[];
  onOpenNewPaperModal: () => void;
  onOpenPdf: (paper: Paper) => void;
  onSelectPaper: (paper: Paper) => void;
  onOpenDiscussion: (paper: Paper) => void;
}

export const MyPapersView: React.FC<MyPapersViewProps> = ({
  papers,
  applicants: initialApplicants,
  comments,
  onOpenNewPaperModal,
  onOpenPdf,
  onSelectPaper,
  onOpenDiscussion,
}) => {
  const [applicantList, setApplicantList] = useState<Applicant[]>(initialApplicants);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleAcceptApplicant = (appId: string, name: string) => {
    setApplicantList((prev) =>
      prev.map((app) => (app.id === appId ? { ...app, status: 'accepted' } : app))
    );
    showNotification(`Accepted ${name} as a verified co-author!`);
  };

  const handleDeclineApplicant = (appId: string, name: string) => {
    setApplicantList((prev) =>
      prev.map((app) => (app.id === appId ? { ...app, status: 'rejected' } : app))
    );
    showNotification(`Declined proposal from ${name}.`);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 lg:px-8 py-6 font-sans">
      {/* Toast Notification Banner */}
      {toastMsg && (
        <div className="fixed top-16 right-8 z-50 bg-[#233242] text-white px-4 py-2.5 shadow-lg border border-[#384A5E] text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-150">
          <span className="material-symbols-filled text-[#8CC63F] text-base">check_circle</span>
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Banner Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-6 border-b border-[#E2E8F0]">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0F172A] tracking-tight">
            My Papers & Proposals
          </h1>
          <p className="text-xs text-[#64748B] mt-1">
            Manage your uploaded pre-prints, review applicant co-authors, and track live peer comments.
          </p>
        </div>

        <button
          onClick={onOpenNewPaperModal}
          className="px-5 py-2.5 bg-[#233242] hover:bg-[#1A2633] text-white text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95"
        >
          <span className="material-symbols-outlined text-lg">post_add</span>
          <span>Post New Paper</span>
        </button>
      </div>

      {/* Paper List with Applicants */}
      <div className="space-y-8">
        {papers.map((paper) => {
          const paperApplicants = applicantList.filter(
            (app) => app.status === 'pending' || app.status === 'accepted'
          );

          return (
            <div
              key={paper.id}
              className="bg-[#FFFFFF] border border-[#E2E8F0] shadow-xs p-6 space-y-6"
            >
              {/* Paper Details Box */}
              <div className="space-y-3 pb-5 border-b border-[#F1F5F9]">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="px-2.5 py-0.5 bg-[#F1F5F9] border border-[#E2E8F0] text-[10px] font-bold uppercase tracking-wider text-[#1E293B]">
                    {paper.fieldOfStudy || 'AI & ETHICS'} • {paper.studyType || 'Quantitative Study'}
                  </span>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => onOpenPdf(paper)}
                      className="text-xs font-bold text-[#233242] hover:underline flex items-center gap-1.5 cursor-pointer"
                    >
                      <span className="material-symbols-filled text-base text-[#8CC63F]">folder_shared</span>
                      <span>Google Doc Link</span>
                    </button>
                    <button
                      onClick={() => onOpenDiscussion(paper)}
                      className="text-xs font-bold text-[#233242] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-base">forum</span>
                      <span>Discussion ({paper.commentsCount})</span>
                    </button>
                  </div>
                </div>

                <h2
                  onClick={() => onSelectPaper(paper)}
                  className="text-xl font-bold text-[#0F172A] hover:text-[#233242] cursor-pointer transition-colors"
                >
                  {paper.title}
                </h2>

                <p className="text-xs text-[#475569] leading-relaxed">
                  {paper.abstract}
                </p>

                {/* Progress & Metrics Badges Bar */}
                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-[#EEF4FA] border border-[#CBD5E1] text-[11px] font-bold text-[#1E293B]">
                    <span className="material-symbols-outlined text-sm text-[#233242]">group_add</span>
                    <span>{paper.applicantsCount || 4} Applicants</span>
                  </div>

                  <div className="flex items-center gap-1.5 px-3 py-1 bg-[#F1F5F9] border border-[#E2E8F0] text-[11px] font-semibold text-[#475569]">
                    <span className="material-symbols-outlined text-sm text-[#8CC63F]">groups</span>
                    <span>{paper.joinedContributorsCount || 12} Joined Contributors</span>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-bold text-[#1E293B] ml-auto">
                    <span>Overall Progress: {paper.overallProgressPercent || 72}%</span>
                    <div className="w-24 bg-[#E2E8F0] h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-[#8CC63F] h-full"
                        style={{ width: `${paper.overallProgressPercent || 72}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Applicants & Co-Author Proposals Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-[#0F172A] uppercase tracking-wider flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg text-[#233242]">badge</span>
                    <span>Applicants & Co-Author Proposals</span>
                  </h3>
                  <span className="text-xs text-[#64748B] font-medium">
                    {paperApplicants.length} pending candidate review
                  </span>
                </div>

                <div className="space-y-4">
                  {paperApplicants.map((app) => (
                    <div
                      key={app.id}
                      className={`p-5 border transition-all ${
                        app.status === 'accepted'
                          ? 'bg-[#F0FDF4] border-[#8CC63F]'
                          : 'bg-[#F8FAFC] border-[#E2E8F0]'
                      }`}
                    >
                      {/* Candidate Header */}
                      <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={app.avatar || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=300'}
                            alt={app.name}
                            className="w-11 h-11 rounded-full object-cover border border-[#E2E8F0]"
                          />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h4 className="font-bold text-sm text-[#0F172A]">
                                {app.name}
                              </h4>
                              {app.isVerified && (
                                <span
                                  className="material-symbols-filled text-[#8CC63F] text-base"
                                  title="Verified Scholar"
                                >
                                  verified
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-[#64748B] font-medium">
                              {app.title} • <span className="italic">{app.appliedTimeAgo}</span>
                            </p>
                          </div>
                        </div>

                        <span className="px-2.5 py-1 bg-[#233242] text-white text-[10px] font-bold uppercase tracking-wider">
                          {app.stage}
                        </span>
                      </div>

                      {/* Candidate Cover Quote Box */}
                      <div className="bg-white p-4 border border-[#E2E8F0] mb-4 text-xs text-[#334155] italic leading-relaxed font-serif">
                        {app.coverQuote}
                      </div>

                      {/* Candidate Meta & Action Buttons */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#E2E8F0]/60">
                        <div className="flex items-center gap-3 text-xs font-medium text-[#64748B]">
                          <span>Est. Completion: <strong className="text-[#0F172A]">{app.estCompletion}</strong></span>
                          <span>•</span>
                          <span>Field: <strong className="text-[#0F172A]">{app.field}</strong></span>
                        </div>

                        <div className="flex items-center gap-2">
                          {app.status === 'accepted' ? (
                            <span className="px-4 py-1.5 bg-[#8CC63F] text-white text-xs font-bold flex items-center gap-1">
                              <span className="material-symbols-outlined text-base">check</span>
                              Accepted Co-Author
                            </span>
                          ) : (
                            <>
                              <button
                                onClick={() => handleAcceptApplicant(app.id, app.name)}
                                className="px-4 py-2 bg-[#233242] hover:bg-[#1A2633] text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
                              >
                                <span className="material-symbols-outlined text-base">check</span>
                                Accept Co-Author
                              </button>

                              <button
                                onClick={() => handleDeclineApplicant(app.id, app.name)}
                                className="px-3.5 py-2 border border-[#CBD5E1] text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] text-xs font-bold transition-all cursor-pointer"
                              >
                                Decline
                              </button>
                            </>
                          )}

                          <button
                            onClick={() => onOpenDiscussion(paper)}
                            className="px-3.5 py-2 border border-[#CBD5E1] text-[#1E293B] hover:bg-[#F1F5F9] text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-base">chat_bubble</span>
                            <span>Thread</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
