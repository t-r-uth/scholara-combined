import React, { useState } from 'react';
import { Paper, PaperStatus } from '../types';

interface NewPaperModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPaper: (paper: Paper) => void;
}

export const NewPaperModal: React.FC<NewPaperModalProps> = ({ isOpen, onClose, onAddPaper }) => {
  const [title, setTitle] = useState('');
  const [authors, setAuthors] = useState('Dr. Helena Vance, et al.');
  const [journal, setJournal] = useState('Nature Communications');
  const [status, setStatus] = useState<PaperStatus>('Drafting');
  const [abstract, setAbstract] = useState('');
  const [googleDocsUrl, setGoogleDocsUrl] = useState('https://docs.google.com/document/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newPaper: Paper = {
      id: `p-${Date.now()}`,
      title: title.trim(),
      authors: authors.trim() || 'Dr. Helena Vance, et al.',
      journal: journal.trim() || 'ScholarHub Archive',
      badge: status,
      badgeType: status === 'Overdue' ? 'error' : status === 'In Progress' ? 'secondary' : 'default',
      abstract: abstract.trim() || 'No abstract provided yet.',
      googleDocsUrl: googleDocsUrl.trim() || 'https://docs.google.com/document/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit',
      isBookmarked: false,
      status: status,
      progressLabel: status === 'In Progress' ? 'Phase 1/4' : undefined,
      progressPercent: status === 'In Progress' ? 25 : undefined,
      team: [
        {
          name: 'Dr. Helena Vance',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300'
        }
      ],
      collaborativeNotes: [
        'Initial literature review setup and hypothesis definition.',
        'Primary trajectory calculations pending dataset integration.'
      ],
      commentsCount: 0
    };

    onAddPaper(newPaper);
    setTitle('');
    setAbstract('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A1A1A]/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-[#FFFFFF] w-full max-w-lg p-6 border border-[#1A1A1A]/20 shadow-2xl animate-in fade-in zoom-in-95 duration-200 font-hanken text-[#1A1A1A]">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#1A1A1A]/15">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#1A1A1A] text-[#F5F2ED] flex items-center justify-center">
              <span className="material-symbols-outlined text-sm">add</span>
            </div>
            <div>
              <span className="text-[9px] uppercase font-bold tracking-[0.3em] text-[#1A1A1A]/50 block">Pipeline Entry</span>
              <h3 className="font-bold text-lg text-[#1A1A1A]">Add New Research Paper</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-[#1A1A1A]/20 hover:bg-[#1A1A1A] hover:text-[#F5F2ED] text-[#1A1A1A] flex items-center justify-center transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-[10px] uppercase tracking-wider text-[#1A1A1A] block mb-1">Paper Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Neural Dynamics of Synaptic Plasticity in Deep Networks"
              className="w-full p-2.5 bg-[#FFFFFF] border border-[#1A1A1A]/20 rounded-none focus:border-[#1A1A1A] outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-[10px] uppercase tracking-wider text-[#1A1A1A] block mb-1">Authors</label>
              <input
                type="text"
                value={authors}
                onChange={(e) => setAuthors(e.target.value)}
                placeholder="Dr. Helena Vance, et al."
                className="w-full p-2.5 bg-[#FFFFFF] border border-[#1A1A1A]/20 rounded-none focus:border-[#1A1A1A] outline-none"
              />
            </div>
            <div>
              <label className="font-bold text-[10px] uppercase tracking-wider text-[#1A1A1A] block mb-1">Target Journal / Outlet</label>
              <input
                type="text"
                value={journal}
                onChange={(e) => setJournal(e.target.value)}
                placeholder="Nature Communications"
                className="w-full p-2.5 bg-[#FFFFFF] border border-[#1A1A1A]/20 rounded-none focus:border-[#1A1A1A] outline-none"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-[10px] uppercase tracking-wider text-[#1A1A1A] block mb-1">
              Google Drive / Docs Share Link *
            </label>
            <div className="flex items-center border border-[#1A1A1A]/20 bg-[#FFFFFF]">
              <span className="material-symbols-outlined text-base px-2.5 text-[#233242]">link</span>
              <input
                type="url"
                required
                value={googleDocsUrl}
                onChange={(e) => setGoogleDocsUrl(e.target.value)}
                placeholder="https://docs.google.com/document/d/..."
                className="w-full p-2.5 text-xs focus:outline-none"
              />
            </div>
            <p className="text-[10px] text-[#64748B] mt-1 flex items-center gap-1">
              <span className="material-symbols-filled text-xs text-[#8CC63F]">verified_user</span>
              <span><strong>Zero Local Storage:</strong> Manuscript files remain secured on Google Drive.</span>
            </p>
          </div>

          <div>
            <label className="font-bold text-[10px] uppercase tracking-wider text-[#1A1A1A] block mb-1">Pipeline Phase / Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as PaperStatus)}
              className="w-full p-2.5 bg-[#FFFFFF] border border-[#1A1A1A]/20 rounded-none focus:border-[#1A1A1A] outline-none"
            >
              <option value="Idea">Ideation & Planning</option>
              <option value="Literature">Literature Review</option>
              <option value="Analysis">Analysis Phase</option>
              <option value="In Progress">In Progress</option>
              <option value="Drafting">Drafting</option>
            </select>
          </div>

          <div>
            <label className="font-bold text-[10px] uppercase tracking-wider text-[#1A1A1A] block mb-1">Abstract Summary</label>
            <textarea
              rows={3}
              value={abstract}
              onChange={(e) => setAbstract(e.target.value)}
              placeholder="Brief summary of research methodology and objectives..."
              className="w-full p-2.5 bg-[#FFFFFF] border border-[#1A1A1A]/20 rounded-none focus:border-[#1A1A1A] outline-none resize-none font-serif-4"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-[#1A1A1A]/15">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-bold text-[10px] uppercase tracking-widest text-[#1A1A1A]/70 hover:bg-[#1A1A1A]/10 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#1A1A1A] text-[#F5F2ED] font-bold text-[10px] uppercase tracking-widest hover:bg-[#2A2A2A] active:scale-95 transition-all shadow-sm cursor-pointer border border-[#1A1A1A]"
            >
              Add to Tracker
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
