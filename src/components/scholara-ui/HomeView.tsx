import React, { useState } from 'react';
import { UserProfile, ActivityItem, Paper } from '../types';

interface HomeViewProps {
  user: UserProfile;
  activities: ActivityItem[];
  papers: Paper[];
  onSelectPaper: (paper: Paper) => void;
  onNavigateToTab: (tab: 'discover' | 'papers' | 'profile') => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  user,
  activities,
  papers,
  onSelectPaper,
  onNavigateToTab,
}) => {
  const [showNotificationPopup, setShowNotificationPopup] = useState(false);

  // Find a paper to link to when activity is clicked
  const samplePaper = papers.find((p) => p.id === 'p-alphafold') || papers[0];

  return (
    <div className="pb-28 max-w-lg mx-auto w-full px-4 pt-3 font-serif-4">
      {/* Editorial Header */}
      <header className="flex justify-between items-center py-3 sticky top-0 bg-[#F5F2ED]/90 backdrop-blur-md z-40 mb-5 border-b border-[#1A1A1A]/15">
        <div className="flex items-center gap-3">
          <div
            onClick={() => onNavigateToTab('profile')}
            className="w-10 h-10 rounded-full overflow-hidden border border-[#1A1A1A]/30 cursor-pointer hover:ring-2 hover:ring-[#1A1A1A] transition-all"
          >
            <img className="w-full h-full object-cover" src={user.avatar} alt={user.name} />
          </div>
          <div>
            <span className="text-[9px] uppercase tracking-[0.3em] font-bold text-[#1A1A1A]/50 block font-hanken">
              Atelier Archive
            </span>
            <span className="font-serif-4 italic font-bold text-xl text-[#1A1A1A]">ScholarHub</span>
          </div>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowNotificationPopup(!showNotificationPopup)}
            className="w-9 h-9 flex items-center justify-center rounded-full transition-all duration-200 active:scale-95 border border-[#1A1A1A]/20 hover:bg-[#1A1A1A] hover:text-[#F5F2ED] text-[#1A1A1A]"
          >
            <span className="material-symbols-outlined text-lg">notifications</span>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#1A1A1A]"></span>
          </button>

          {showNotificationPopup && (
            <div className="absolute right-0 top-12 w-80 bg-[#F5F2ED] rounded-none shadow-xl border border-[#1A1A1A] p-4 z-50 animate-in fade-in zoom-in-95 duration-150 font-hanken">
              <div className="flex items-center justify-between mb-2 pb-2 border-b border-[#1A1A1A]/15">
                <span className="font-bold text-[10px] uppercase tracking-[0.2em] text-[#1A1A1A]">
                  Notifications (2)
                </span>
                <button
                  onClick={() => setShowNotificationPopup(false)}
                  className="text-[10px] uppercase tracking-wider text-[#1A1A1A]/60 hover:text-[#1A1A1A]"
                >
                  Close
                </button>
              </div>
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-[#2A2A2A] text-[#F5F2ED] border border-[#1A1A1A]">
                  <span className="font-bold text-xs uppercase tracking-wider block text-[#F5F2ED]">
                    Peer Review Live
                  </span>
                  <p className="text-[#F5F2ED]/80 text-[11px] mt-1 font-serif-4 italic">
                    Your latest peer review for "Quantum Lattice Dynamics" is live.
                  </p>
                </div>
                <div className="p-3 bg-[#E5E2DD] border border-[#1A1A1A]/20">
                  <span className="font-bold text-xs uppercase tracking-wider block text-[#1A1A1A]">
                    New Dataset Uploaded
                  </span>
                  <p className="text-[#1A1A1A]/70 text-[11px] mt-1 font-hanken">
                    Sarah Li uploaded Core_Samples_V4.csv (14.2 MB)
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="space-y-6">
        {/* Welcome Section */}
        <section className="space-y-2">
          <span className="text-[10px] uppercase tracking-[0.35em] text-[#1A1A1A]/50 block font-semibold font-hanken">
            Volume 01 / Issue 04
          </span>
          <h1 className="text-3xl font-light tracking-tight text-[#1A1A1A]">
            Welcome back, <span className="italic font-serif-4 font-normal">Helena.</span>
          </h1>
          {user.peerReviewNotice && (
            <div
              onClick={() => onSelectPaper(samplePaper)}
              className="flex items-center gap-3 p-3.5 bg-[#E5E2DD] border border-[#1A1A1A]/20 cursor-pointer hover:border-[#1A1A1A] transition-colors group"
            >
              <span className="material-symbols-filled text-[#1A1A1A] text-xl shrink-0">
                verified
              </span>
              <p className="font-hanken text-xs text-[#1A1A1A] leading-snug">
                Your latest peer review for <span className="italic font-serif-4 font-semibold">"Quantum Lattice Dynamics"</span> is now live.
              </p>
              <span className="material-symbols-outlined text-sm text-[#1A1A1A] ml-auto group-hover:translate-x-1 transition-transform">
                chevron_right
              </span>
            </div>
          )}
        </section>

        {/* Quick Stats - Editorial High Contrast Bento Grid */}
        <section className="grid grid-cols-2 gap-3 font-hanken">
          <div
            onClick={() => onNavigateToTab('papers')}
            className="col-span-2 p-5 bg-[#1A1A1A] text-[#F5F2ED] border border-[#1A1A1A] flex justify-between items-end cursor-pointer hover:bg-[#2A2A2A] transition-colors"
          >
            <div className="space-y-1">
              <span className="text-[9px] uppercase tracking-[0.3em] text-[#F5F2ED]/60 font-bold block">
                Next Deadline
              </span>
              <p className="font-bold text-2xl text-[#F5F2ED] tracking-tight">{user.nextDeadline.date}</p>
              <p className="text-xs text-[#F5F2ED]/80 font-serif-4 italic">{user.nextDeadline.title}</p>
            </div>
            <span className="material-symbols-outlined text-[#F5F2ED] text-3xl">
              event
            </span>
          </div>

          <div className="p-4 bg-[#FFFFFF] border border-[#1A1A1A]/15">
            <span className="text-[9px] uppercase tracking-[0.25em] text-[#1A1A1A]/50 font-bold block">
              Collaborations
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="font-bold text-2xl text-[#1A1A1A]">
                {user.collaborationsCount}
              </span>
              <span className="text-[#1A1A1A] font-bold text-xs uppercase tracking-wider">+1 active</span>
            </div>
            <div className="flex mt-3 -space-x-2">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuB90szSzUNErMk9q-PYgFbzShRUm10jVkWMkOoKBiFSGfQcMgXBPJYtZnn6KS4PkiWh0dv5sG5XWZVxnSU3b5BNEc5A3l6rVFHZ2HknoU5vtQy8OXwizN_rDwFrGhEaTq2BUFk3toSDiRJWDjNEg2ZHgJKkSqctGkTRcug5qCLhzGAuA1IjEAuwF3U2KKQ_08bFHgj0kdmTP60kBUrrYwl55GJtslRof15zCjxJ0zox6LeRwfng3YU9QTZC8TNmw8AmLmTh7J7bWgQ"
                className="w-6 h-6 rounded-full border border-[#F5F2ED] object-cover"
                alt="Sarah"
              />
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAA0O4thKJc4ZyYW3qdKICfKE6r1j8ny39mDiF20Um-iAVTIrCa2DdPp5IbxxQZAvKlF6vwwIfct4IcaVbCui3uJN5D7DZZO0sjnZ215KGpV7b6a8Mt6vXGvSSGw-tkkIwwT0Gs4YOLnLi_juGpN7c6xj-8ZemrYGmTRTe1ldXwqUy_yRh954JPrTH-tD1VwIECirtdR9FEU8ilEYZrpcNR4B6McWXXrY3k7WysgU4cWzlZpgxO9o2GOxCG9yd8WpFp0MX51vgKpKo"
                className="w-6 h-6 rounded-full border border-[#F5F2ED] object-cover"
                alt="Julian"
              />
              <div className="w-6 h-6 rounded-full border border-[#F5F2ED] bg-[#E5E2DD] text-[9px] font-bold text-[#1A1A1A] flex items-center justify-center">
                +1
              </div>
            </div>
          </div>

          <div
            onClick={() => onNavigateToTab('papers')}
            className="p-4 bg-[#FFFFFF] border border-[#1A1A1A]/15 cursor-pointer hover:border-[#1A1A1A] transition-colors"
          >
            <span className="text-[9px] uppercase tracking-[0.25em] text-[#1A1A1A]/50 font-bold block">
              Pending Tasks
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-bold text-2xl text-[#1A1A1A]">
                {user.pendingTasksCount}
              </span>
            </div>
            <div className="w-full bg-[#E5E2DD] h-1 mt-4 overflow-hidden">
              <div className="bg-[#1A1A1A] h-full w-2/3"></div>
            </div>
          </div>
        </section>

        {/* Activity Feed - Editorial Timeline */}
        <section className="space-y-4 font-hanken">
          <div className="flex justify-between items-center border-b border-[#1A1A1A]/15 pb-2">
            <h2 className="text-[11px] uppercase tracking-[0.3em] font-bold text-[#1A1A1A]">
              Recent Activity
            </h2>
            <button
              onClick={() => onNavigateToTab('discover')}
              className="text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A]/60 hover:text-[#1A1A1A]"
            >
              View all
            </button>
          </div>

          <div className="space-y-0 relative">
            {/* Timeline Item 1 */}
            <div className="timeline-item timeline-line relative pl-10 pb-5">
              <div className="absolute left-0 top-0 w-8 h-8 bg-[#F5F2ED] border border-[#1A1A1A] flex items-center justify-center z-10 shadow-none">
                <span className="material-symbols-outlined text-[#1A1A1A] text-base">
                  edit_note
                </span>
              </div>
              <div
                onClick={() => onSelectPaper(samplePaper)}
                className="bg-[#FFFFFF] p-4 border border-[#1A1A1A]/15 space-y-1.5 hover:border-[#1A1A1A] cursor-pointer transition-all"
              >
                <div className="flex justify-between items-start">
                  <span className="font-bold text-xs uppercase tracking-wider text-[#1A1A1A]">
                    Prof. Marcus Thorne
                  </span>
                  <span className="text-[10px] uppercase tracking-widest text-[#1A1A1A]/50">2h ago</span>
                </div>
                <p className="text-xs text-[#1A1A1A]/80 leading-relaxed font-hanken">
                  Edited the methodology section in{' '}
                  <span className="text-[#1A1A1A] font-bold">
                    "Neural Arch. Study"
                  </span>
                  .
                </p>
                <div className="mt-2 text-xs text-[#1A1A1A]/70 italic font-serif-4 border-l border-[#1A1A1A] pl-2.5 py-0.5">
                  "Adjusted the learning rate parameters to match the new dataset benchmarks."
                </div>
              </div>
            </div>

            {/* Timeline Item 2 */}
            <div className="timeline-item timeline-line relative pl-10 pb-5">
              <div className="absolute left-0 top-0 w-8 h-8 bg-[#F5F2ED] border border-[#1A1A1A] flex items-center justify-center z-10 shadow-none">
                <span className="material-symbols-outlined text-[#1A1A1A] text-base">
                  upload_file
                </span>
              </div>
              <div className="bg-[#FFFFFF] p-4 border border-[#1A1A1A]/15 space-y-1.5">
                <div className="flex justify-between items-start">
                  <span className="font-bold text-xs uppercase tracking-wider text-[#1A1A1A]">
                    Sarah Li
                  </span>
                  <span className="text-[10px] uppercase tracking-widest text-[#1A1A1A]/50">5h ago</span>
                </div>
                <p className="text-xs text-[#1A1A1A]/80 leading-relaxed">
                  Uploaded new dataset:{' '}
                  <span className="text-[#1A1A1A] font-bold">
                    Core_Samples_V4.csv
                  </span>
                </p>
                <div className="flex gap-2 mt-2">
                  <span className="px-2 py-0.5 bg-[#E5E2DD] border border-[#1A1A1A]/10 text-[9px] font-bold uppercase tracking-wider text-[#1A1A1A]">
                    RAW DATA
                  </span>
                  <span className="px-2 py-0.5 bg-[#E5E2DD] border border-[#1A1A1A]/10 text-[9px] font-bold uppercase tracking-wider text-[#1A1A1A]">
                    14.2 MB
                  </span>
                </div>
              </div>
            </div>

            {/* Timeline Item 3 */}
            <div className="timeline-item timeline-line relative pl-10">
              <div className="absolute left-0 top-0 w-8 h-8 bg-[#F5F2ED] border border-[#1A1A1A] flex items-center justify-center z-10 shadow-none">
                <span className="material-symbols-outlined text-[#1A1A1A] text-base">
                  chat_bubble
                </span>
              </div>
              <div
                onClick={() => onSelectPaper(samplePaper)}
                className="bg-[#FFFFFF] p-4 border border-[#1A1A1A]/15 space-y-1.5 hover:border-[#1A1A1A] cursor-pointer transition-all"
              >
                <div className="flex justify-between items-start">
                  <span className="font-bold text-xs uppercase tracking-wider text-[#1A1A1A]">
                    Prof. Marcus Thorne
                  </span>
                  <span className="text-[10px] uppercase tracking-widest text-[#1A1A1A]/50">Yesterday</span>
                </div>
                <p className="text-xs text-[#1A1A1A]/80 leading-relaxed">
                  Commented on{' '}
                  <span className="text-[#1A1A1A] font-bold">
                    Figure 2.1 - Regression Analysis
                  </span>
                  .
                </p>
                <p className="text-xs text-[#1A1A1A]/80 border-l border-[#1A1A1A] pl-2.5 py-0.5 mt-2 italic font-serif-4">
                  "The variance here seems higher than expected. Should we re-run the simulation with the updated constants?"
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Researcher Profile Identity */}
        <section className="p-6 bg-[#E5E2DD] border border-[#1A1A1A]/20 flex flex-col items-center text-center space-y-3 font-hanken">
          <div className="w-16 h-16 rounded-full overflow-hidden border border-[#1A1A1A]">
            <img className="w-full h-full object-cover" src={user.avatar} alt={user.name} />
          </div>
          <div className="space-y-0.5">
            <h3 className="font-bold text-lg text-[#1A1A1A]">{user.name}</h3>
            <p className="text-xs text-[#1A1A1A]/60 uppercase tracking-wider font-semibold">{user.title}</p>
          </div>
          <div className="flex items-center gap-1.5 px-4 py-1.5 bg-[#1A1A1A] text-[#F5F2ED] rounded-full text-xs font-bold uppercase tracking-widest shadow-sm">
            <span className="material-symbols-filled text-sm">id_card</span>
            <span>Verified ORCID: {user.orcid}</span>
          </div>
        </section>
      </main>
    </div>
  );
};
