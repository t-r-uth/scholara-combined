import { UserProfile, Paper, DiscussionComment, ActivityItem, Applicant, ActiveContribution, CollaboratorItem, ResearchRadarItem } from '../types';

export const currentUser: UserProfile = {
  name: "Dr. Aris Thorne",
  title: "Lead Computational Neuroscientist",
  avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300",
  orcid: "0000-0002-1825-0097",
  peerReviewNotice: 'Your latest peer review for "Quantum Lattice Dynamics" is now live.',
  collaborationsCount: 3,
  pendingTasksCount: 12,
  nextDeadline: {
    date: "Oct 24",
    title: "Grant Proposal & Peer Review Final Sync"
  },
  activityScorePercent: 94,
  peerReviewsCount: 21,
  scholarRank: "Silver II"
};

export const initialPapers: Paper[] = [
  {
    id: "p-bias-analysis",
    title: "Longitudinal Bias Analysis in Large Language Model Reinforcement",
    authors: "Dr. Aris Thorne",
    institution: "Stanford University",
    fieldOfStudy: "AI & ETHICS",
    studyType: "Quantitative Study",
    abstract: "This research investigates the decay of alignment in LLMs over extended interaction windows. We are currently seeking collaborators with strong experience in statistical evaluation and adversarial prompt design...",
    needs: ["Data Analysis", "Peer Review"],
    coauthorshipNote: "Co-authorship for substantial work",
    badge: "Verified Source",
    isBookmarked: true,
    status: "Analysis",
    team: [
      {
        name: "Dr. Aris Thorne",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300"
      }
    ],
    commentsCount: 8,
    googleDocsUrl: "https://docs.google.com/document/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit",
    overallProgressPercent: 72,
    applicantsCount: 4,
    joinedContributorsCount: 12
  },
  {
    id: "p-post-viral",
    title: "Patient Experience in Post-Viral Neurological Rehabilitation",
    authors: "Prof. Elena Rossi",
    institution: "Oxford Medical",
    fieldOfStudy: "CLINICAL MEDICINE",
    studyType: "Qualitative Study",
    abstract: "Examining the psychological hurdles of long-term recovery. We have completed primary interviews and require a lead writer for the manuscript drafting phase...",
    needs: ["Manuscript Writing", "Translation"],
    coauthorshipNote: "2nd Author positioning offered",
    badge: "Peer Reviewed",
    isBookmarked: false,
    status: "Drafting",
    team: [
      {
        name: "Prof. Elena Rossi",
        avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=300"
      }
    ],
    commentsCount: 14,
    googleDocsUrl: "https://docs.google.com/document/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit",
    overallProgressPercent: 58,
    applicantsCount: 2,
    joinedContributorsCount: 8
  },
  {
    id: "p-decentralized-gov",
    title: "Decentralized Governance Impact on Emerging Market Stability",
    authors: "Dr. Samuel Chen",
    institution: "LSE Research",
    fieldOfStudy: "ECONOMICS",
    studyType: "Quantitative Study",
    abstract: "A comparative study across Southeast Asia. We need a collaborator to assist with complex econometric modeling and data scraping from regional public ledgers...",
    needs: ["Data Scraping", "Econometrics"],
    coauthorshipNote: "Co-authorship based on contribution",
    badge: "Open Access",
    isBookmarked: true,
    status: "Literature",
    team: [
      {
        name: "Dr. Samuel Chen",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300"
      }
    ],
    commentsCount: 5,
    googleDocsUrl: "https://docs.google.com/document/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit",
    overallProgressPercent: 35,
    applicantsCount: 6,
    joinedContributorsCount: 5
  },
  {
    id: "p-quantum-entanglement",
    title: "Quantum Entanglement in Biological Systems: A Meta-Analysis",
    authors: "Dr. Elara Vance",
    institution: "MIT BioLab",
    fieldOfStudy: "QUANTUM BIOLOGY",
    studyType: "Meta-Analysis",
    abstract: "A systematic review of decoherence resistance mechanisms in avian magnetoreception and light-harvesting protein complexes.",
    needs: ["Data Analysis", "Peer Review"],
    coauthorshipNote: "Lead Author co-sign",
    badge: "RECRUITING ACTIVE",
    doi: "10.1038/s41586-024-08921-x",
    isBookmarked: true,
    status: "In Progress",
    team: [
      {
        name: "Dr. Elara Vance",
        avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=300"
      }
    ],
    commentsCount: 18,
    googleDocsUrl: "https://docs.google.com/document/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit",
    overallProgressPercent: 68,
    applicantsCount: 4,
    joinedContributorsCount: 12
  },
  {
    id: "p-neural-plasticity",
    title: "Neural Plasticity in Urban Environments: A Longitudinal Meta-Analysis",
    authors: "Prof. Elena Rostova",
    institution: "Berlin Brain Center",
    fieldOfStudy: "NEUROSCIENCE",
    studyType: "Longitudinal Study",
    abstract: "Assessing structural brain adaptations in dense urban populations over a 5-year spatial navigation study.",
    needs: ["fMRI Analysis", "Statistical Modeling"],
    coauthorshipNote: "Co-author positioning",
    badge: "Peer Reviewed",
    isBookmarked: true,
    status: "Analysis",
    team: [
      {
        name: "Prof. Elena Rostova",
        avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=300"
      }
    ],
    commentsCount: 22,
    googleDocsUrl: "https://docs.google.com/document/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit",
    overallProgressPercent: 80,
    applicantsCount: 1,
    joinedContributorsCount: 9
  }
];

