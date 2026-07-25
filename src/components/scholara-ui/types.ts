export type TabType = 'discover' | 'my-papers' | 'applied' | 'tracker' | 'profile' | 'discussion';

export interface UserProfile {
  name: string;
  title: string;
  avatar: string;
  orcid: string;
  peerReviewNotice?: string;
  collaborationsCount: number;
  pendingTasksCount: number;
  nextDeadline: {
    date: string;
    title: string;
  };
  activityScorePercent?: number;
  peerReviewsCount?: number;
  scholarRank?: string;
}

export type PaperStatus = 'Idea' | 'Literature' | 'Analysis' | 'In Progress' | 'Overdue' | 'Drafting' | 'Published';

export interface TeamMember {
  name: string;
  avatar: string;
}

export interface Paper {
  id: string;
  title: string;
  authors: string;
  institution?: string;
  journal?: string;
  badge?: string; // 'Peer Reviewed' | 'Open Access' | 'Verified Source' | 'In Progress' | 'Overdue' | 'Drafting'
  badgeType?: 'default' | 'primary' | 'secondary' | 'error' | 'success';
  abstract: string;
  doi?: string;
  url?: string;
  isBookmarked: boolean;
  status: PaperStatus;
  progressLabel?: string;
  progressPercent?: number;
  dueDate?: string;
  delayText?: string;
  team: TeamMember[];
  attachmentCount?: number;
  imagePreview?: string;
  collaborativeNotes?: string[];
  commentsCount: number;
  pdfUrl?: string;
  googleDocsUrl?: string;
  needs?: string[];
  coauthorshipNote?: string;
  studyType?: string;
  fieldOfStudy?: string;
  applicantsCount?: number;
  joinedContributorsCount?: number;
  overallProgressPercent?: number;
}

export interface Applicant {
  id: string;
  name: string;
  title: string;
  avatar?: string;
  isVerified: boolean;
  appliedTimeAgo: string;
  stage: string; // e.g. 'STAGE: DATA ANALYSIS'
  coverQuote: string;
  estCompletion: string;
  field: string;
  status: 'pending' | 'accepted' | 'rejected';
}

export interface ActiveContribution {
  id: string;
  title: string;
  piName: string;
  piAvatar: string;
  deadline: string;
  statusTag: string; // e.g. 'MANUSCRIPT DRAFTING' | 'INITIAL RESEARCH'
  statusAlert?: string; // e.g. 'REVISION REQUESTED' | 'WORK IN PROGRESS'
  statusAlertType?: 'error' | 'warning' | 'info';
  steps: {
    interest: boolean;
    sharedDocs: boolean;
    submission: boolean;
    review: boolean;
  };
}

export interface CollaboratorItem {
  id: string;
  name: string;
  avatar: string;
  field: string;
  collabsCount: number;
  isOnline?: boolean;
}

export interface ResearchRadarItem {
  id: string;
  title: string;
  skillNeeded: string;
}

export interface DiscussionComment {
  id: string;
  paperId: string;
  authorName: string;
  authorRole?: string;
  avatarUrl: string;
  isVerified?: boolean;
  timeAgo: string;
  content: string;
  likes: number;
  isLiked?: boolean;
  parentId?: string; // For nested reply
  isHighlight?: boolean;
}

export interface ActivityItem {
  id: string;
  type: 'edit' | 'upload' | 'comment';
  authorName: string;
  timeAgo: string;
  title: string;
  detailText?: string;
  fileName?: string;
  fileSize?: string;
  isQuote?: boolean;
}

