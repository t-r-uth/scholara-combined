import React, { useState } from 'react';
import { Paper } from '../types';

interface PdfViewerModalProps {
  paper: Paper | null;
  onClose: () => void;
  onOpenDiscussion?: (paper: Paper) => void;
}

export const PdfViewerModal: React.FC<PdfViewerModalProps> = ({ paper, onClose, onOpenDiscussion }) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'abstract' | 'fulltext' | 'citations'>('abstract');

  if (!paper) return null;

  const handleCopyCitation = () => {
    const citation = `${paper.authors}. "${paper.title}." ${paper.journal || 'ScholarHub Archive'}, 2024. DOI: ${paper.doi || '10.1038/scholarhub'}`;
    navigator.clipboard.writeText(citation);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A1A1A]/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-[#FFFFFF] w-full max-w-2xl max-h-[90vh] flex flex-col border border-[#1A1A1A]/20 overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-[#233242] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="material-symbols-filled text-[#8CC63F] text-xl">folder_shared</span>
            <div>
              <span className="text-[9px] uppercase font-bold tracking-[0.25em] text-[#CBD5E1]">Google Workspace Shared Link</span>
              <h3 className="font-bold text-base leading-tight line-clamp-1">{paper.title}</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Security Policy Alert */}
        <div className="bg-[#F8FAFC] border-b border-[#E2E8F0] px-6 py-3 flex items-center gap-2.5 text-xs text-[#334155]">
          <span className="material-symbols-filled text-[#8CC63F] text-base shrink-0">verified_user</span>
          <p className="leading-snug">
            <strong>Security Protocol:</strong> Raw manuscript files are not hosted locally on platform servers. Full content is securely accessed via Google Docs link sharing.
          </p>
        </div>

        {/* Action bar / tabs */}
        <div className="flex flex-wrap items-center justify-between border-b border-[#1A1A1A]/15 px-6 py-2.5 bg-[#F5F2ED]">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('abstract')}
              className={`px-3 py-1.5 text-[10px] uppercase font-bold tracking-widest font-hanken transition-colors cursor-pointer ${
                activeTab === 'abstract' ? 'bg-[#1A1A1A] text-[#F5F2ED]' : 'text-[#1A1A1A]/70 border border-[#1A1A1A]/20 hover:border-[#1A1A1A]'
              }`}
            >
              Overview & Abstract
            </button>
            <button
              onClick={() => setActiveTab('fulltext')}
              className={`px-3 py-1.5 text-[10px] uppercase font-bold tracking-widest font-hanken transition-colors cursor-pointer ${
                activeTab === 'fulltext' ? 'bg-[#1A1A1A] text-[#F5F2ED]' : 'text-[#1A1A1A]/70 border border-[#1A1A1A]/20 hover:border-[#1A1A1A]'
              }`}
            >
              Full Text Preview
            </button>
            <button
              onClick={() => setActiveTab('citations')}
              className={`px-3 py-1.5 text-[10px] uppercase font-bold tracking-widest font-hanken transition-colors cursor-pointer ${
                activeTab === 'citations' ? 'bg-[#1A1A1A] text-[#F5F2ED]' : 'text-[#1A1A1A]/70 border border-[#1A1A1A]/20 hover:border-[#1A1A1A]'
              }`}
            >
              Citation & DOI
            </button>
          </div>
          <button
            onClick={handleCopyCitation}
            className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider text-[#1A1A1A] bg-[#FFFFFF] border border-[#1A1A1A]/30 hover:bg-[#1A1A1A] hover:text-[#F5F2ED] px-3 py-1.5 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">{copied ? 'check' : 'content_copy'}</span>
            {copied ? 'Copied!' : 'Copy Citation'}
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 font-serif-4 text-[#1A1A1A] leading-relaxed space-y-6">
          {paper.imagePreview && (
            <div className="overflow-hidden border border-[#1A1A1A]/15 max-h-56 relative bg-[#E5E2DD]">
              <img src={paper.imagePreview} alt={paper.title} className="w-full h-full object-cover" />
              <span className="absolute bottom-2 right-2 bg-[#1A1A1A] text-[#F5F2ED] text-[9px] uppercase font-bold tracking-widest px-2.5 py-1">
                Fig 1. Structural Diagram
              </span>
            </div>
          )}

          {activeTab === 'abstract' && (
            <>
              <div>
                <span className="font-hanken text-[10px] font-bold uppercase tracking-[0.25em] text-[#1A1A1A]/60 block mb-1">
                  Authors & Institution
                </span>
                <p className="font-hanken font-bold text-sm text-[#1A1A1A]">{paper.authors}</p>
                {paper.journal && (
                  <p className="font-hanken text-xs italic text-[#1A1A1A]/70 mt-0.5">{paper.journal}</p>
                )}
              </div>

              <div>
                <span className="font-hanken text-[10px] font-bold uppercase tracking-[0.25em] text-[#1A1A1A]/60 block mb-2">
                  Abstract
                </span>
                <div className="p-4 bg-[#F5F2ED] border border-[#1A1A1A]/15 italic text-xs leading-relaxed">
                  {paper.abstract}
                </div>
              </div>

              <div>
                <span className="font-hanken text-[10px] font-bold uppercase tracking-[0.25em] text-[#1A1A1A]/60 block mb-2">
                  Keywords & Domain
                </span>
                <div className="flex flex-wrap gap-2 font-hanken text-[10px] uppercase tracking-wider font-bold">
                  <span className="px-3 py-1 bg-[#E5E2DD] text-[#1A1A1A] border border-[#1A1A1A]/10">
                    Molecular Dynamics
                  </span>
                  <span className="px-3 py-1 bg-[#E5E2DD] text-[#1A1A1A] border border-[#1A1A1A]/10">
                    AlphaFold 2
                  </span>
                  <span className="px-3 py-1 bg-[#E5E2DD] text-[#1A1A1A] border border-[#1A1A1A]/10">
                    Hydration Energy
                  </span>
                </div>
              </div>
            </>
          )}

          {activeTab === 'fulltext' && (
            <div className="space-y-4 text-xs font-serif-4">
              <h4 className="font-hanken font-bold text-sm text-[#1A1A1A] uppercase tracking-wider">1. Introduction</h4>
              <p>
                Recent computational advances in machine-learning-driven protein structure prediction have yielded atomic models with unprecedented global fidelity. However, equilibrium fluctuations and local solvation dynamics remain critical factors in functional domain binding.
              </p>
              <h4 className="font-hanken font-bold text-sm text-[#1A1A1A] uppercase tracking-wider">2. Simulation Parameters</h4>
              <p>
                100 nanosecond molecular dynamics simulations were conducted utilizing explicit solvent environments with CHARMM36m force fields. Thermostat and barostat controls were calibrated at 310K and 1 atm pressure.
              </p>
              <div className="p-4 bg-[#E5E2DD] border border-[#1A1A1A]/20 text-xs text-[#1A1A1A] font-hanken">
                💡 <strong>Verified Dataset Attached:</strong> Trajectory files (.pdb format) are synchronized with ScholarHub discussion threads.
              </div>
            </div>
          )}

          {activeTab === 'citations' && (
            <div className="space-y-4 font-hanken">
              <div>
                <label className="text-[10px] font-bold text-[#1A1A1A]/60 uppercase tracking-[0.25em] block mb-1">
                  DOI Link
                </label>
                <div className="flex items-center gap-2 p-3 bg-[#F5F2ED] border border-[#1A1A1A]/15">
                  <span className="material-symbols-outlined text-sm text-[#1A1A1A]/60">link</span>
                  <a
                    href={paper.url || '#'}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-[#1A1A1A] underline font-bold truncate"
                  >
                    https://doi.org/{paper.doi || '10.1038/s41586-023-06281-w'}
                  </a>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-[#1A1A1A]/60 uppercase tracking-[0.25em] block mb-1">
                  BibTeX Format
                </label>
                <textarea
                  readOnly
                  rows={4}
                  className="w-full font-mono text-xs p-3 bg-[#1A1A1A] text-[#F5F2ED] focus:outline-none"
                  value={`@article{${paper.id},\n  title={${paper.title}},\n  author={${paper.authors}},\n  journal={${paper.journal || 'ScholarHub Archive'}},\n  year={2024},\n  doi={${paper.doi || '10.1038/s41586-023-06281-w'}}\n}`}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between">
          {onOpenDiscussion && (
            <button
              onClick={() => {
                onClose();
                onOpenDiscussion(paper);
              }}
              className="flex items-center gap-1.5 text-xs font-bold text-[#233242] hover:underline transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">forum</span>
              Open Discussion Thread ({paper.commentsCount})
            </button>
          )}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#64748B] hover:bg-[#E2E8F0] transition-colors cursor-pointer"
            >
              Close
            </button>
            <a
              href={paper.googleDocsUrl || paper.url || 'https://docs.google.com'}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 bg-[#233242] hover:bg-[#1A2633] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-xs flex items-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-filled text-sm text-[#8CC63F]">open_in_new</span>
              Open Google Doc Link
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