export const initialApplicants: Applicant[] = [
  {
    id: "app-1",
    name: "Dr. Julian Thorne",
    title: "Theoretical Physics & Computational Biology",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=300",
    isVerified: true,
    appliedTimeAgo: "Applied 2h ago",
    stage: "STAGE: DATA ANALYSIS",
    coverQuote: '"Having spent 8 years at CERN focusing on quantum decoherence, I believe my methodology for noise-reduction in biological datasets is precisely what this meta-analysis needs to achieve significant confidence intervals."',
    estCompletion: "14 Days",
    field: "Quantum Biology",
    status: "pending"
  },
  {
    id: "app-2",
    name: "Sarah Jenkins",
    title: "Post-doc Fellow, MIT",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=300",
    isVerified: true,
    appliedTimeAgo: "Applied 5h ago",
    stage: "STAGE: PEER REVIEW",
    coverQuote: '"I can provide a rigorous review of the mathematical framework used in Chapter 4. My previous publications in Nature focus on similar cross-disciplinary anomalies."',
    estCompletion: "7 Days",
    field: "Mathematical Physics",
    status: "pending"
  },
  {
    id: "app-3",
    name: "Dr. Marcus Vane",
    title: "Data Ethics Researcher, Oxford",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=300",
    isVerified: true,
    appliedTimeAgo: "Applied 1d ago",
    stage: "STAGE: LITERATURE REVIEW",
    coverQuote: '"Reviewed over 140 papers on quantum coherence. Ready to assist with citation auditing and bias mitigation."',
    estCompletion: "10 Days",
    field: "Data Ethics",
    status: "pending"
  }
];

export const initialActiveContributions: ActiveContribution[] = [
  {
    id: "contrib-1",
    title: "Neural Plasticity in Urban Environments: A Longitudinal Meta-Analysis",
    piName: "Prof. Elena Rostova",
    piAvatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=300",
    deadline: "Oct 28, 2023",
    statusTag: "MANUSCRIPT DRAFTING",
    statusAlert: "REVISION REQUESTED",
    statusAlertType: "error",
    steps: {
      interest: true,
      sharedDocs: true,
      submission: true,
      review: false
    }
  },
  {
    id: "contrib-2",
    title: "Sustainable Concrete: Volcanic Ash as a Partial Cement Replacement",
    piName: "Dr. Marcus Vane",
    piAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=300",
    deadline: "Nov 12, 2023",
    statusTag: "INITIAL RESEARCH",
    statusAlert: "WORK IN PROGRESS",
    statusAlertType: "info",
    steps: {
      interest: true,
      sharedDocs: false,
      submission: false,
      review: false
    }
  }
];

export const topCollaborators: CollaboratorItem[] = [
  {
    id: "collab-1",
    name: "Dr. Sarah Jenkins",
    field: "Biochemistry",
    collabsCount: 14,
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=300",
    isOnline: true
  },
  {
    id: "collab-2",
    name: "Dr. Marcus Vane",
    field: "Data Ethics",
    collabsCount: 9,
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=300",
    isOnline: true
  },
  {
    id: "collab-3",
    name: "Prof. Li Na",
    field: "Quant Analysis",
    collabsCount: 22,
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=300",
    isOnline: true
  }
];

export const researchRadarItems: ResearchRadarItem[] = [
  {
    id: "radar-1",
    title: "Hyper-parameter Optimization in RL",
    skillNeeded: "Needed: Optimization"
  },
  {
    id: "radar-2",
    title: "Sparse Attention Mechanisms",
    skillNeeded: "Needed: Math Proofing"
  }
];

export const initialComments: DiscussionComment[] = [
  {
    id: "c-1",
    paperId: "p-bias-analysis",
    authorName: "Sarah Jenkins",
    avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=300",
    timeAgo: "2h ago",
    content: "Did anyone else notice the discrepancy in Figure 3.4? Julian, your notes on the alignment decay seem to align with what I'm seeing in the supplementary data.",
    likes: 4,
    isLiked: false
  },
  {
    id: "c-2",
    paperId: "p-bias-analysis",
    parentId: "c-1",
    authorName: "Dr. Julian Thorne",
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=300",
    timeAgo: "45m ago",
    content: "Good catch Sarah. I'm uploading the raw .pdb trajectory files now. If we look at the interaction window specifically, the discrepancy disappears.",
    likes: 2,
    isLiked: false
  },
  {
    id: "c-3",
    paperId: "p-bias-analysis",
    authorName: "Dr. Marcus Vane",
    avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=300",
    isVerified: true,
    timeAgo: "1h ago",
    content: "The methodology used here sets a new baseline for predictive protein chemistry. Excellent summary in the notes.",
    likes: 5,
    isLiked: false
  }
];

export const initialActivities: ActivityItem[] = [
  {
    id: "act-1",
    type: "edit",
    authorName: "Prof. Elena Rostova",
    timeAgo: "2 hours ago",
    title: "Requested revision on \"Methodology section\" of the Neural Plasticity paper.",
    detailText: '"Please re-verify the baseline sample sizes in Table 2."',
    isQuote: true
  },
  {
    id: "act-2",
    type: "upload",
    authorName: "ScholarHub System",
    timeAgo: "Yesterday",
    title: "Contribution Verified",
    detailText: 'Your contribution to "Volcanic Ash" paper was accepted by the PI.'
  },
  {
    id: "act-3",
    type: "comment",
    authorName: "Google Workspace",
    timeAgo: "3 days ago",
    title: "New Access",
    detailText: "You were granted edit access to the shared Google Drive folder."
  }
];
