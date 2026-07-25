import React from 'react';
import { Paper, UserProfile, ActiveContribution } from '../types';

interface TrackerViewProps {
  user: UserProfile;
  papers: Paper[];
  contributions: ActiveContribution[];
  onSelectPaper: (paper: Paper) => void;
}

export const TrackerView: React.FC<TrackerViewProps> = ({
  user,
  papers,
  contributions,
  onSelectPaper,
}) => {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 lg:px-8 py-6 font-sans">
      {/* Tracker Banner Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-6 border-b border-[#E2E8F0]">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0F172A] tracking-tight">
            Research & Grant Progress Tracker
          </h1>
          <p className="text-xs text-[#64748B] mt-1">
            Real-time analytics for active pre-prints, grant milestones, and team submission deadlines.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => alert('Exporting research progress log as CSV...')}
            className="px-4 py-2 border border-[#CBD5E1] text-[#1E293B] hover:bg-[#F8FAFC] text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">download</span>
            <span>Export Analytics</span>
          </button>
        </div>
      </div>

      {/* Progress Cards Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Card 1: Milestones Met */}
        <div className="bg-[#FFFFFF] border border-[#E2E8F0] p-6 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-[#64748B]">
            <span className="text-[10px] font-bold uppercase tracking-wider">MILESTONES COMPLETED</span>
            <span className="material-symbols-outlined text-xl text-[#8CC63F]">task_alt</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[#0F172A]">18 / 24</span>
            <span className="text-xs font-semibold text-[#8CC63F]">+12% vs last month</span>
          </div>
          <div className="w-full bg-[#E2E8F0] h-2 rounded-full overflow-hidden">
            <div className="bg-[#8CC63F] h-full" style={{ width: '75%' }}></div>
          </div>
        </div>

        {/* Card 2: Citation Velocity */}
        <div className="bg-[#FFFFFF] border border-[#E2E8F0] p-6 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-[#64748B]">
            <span className="text-[10px] font-bold uppercase tracking-wider">CITATION VELOCITY</span>
            <span className="material-symbols-outlined text-xl text-[#233242]">trending_up</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[#0F172A]">142</span>
            <span className="text-xs font-semibold text-[#64748B]">citations indexed</span>
          </div>
          <div className="w-full bg-[#E2E8F0] h-2 rounded-full overflow-hidden">
            <div className="bg-[#233242] h-full" style={{ width: '64%' }}></div>
          </div>
        </div>

        {/* Card 3: ORCID Score */}
        <div className="bg-[#FFFFFF] border border-[#E2E8F0] p-6 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-[#64748B]">
            <span className="text-[10px] font-bold uppercase tracking-wider">VERIFIED REVIEWS</span>
            <span className="material-symbols-filled text-xl text-[#8CC63F]">verified_user</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[#0F172A]">{user.peerReviewsCount || 21}</span>
            <span className="text-xs font-semibold text-[#64748B]">peer evaluations</span>
          </div>
          <div className="w-full bg-[#E2E8F0] h-2 rounded-full overflow-hidden">
            <div className="bg-[#8CC63F] h-full" style={{ width: '88%' }}></div>
          </div>
        </div>
      </div>

      {/* Detailed Research Timeline Breakdown Table */}
      <div className="bg-[#FFFFFF] border border-[#E2E8F0] shadow-xs p-6 space-y-4">
        <h3 className="font-bold text-sm text-[#0F172A] uppercase tracking-wider flex items-center gap-2">
          <span className="material-symbols-outlined text-lg text-[#233242]">analytics</span>
          <span>Project Milestone Roadmap</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse font-sans">
            <thead>
              <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[#64748B] text-[10px] font-bold uppercase tracking-wider">
                <th className="p-3">Paper Title</th>
                <th className="p-3">Field</th>
                <th className="p-3">Phase / Stage</th>
                <th className="p-3">Overall Progress</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {papers.map((paper) => (
                <tr key={paper.id} className="hover:bg-[#F8FAFC] transition-colors">
                  <td className="p-3 font-bold text-[#0F172A] max-w-xs truncate">
                    {paper.title}
                  </td>
                  <td className="p-3 text-[#64748B] font-semibold">
                    {paper.fieldOfStudy || 'General'}
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 bg-[#EEF4FA] text-[#1E293B] font-bold text-[10px] uppercase">
                      {paper.status}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#0F172A] text-[11px] w-8">
                        {paper.overallProgressPercent || 65}%
                      </span>
                      <div className="w-24 bg-[#E2E8F0] h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-[#8CC63F] h-full"
                          style={{ width: `${paper.overallProgressPercent || 65}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => onSelectPaper(paper)}
                      className="px-3 py-1 bg-[#233242] text-white text-[10px] font-bold hover:bg-[#1A2633] transition-colors cursor-pointer"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
