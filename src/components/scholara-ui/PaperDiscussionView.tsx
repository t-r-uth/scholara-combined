import React, { useState } from 'react';
import { Paper, DiscussionComment } from '../types';

interface PaperDiscussionViewProps {
  paper: Paper;
  comments: DiscussionComment[];
  onBack: () => void;
  onAddComment: (paperId: string, content: string, parentId?: string) => void;
  onToggleLike: (commentId: string) => void;
  onUpdateNotes?: (paperId: string, notes: string[]) => void;
}

export const PaperDiscussionView: React.FC<PaperDiscussionViewProps> = ({
  paper,
  comments,
  onBack,
  onAddComment,
  onToggleLike,
  onUpdateNotes,
}) => {
  const [newCommentText, setNewCommentText] = useState('');
  const [replyingToId, setReplyingToId] = useState<string | undefined>(undefined);
  const [replyingToAuthor, setReplyingToAuthor] = useState<string>('');
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesList, setNotesList] = useState<string[]>(
    paper.collaborativeNotes || [
      'Significant variance observed in alignment decay over long sequence windows.',
      'Water molecule interactions at the binding site appear more dynamic in 100ns simulation.',
      'Potential for refining predictions by incorporating adversarial prompt benchmarks.',
    ]
  );
  const [newNoteInput, setNewNoteInput] = useState('');
  const [attachedFile, setAttachedFile] = useState<string | null>(null);

  const paperComments = comments.filter((c) => c.paperId === paper.id);

  const handleSendComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() && !attachedFile) return;

    let finalContent = newCommentText.trim();
    if (attachedFile) {
      finalContent += ` [Attached file: ${attachedFile}]`;
    }

    onAddComment(paper.id, finalContent, replyingToId);
    setNewCommentText('');
    setReplyingToId(undefined);
    setReplyingToAuthor('');
    setAttachedFile(null);
  };

  const handleAddNote = () => {
    if (!newNoteInput.trim()) return;
    const updated = [...notesList, newNoteInput.trim()];
    setNotesList(updated);
    setNewNoteInput('');
    if (onUpdateNotes) {
      onUpdateNotes(paper.id, updated);
    }
  };

  const handleRemoveNote = (index: number) => {
    const updated = notesList.filter((_, i) => i !== index);
    setNotesList(updated);
    if (onUpdateNotes) {
      onUpdateNotes(paper.id, updated);
    }
  };

  const handleFileAttachClick = () => {
    const fakeFiles = ['trajectory_sim_100ns.pdb', 'figure_3_4_hydration_plot.png', 'supplementary_raw_data.csv'];
    const chosen = fakeFiles[Math.floor(Math.random() * fakeFiles.length)];
    setAttachedFile(chosen);
  };

  return (
    <div className="pb-36 max-w-4xl mx-auto w-full font-sans text-[#0F172A] px-4 lg:px-8 py-6">
      {/* Top Header */}
      <header className="flex justify-between items-center pb-4 mb-6 border-b border-[#E2E8F0]">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-9 h-9 flex items-center justify-center border border-[#CBD5E1] hover:bg-[#F1F5F9] text-[#1E293B] transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">arrow_back</span>
          </button>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#64748B] block">
              DISCUSSION THREAD
            </span>
            <h1 className="font-extrabold text-lg text-[#0F172A] leading-tight">
              {paper.title}
            </h1>
          </div>
        </div>
        <button
          onClick={() => alert(`Options for "${paper.title}": Export Citations, Download Trajectory, Copy DOI Link.`)}
          className="w-9 h-9 flex items-center justify-center border border-[#CBD5E1] hover:bg-[#F1F5F9] text-[#1E293B] transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-lg">more_vert</span>
        </button>
      </header>

      <main className="space-y-6">
        {/* Paper Link Preview Card */}
        <section>
          <div className="bg-[#FFFFFF] border border-[#E2E8F0] p-6 shadow-xs space-y-3">
            <div className="flex justify-between items-center">
              <span className="px-2.5 py-0.5 bg-[#F1F5F9] border border-[#E2E8F0] text-[10px] font-bold uppercase tracking-wider text-[#1E293B]">
                {paper.fieldOfStudy || 'GENERAL RESEARCH'}
              </span>
              <span className="text-xs text-[#64748B] font-medium">{paper.authors}</span>
            </div>
            <h2 className="font-bold text-lg text-[#0F172A]">
              {paper.title}
            </h2>
            <p className="text-xs text-[#475569] leading-relaxed">
              {paper.abstract}
            </p>
          </div>
        </section>

        {/* Collaborative Notes */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#0F172A]">
              Collaborative Research Notes
            </h3>
            <button
              onClick={() => setIsEditingNotes(!isEditingNotes)}
              className="text-[#233242] font-bold text-xs uppercase tracking-wider flex items-center gap-1 hover:underline cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">
                {isEditingNotes ? 'check' : 'edit'}
              </span>
              {isEditingNotes ? 'Done' : 'Edit'}
            </button>
          </div>

          <div className="bg-[#FFFFFF] p-5 border border-[#E2E8F0] shadow-xs">
            <ul className="space-y-2.5 text-xs text-[#334155] font-serif italic">
              {notesList.map((note, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <span className="text-[#233242] font-bold mt-0.5">•</span>
                  <span className="flex-1 leading-relaxed">{note}</span>
                  {isEditingNotes && (
                    <button
                      onClick={() => handleRemoveNote(idx)}
                      className="text-[#E11D48] hover:bg-[#FEE2E2] p-1 transition-colors"
                      title="Delete note"
                    >
                      <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                  )}
                </li>
              ))}
            </ul>

            {isEditingNotes && (
              <div className="mt-4 pt-3 border-t border-[#E2E8F0] flex gap-2">
                <input
                  type="text"
                  value={newNoteInput}
                  onChange={(e) => setNewNoteInput(e.target.value)}
                  placeholder="Add a new collaborative note point..."
                  onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                  className="flex-1 text-xs p-2.5 bg-[#F8FAFC] border border-[#CBD5E1] focus:outline-none focus:border-[#233242]"
                />
                <button
                  onClick={handleAddNote}
                  className="px-4 py-2 bg-[#233242] text-white text-xs uppercase font-bold tracking-wider hover:bg-[#1A2633]"
                >
                  Add
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Discussion Thread */}
        <section>
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#0F172A] mb-4">
            Peer Comments ({paperComments.length})
          </h3>

          <div className="space-y-4">
            {paperComments.map((comment) => {
              const isReply = !!comment.parentId;
              return (
                <div
                  key={comment.id}
                  className={`flex gap-3 p-4 bg-[#FFFFFF] border border-[#E2E8F0] shadow-xs ${
                    isReply ? 'ml-6 bg-[#F8FAFC]' : ''
                  }`}
                >
                  <img
                    src={comment.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300'}
                    alt={comment.authorName}
                    className="w-9 h-9 rounded-full object-cover border border-[#CBD5E1] shrink-0"
                  />

                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-[#0F172A]">
                        {comment.authorName}
                      </span>
                      {comment.isVerified && (
                        <span className="material-symbols-filled text-[#8CC63F] text-sm" title="Verified Scholar">
                          verified
                        </span>
                      )}
                      <span className="text-[10px] text-[#64748B]">
                        {comment.timeAgo}
                      </span>
                    </div>

                    <p className="text-xs text-[#334155] leading-relaxed">
                      {comment.content}
                    </p>

                    <div className="flex items-center gap-4 pt-2 text-[11px] font-bold text-[#64748B]">
                      <button
                        onClick={() => onToggleLike(comment.id)}
                        className={`flex items-center gap-1 hover:text-[#0F172A] cursor-pointer ${
                          comment.isLiked ? 'text-[#8CC63F]' : ''
                        }`}
                      >
                        <span className={`material-symbols-outlined text-sm ${comment.isLiked ? 'material-symbols-filled text-[#8CC63F]' : ''}`}>
                          thumb_up
                        </span>
                        <span>{comment.likes}</span>
                      </button>
                      <button
                        onClick={() => {
                          setReplyingToId(comment.id);
                          setReplyingToAuthor(comment.authorName);
                          document.getElementById('discussion-textarea')?.focus();
                        }}
                        className="flex items-center gap-1 hover:text-[#0F172A] cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-sm">reply</span>
                        <span>Reply</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {/* Bottom Input Form */}
      <div className="fixed bottom-0 left-0 w-full z-50 bg-[#FFFFFF]/95 backdrop-blur-md px-4 pb-6 pt-3 border-t border-[#E2E8F0] shadow-lg">
        <form onSubmit={handleSendComment} className="max-w-4xl mx-auto space-y-2">
          {replyingToAuthor && (
            <div className="flex items-center justify-between text-xs bg-[#F1F5F9] px-3 py-1 text-[#0F172A] border border-[#CBD5E1]">
              <span>Replying to <strong>{replyingToAuthor}</strong></span>
              <button
                type="button"
                onClick={() => {
                  setReplyingToId(undefined);
                  setReplyingToAuthor('');
                }}
                className="text-[#0F172A] font-bold text-xs uppercase hover:underline"
              >
                Cancel
              </button>
            </div>
          )}

          {attachedFile && (
            <div className="flex items-center justify-between text-xs bg-[#F1F5F9] px-3 py-1 text-[#0F172A] border border-[#CBD5E1]">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">attachment</span>
                {attachedFile}
              </span>
              <button
                type="button"
                onClick={() => setAttachedFile(null)}
                className="text-[#0F172A] font-bold text-xs uppercase hover:underline"
              >
                Remove
              </button>
            </div>
          )}

          <div className="flex items-end gap-2.5">
            <button
              type="button"
              onClick={handleFileAttachClick}
              title="Attach raw dataset file or plot"
              className="w-10 h-10 shrink-0 flex items-center justify-center bg-[#F1F5F9] border border-[#CBD5E1] text-[#1E293B] hover:bg-[#233242] hover:text-white transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg">attach_file</span>
            </button>
            <div className="flex-1">
              <textarea
                id="discussion-textarea"
                rows={1}
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendComment(e);
                  }
                }}
                placeholder={replyingToAuthor ? `Reply to ${replyingToAuthor}...` : "Share peer review thoughts..."}
                className="w-full bg-[#FFFFFF] border border-[#CBD5E1] px-4 py-2.5 text-xs text-[#0F172A] focus:outline-none focus:border-[#233242] resize-none"
              />
            </div>
            <button
              type="submit"
              className="w-10 h-10 shrink-0 flex items-center justify-center bg-[#233242] text-white hover:bg-[#1A2633] transition-all shadow-sm cursor-pointer"
            >
              <span className="material-symbols-filled text-lg">send</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

