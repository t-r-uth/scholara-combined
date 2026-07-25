import React, { useState } from 'react';
import { Paper } from '../types';

interface CollaborateModalProps {
  paper: Paper | null;
  onClose: () => void;
  onSubmitSuccess: () => void;
}

export const CollaborateModal: React.FC<CollaborateModalProps> = ({ paper, onClose, onSubmitSuccess }) => {
  const [role, setRole] = useState('Data Analysis & Modeling');
  const [proposal, setProposal] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!paper) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      onSubmitSuccess();
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A1A1A]/70 backdrop-blur-sm p-4 overflow-y-auto font-hanken text-[#1A1A1A]">
      <div className="bg-[#FFFFFF] w-full max-w-md p-6 border border-[#1A1A1A]/20 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#1A1A1A]/15">
          <div>
            <span className="text-[9px] uppercase font-bold tracking-[0.3em] text-[#1A1A1A]/50 block">Collaboration Request</span>
            <h3 className="font-bold text-lg text-[#1A1A1A]">Apply to Collaborate</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-[#1A1A1A]/20 hover:bg-[#1A1A1A] hover:text-[#F5F2ED] text-[#1A1A1A] flex items-center justify-center transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {submitted ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#1A1A1A] text-[#F5F2ED] flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-2xl">check_circle</span>
            </div>
            <h4 className="font-bold text-base uppercase tracking-wider text-[#1A1A1A]">Proposal Submitted!</h4>
            <p className="font-serif-4 italic text-xs text-[#1A1A1A]/80">
              Your collaboration request for <strong>"{paper.title}"</strong> has been sent to the lead authors with your ORCID credentials.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="p-3 bg-[#F5F2ED] border border-[#1A1A1A]/15">
              <span className="text-[9px] font-bold uppercase tracking-widest text-[#1A1A1A]/50 block">Paper Target</span>
              <p className="font-bold text-xs text-[#1A1A1A] line-clamp-1">{paper.title}</p>
              <p className="text-[11px] text-[#1A1A1A]/70 font-serif-4 italic">{paper.authors}</p>
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold tracking-wider text-[#1A1A1A] block mb-1">Your Research Focus / Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full text-xs p-2.5 bg-[#FFFFFF] border border-[#1A1A1A]/20 rounded-none focus:border-[#1A1A1A] outline-none"
              >
                <option value="Data Analysis & Modeling">Data Analysis & Modeling</option>
                <option value="Experimental Validation">Experimental Validation</option>
                <option value="Peer Review & Proofreading">Peer Review & Citation Audit</option>
                <option value="Co-Author & Writing">Co-Author & Writing</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold tracking-wider text-[#1A1A1A] block mb-1">Collaboration Proposal / Notes</label>
              <textarea
                required
                rows={4}
                value={proposal}
                onChange={(e) => setProposal(e.target.value)}
                placeholder="Briefly describe how your research lab or skillset aligns with this paper's objectives..."
                className="w-full text-xs p-3 bg-[#FFFFFF] border border-[#1A1A1A]/20 rounded-none focus:border-[#1A1A1A] outline-none resize-none font-serif-4"
              />
            </div>

            <div className="p-3 bg-[#E5E2DD] border border-[#1A1A1A]/15 flex items-center gap-2 text-[10px] uppercase font-bold tracking-wider text-[#1A1A1A]">
              <span className="material-symbols-outlined text-sm text-[#1A1A1A]">verified</span>
              <span>Your verified ORCID ID (0000-0002-1825-0097) will be attached automatically.</span>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A]/70 hover:bg-[#1A1A1A]/10 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[#1A1A1A] text-[#F5F2ED] text-[10px] font-bold uppercase tracking-widest hover:bg-[#2A2A2A] active:scale-95 transition-all shadow-sm cursor-pointer border border-[#1A1A1A]"
              >
                Send Proposal
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
