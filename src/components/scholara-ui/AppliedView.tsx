import React, { useState } from 'react';
import { UserProfile, ActiveContribution, ActivityItem, Paper } from '../types';

interface AppliedViewProps {
  user: UserProfile;
  activeContributions: ActiveContribution[];
  activities: ActivityItem[];
  papers: Paper[];
  onSelectPaper: (paper: Paper) => void;
  onOpenPdf: (paper: Paper) => void;
}

export const AppliedView: React.FC<AppliedViewProps> = ({
  user,
  activeContributions: initialContributions,
  activities,
  papers,
  onSelectPaper,
  onOpenPdf,
}) => {
  const [contributions, setContributions] = useState<ActiveContribution[]>(initialContributions);
  const [toast, setToast] = useState<string | null>(null);

  const showToastMsg = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleStepClick = (contribId: string, stepKey: 'interest' | 'sharedDocs' | 'submission' | 'review') => {
    setContributions((prev) =>
      prev.map((c) => {
        if (c.id === contribId) {
          const updatedSteps = { ...c.steps, [stepKey]: !c.steps[stepKey] };
          showToastMsg(`Updated stage progress for "${c.title.slice(0, 30)}..."`);
          return { ...c, steps: updatedSteps };
        }
        return c;
      })
    );
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 lg:px-8 py-6 font-sans">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-16 right-8 z-50 bg-[#233242] text-white px-4 py-2.5 shadow-lg border border-[#384A5E] text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-150">
          <span className="material-symbols-filled text-[#8CC63F] text-base">check_circle</span>
          <span>{toast}</span>
        </div>
      )}

      {/* Top Bento Summary Metrics Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {/* Card 1: Active Collaborations */}
        <div className="p-5 bg-[#FFFFFF] border border-[#E2E8F0] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#64748B] block mb-1">
              ACTIVE COLLABORATIONS
            </span>
            <div className="flex items-baseline gap-1">
              <span className="font-extrabold text-2xl text-[#0F172A]">
                {user.collaborationsCount}
              </span>
              <span className="text-xs font-semibold text-[#64748B]">/ 3 limit</span>
            </div>
          </div>
          <div className="w-11 h-11 bg-[#F1F5F9] text-[#233242] flex items-center justify-center rounded-sm">
            <span className="material-symbols-outlined text-2xl text-[#8CC63F]">sync</span>
          </div>
        </div>

        {/* Card 2: Tasks Pending */}
        <div className="p-5 bg-[#FFFFFF] border border-[#E2E8F0] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#64748B] block mb-1">
              TASKS PENDING
            </span>
            <span className="font-extrabold text-2xl text-[#0F172A]">
              {user.pendingTasksCount}
            </span>
          </div>
          <div className="w-11 h-11 bg-[#F1F5F9] text-[#233242] flex items-center justify-center rounded-sm">
            <span className="material-symbols-outlined text-2xl">assignment</span>
          </div>
        </div>

        {/* Card 3: Next Deadline */}
        <div className="p-5 bg-[#FFFFFF] border border-[#E2E8F0] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#64748B] block mb-1">
              NEXT DEADLINE
            </span>
            <span className="font-extrabold text-2xl text-[#0F172A]">
              {user.nextDeadline.date}
            </span>
          </div>
          <div className="w-11 h-11 bg-[#F1F5F9] text-[#233242] flex items-center justify-center rounded-sm">
            <span className="material-symbols-outlined text-2xl">event</span>
          </div>
        </div>
      </div>

      {/* Main Column Grid: Active Contributions vs Collaboration Health & Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Active Contributions */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
            <h2 className="text-sm font-bold text-[#0F172A] tracking-tight">
              Active Contributions
            </h2>
            <span className="text-xs text-[#64748B] font-medium">
              Showing {contributions.length} active projects
            </span>
          </div>

          <div className="space-y-6">
            {contributions.map((contrib) => {
              const matchedPaper = papers.find((p) => p.title.includes(contrib.title.slice(0, 15))) || papers[0];
              return (
                <article
                  key={contrib.id}
                  className="bg-[#FFFFFF] border border-[#E2E8F0] p-6 shadow-xs space-y-5"
                >
                  {/* Status Badges Row */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="px-2.5 py-1 bg-[#F1F5F9] border border-[#E2E8F0] text-[10px] font-bold uppercase tracking-wider text-[#334155]">
                      {contrib.statusTag}
                    </span>

                    {contrib.statusAlert && (
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                          contrib.statusAlertType === 'error'
                            ? 'text-[#DC2626]'
                            : 'text-[#8CC63F]'
                        }`}
                      >
                        <span className="material-symbols-outlined text-sm">
                          {contrib.statusAlertType === 'error' ? 'warning' : 'sync'}
                        </span>
                        {contrib.statusAlert}
                      </span>
                    )}
                  </div>

                  {/* Title & PI Info */}
                  <div>
                    <h3
                      onClick={() => onSelectPaper(matchedPaper)}
                      className="font-bold text-lg text-[#0F172A] leading-snug hover:text-[#233242] cursor-pointer transition-colors"
                    >
                      {contrib.title}
                    </h3>
                    <div className="flex items-center gap-3 mt-2 text-xs text-[#64748B] font-medium">
                      <div className="flex items-center gap-1.5">
                        <img
                          src={contrib.piAvatar}
                          alt={contrib.piName}
                          className="w-5 h-5 rounded-full object-cover"
                        />
                        <span>PI: {contrib.piName}</span>
                      </div>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">calendar_month</span>
                        <span>Deadline: {contrib.deadline}</span>
                      </div>
                    </div>
                  </div>

                  {/* 4-Step Milestone Progress Tracker */}
                  <div className="pt-2 pb-1">
                    <div className="relative flex items-center justify-between">
                      {/* Connecting Background Line */}
                      <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-0.5 bg-[#E2E8F0] z-0"></div>

                      {/* Active Progress Line */}
                      <div
                        className="absolute left-6 top-1/2 -translate-y-1/2 h-0.5 bg-[#8CC63F] z-0 transition-all duration-300"
                        style={{
                          width: contrib.steps.submission
                            ? '66%'
                            : contrib.steps.sharedDocs
                            ? '33%'
                            : '0%',
                        }}
                      ></div>

                      {/* Step 1: Interest */}
                      <div
                        onClick={() => handleStepClick(contrib.id, 'interest')}
                        className="relative z-10 flex flex-col items-center group cursor-pointer"
                      >
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                            contrib.steps.interest
                              ? 'bg-[#8CC63F] text-white'
                              : 'bg-white border-2 border-[#CBD5E1] text-[#64748B]'
                          }`}
                        >
                          {contrib.steps.interest ? '✓' : '1'}
                        </div>
                        <span className="text-[10px] font-bold text-[#1E293B] mt-1.5">
                          Interest
                        </span>
                      </div>

                      {/* Step 2: Shared Docs */}
                      <div
                        onClick={() => handleStepClick(contrib.id, 'sharedDocs')}
                        className="relative z-10 flex flex-col items-center group cursor-pointer"
                      >
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                            contrib.steps.sharedDocs
                              ? 'bg-[#8CC63F] text-white'
                              : 'bg-white border-2 border-[#8CC63F] text-[#8CC63F]'
                          }`}
                        >
                          {contrib.steps.sharedDocs ? '✓' : '2'}
                        </div>
                        <span className="text-[10px] font-bold text-[#1E293B] mt-1.5">
                          Shared Docs
                        </span>
                      </div>

                      {/* Step 3: Submission */}
                      <div
                        onClick={() => handleStepClick(contrib.id, 'submission')}
                        className="relative z-10 flex flex-col items-center group cursor-pointer"
                      >
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                            contrib.steps.submission
                              ? 'bg-[#8CC63F] text-white'
                              : 'bg-white border-2 border-[#CBD5E1] text-[#64748B]'
                          }`}
                        >
                          {contrib.steps.submission ? '✓' : '3'}
                        </div>
                        <span className="text-[10px] font-bold text-[#1E293B] mt-1.5">
                          Submission
                        </span>
                      </div>

                      {/* Step 4: Review */}
                      <div
                        onClick={() => handleStepClick(contrib.id, 'review')}
                        className="relative z-10 flex flex-col items-center group cursor-pointer"
                      >
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                            contrib.steps.review
                              ? 'bg-[#8CC63F] text-white'
                              : 'bg-[#F1F5F9] border-2 border-[#E2E8F0] text-[#94A3B8]'
                          }`}
                        >
                          {contrib.steps.review ? '✓' : '4'}
                        </div>
                        <span className="text-[10px] font-medium text-[#64748B] mt-1.5">
                          Review
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Buttons Action Row */}
                  <div className="flex flex-wrap gap-3 pt-2">
                    <button
                      onClick={() => {
                        showToastMsg('Contribution upload portal opened');
                        onOpenPdf(matchedPaper);
                      }}
                      className="px-5 py-2.5 bg-[#233242] hover:bg-[#1A2633] text-white text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs"
                    >
                      <span className="material-symbols-outlined text-base">upload_file</span>
                      <span>Submit Contribution</span>
                    </button>

                    <a
                      href={matchedPaper.googleDocsUrl || 'https://docs.google.com'}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => {
                        showToastMsg('Opening Google Workspace Drive Folder...');
                      }}
                      className="px-4 py-2.5 border border-[#CBD5E1] text-[#1E293B] hover:bg-[#F8FAFC] text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
                    >
                      <span className="material-symbols-filled text-base text-[#8CC63F]">folder_shared</span>
                      <span>View Shared Materials (Google Drive)</span>
                    </a>
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        {/* Right Column Sidebar: Collaboration Health & Activity Feed */}
        <div className="lg:col-span-4 space-y-6">
          {/* Collaboration Health Card */}
          <div className="bg-[#233242] text-white p-6 shadow-md border border-[#1A2633] space-y-5">
            <h3 className="font-bold text-sm tracking-wide border-b border-[#384A5E] pb-3">
              Collaboration Health
            </h3>

            {/* Activity Score Bar */}
            <div>
              <div className="flex justify-between text-xs font-bold mb-1.5">
                <span className="text-[10px] uppercase tracking-wider text-[#CBD5E1]">
                  ACTIVITY SCORE
                </span>
                <span className="text-[#8CC63F]">{user.activityScorePercent || 94}%</span>
              </div>
              <div className="w-full bg-[#1E293B] h-2 rounded-full overflow-hidden">
                <div
                  className="bg-[#8CC63F] h-full transition-all duration-500"
                  style={{ width: `${user.activityScorePercent || 94}%` }}
                ></div>
              </div>
            </div>

            {/* Peer Reviews Bar */}
            <div>
              <div className="flex justify-between text-xs font-bold mb-1.5">
                <span className="text-[10px] uppercase tracking-wider text-[#CBD5E1]">
                  PEER REVIEWS
                </span>
                <span className="text-white">{user.peerReviewsCount || 21}</span>
              </div>
              <div className="w-full bg-[#1E293B] h-2 rounded-full overflow-hidden">
                <div className="bg-[#CBD5E1] h-full w-3/4"></div>
              </div>
            </div>

            {/* Scholar Rank Row */}
            <div className="pt-3 border-t border-[#384A5E] flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-widest font-bold text-[#CBD5E1]">
                SCHOLAR RANK
              </span>
              <span className="font-extrabold text-base text-white">
                {user.scholarRank || 'Silver II'}
              </span>
            </div>
          </div>

          {/* Activity Feed */}
          <div className="bg-[#FFFFFF] border border-[#E2E8F0] p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-[#E2E8F0] pb-3">
              <span className="material-symbols-outlined text-lg text-[#233242]">history</span>
              <h3 className="font-bold text-sm text-[#0F172A]">Activity Feed</h3>
            </div>

            <div className="space-y-4 text-xs font-sans">
              {activities.map((act) => (
                <div key={act.id} className="flex gap-3 relative pl-1">
                  <span className="w-2 h-2 rounded-full bg-[#8CC63F] mt-1.5 shrink-0"></span>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block">
                      {act.timeAgo}
                    </span>
                    <p className="font-bold text-[#0F172A] mt-0.5 leading-snug">
                      {act.authorName}
                    </p>
                    <p className="text-[#475569] text-[11px] mt-0.5 leading-relaxed">
                      {act.detailText || act.title}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
