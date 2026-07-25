export const SCOPE_LABELS: Record<string, string> = {
  global: 'Global',
  regional: 'Regional',
  country: 'Country-level',
}

export const SCOPE_DETAIL_LABELS: Record<string, string> = {
  global: 'Global scope',
  regional: 'Regional scope',
  country: 'Country-level',
}

export const ACCESS_LABELS: Record<string, string> = {
  open: 'Open to all',
  institution: 'By institution',
  invite: 'Invite only',
}

// ─── Study types ──────────────────────────────────────────────────────────────

export const STUDY_TYPE_LABELS: Record<string, string> = {
  quantitative: 'Quantitative',
  qualitative: 'Qualitative',
  mixed_methods: 'Mixed methods',
  policy: 'Policy paper',
  systematic_review: 'Systematic review / meta-analysis',
  modelling: 'Modelling study',
  lab_based: 'Lab-based study',
  software_computational: 'Software / computational',
}

// ─── Contribution type labels ─────────────────────────────────────────────────

export const CONTRIBUTION_LABELS: Record<string, string> = {
  // Shared across types
  statistical_data_analysis: 'Statistical data analysis',
  data_visualization: 'Data visualisation',
  writing: 'Writing',
  citing_referencing: 'Citing and referencing',
  dataset_contribution: 'Dataset contribution',

  // Quantitative
  statistical_analysis_plan: 'Statistical analysis plan',
  sample_size_calculation: 'Sample size calculation',
  data_cleaning: 'Data cleaning and coding',
  figure_table_preparation: 'Figure and table preparation',
  ethics_application_writing: 'Ethics application',

  // Qualitative
  interview_guide_development: 'Interview guide',
  transcription: 'Transcription',
  thematic_content_analysis: 'Thematic / content analysis',
  framework_development: 'Framework development',

  // Mixed methods
  integration_qual_quant: 'Integration of qual and quant findings',

  // Policy
  policy_landscape_review: 'Policy landscape review',
  stakeholder_mapping: 'Stakeholder mapping',
  evidence_synthesis: 'Evidence synthesis',
  country_specific_adaptation: 'Country adaptation',
  grey_literature_search: 'Grey literature search',

  // Systematic review
  search_strategy_development: 'Search strategy',
  title_abstract_screening: 'Title/abstract screening',
  full_text_screening: 'Full-text screening',
  data_extraction: 'Data extraction',
  risk_of_bias_assessment: 'Risk of bias',
  meta_analysis_synthesis: 'Meta-analysis / synthesis',
  prisma_reporting: 'PRISMA reporting',

  // Modelling
  model_structure_design: 'Model structure',
  parameter_identification: 'Parameter identification and data sourcing',
  uncertainty_analysis: 'Uncertainty analysis',
  sensitivity_analysis: 'Sensitivity analysis',
  cheers_reporting: 'CHEERS / reporting checklist',

  // Lab-based
  experimental_design_protocol: 'Experimental design',
  sample_preparation_processing: 'Sample preparation',
  assay_development_optimisation: 'Assay development',
  data_collection_recording: 'Data collection',
  ethics_biosafety_documentation: 'Ethics and biosafety',

  // Software / computational
  codebase_review_debugging: 'Code review',
  algorithm_design: 'Algorithm design',
  data_pipeline_development: 'Data pipeline',
  model_training_validation: 'Model training',
  reproducibility_documentation: 'Reproducibility and documentation',
  results_visualisation: 'Results visualisation',
}

// Backward-compatible alias used in older server actions + email templates
export const STAGE_LABELS: Record<string, string> = {
  ...CONTRIBUTION_LABELS,
  // Legacy keys (papers created before taxonomy update)
  references: 'References',
  data_analysis: 'Data Analysis',
  review: 'Peer Review',
  has_data: 'Dataset contribution',
  // Legacy label variants
  statistical_analysis: 'Statistical analysis',
  thematic_analysis: 'Thematic analysis',
  meta_analysis: 'Meta-analysis',
}

// ─── Contribution types grouped by study type ─────────────────────────────────

export const CONTRIBUTIONS_BY_STUDY_TYPE: Record<string, string[]> = {
  quantitative: [
    'statistical_analysis_plan',
    'sample_size_calculation',
    'data_cleaning',
    'statistical_data_analysis',
    'figure_table_preparation',
    'writing',
    'citing_referencing',
    'dataset_contribution',
    'ethics_application_writing',
  ],
  qualitative: [
    'interview_guide_development',
    'transcription',
    'thematic_content_analysis',
    'framework_development',
    'writing',
    'citing_referencing',
    'dataset_contribution',
    'ethics_application_writing',
  ],
  mixed_methods: [
    'statistical_analysis_plan',
    'sample_size_calculation',
    'data_cleaning',
    'statistical_data_analysis',
    'interview_guide_development',
    'transcription',
    'thematic_content_analysis',
    'integration_qual_quant',
    'figure_table_preparation',
    'framework_development',
    'writing',
    'citing_referencing',
    'dataset_contribution',
  ],
  policy: [
    'policy_landscape_review',
    'stakeholder_mapping',
    'evidence_synthesis',
    'framework_development',
    'country_specific_adaptation',
    'writing',
    'citing_referencing',
    'grey_literature_search',
  ],
  systematic_review: [
    'search_strategy_development',
    'title_abstract_screening',
    'full_text_screening',
    'data_extraction',
    'risk_of_bias_assessment',
    'meta_analysis_synthesis',
    'statistical_data_analysis',
    'writing',
    'citing_referencing',
    'prisma_reporting',
  ],
  modelling: [
    'model_structure_design',
    'parameter_identification',
    'uncertainty_analysis',
    'statistical_data_analysis',
    'sensitivity_analysis',
    'writing',
    'citing_referencing',
    'cheers_reporting',
  ],
  lab_based: [
    'experimental_design_protocol',
    'sample_preparation_processing',
    'assay_development_optimisation',
    'data_collection_recording',
    'statistical_data_analysis',
    'figure_table_preparation',
    'writing',
    'citing_referencing',
    'ethics_biosafety_documentation',
  ],
  software_computational: [
    'codebase_review_debugging',
    'algorithm_design',
    'data_pipeline_development',
    'model_training_validation',
    'reproducibility_documentation',
    'results_visualisation',
    'writing',
    'citing_referencing',
    'dataset_contribution',
  ],
}

// ─── Contribution type → pill CSS class ──────────────────────────────────────

export const CONTRIBUTION_PILL_CLASS: Record<string, string> = {
  // Analysis (purple)
  statistical_analysis_plan: 'pill-analysis',
  sample_size_calculation: 'pill-analysis',
  statistical_data_analysis: 'pill-analysis',
  uncertainty_analysis: 'pill-analysis',
  sensitivity_analysis: 'pill-analysis',
  meta_analysis_synthesis: 'pill-analysis',

  // Writing (green)
  writing: 'pill-writing',

  // References / search (amber)
  citing_referencing: 'pill-references',
  grey_literature_search: 'pill-references',
  search_strategy_development: 'pill-references',

  // Data (blue)
  dataset_contribution: 'pill-data',
  data_cleaning: 'pill-data',
  data_collection_recording: 'pill-data',
  data_extraction: 'pill-data',
  data_visualization: 'pill-data',
  figure_table_preparation: 'pill-data',
  integration_qual_quant: 'pill-data',

  // Review / screening (orange)
  thematic_content_analysis: 'pill-review',
  title_abstract_screening: 'pill-review',
  full_text_screening: 'pill-review',
  risk_of_bias_assessment: 'pill-review',
  evidence_synthesis: 'pill-review',

  // Methods / qualitative (teal)
  interview_guide_development: 'pill-methods',
  transcription: 'pill-methods',
  framework_development: 'pill-methods',
  policy_landscape_review: 'pill-methods',
  stakeholder_mapping: 'pill-methods',
  country_specific_adaptation: 'pill-methods',
  model_structure_design: 'pill-methods',
  parameter_identification: 'pill-methods',

  // Lab / experimental (rose)
  experimental_design_protocol: 'pill-lab',
  sample_preparation_processing: 'pill-lab',
  assay_development_optimisation: 'pill-lab',
  ethics_application_writing: 'pill-lab',
  ethics_biosafety_documentation: 'pill-lab',

  // Computational (indigo)
  codebase_review_debugging: 'pill-code',
  algorithm_design: 'pill-code',
  data_pipeline_development: 'pill-code',
  model_training_validation: 'pill-code',
  reproducibility_documentation: 'pill-code',
  results_visualisation: 'pill-data',

  // Reporting
  prisma_reporting: 'pill-review',
  cheers_reporting: 'pill-review',

  // Legacy types
  references: 'pill-references',
  data_analysis: 'pill-analysis',
  review: 'pill-review',
  has_data: 'pill-data',
}

/** Short placeholders for stage description fields — not auto-filled copy. */
export const CONTRIBUTION_HINTS: Record<string, string> = {
  statistical_analysis_plan: 'What analyses, outcomes, or software?',
  sample_size_calculation: 'Which outcome and design?',
  data_cleaning: 'What needs cleaning or coding?',
  statistical_data_analysis: 'Which analyses, and on what?',
  data_visualization: 'Charts, maps, or figure set?',
  writing: 'Which sections?',
  citing_referencing: 'Style guide, reference manager?',
  dataset_contribution: 'What data, and in what form?',
  figure_table_preparation: 'Journal format? How many?',
  ethics_application_writing: 'Which board / form?',
  interview_guide_development: 'Topic coverage, length?',
  transcription: 'Language, volume, verbatim?',
  thematic_content_analysis: 'Approach, software, codebook?',
  framework_development: 'What kind of framework?',
  integration_qual_quant: 'How should the strands meet?',
  policy_landscape_review: 'Jurisdiction and focus?',
  stakeholder_mapping: 'Which sector or region?',
  evidence_synthesis: 'Question and output format?',
  country_specific_adaptation: 'Which country / setting?',
  grey_literature_search: 'Sources and scope?',
  search_strategy_development: 'Databases, PICOS?',
  title_abstract_screening: 'Rough number of records?',
  full_text_screening: 'Inclusion criteria notes?',
  data_extraction: 'Form / fields already set?',
  risk_of_bias_assessment: 'Which tool?',
  meta_analysis_synthesis: 'Software, model preference?',
  model_structure_design: 'Decision tree, Markov, other?',
  parameter_identification: 'Which parameters need sourcing?',
  uncertainty_analysis: 'PSA, scenario, other?',
  sensitivity_analysis: 'One-way, tornado, other?',
  experimental_design_protocol: 'What needs designing?',
  sample_preparation_processing: 'Tissue, reagents, volume?',
  assay_development_optimisation: 'Assay type and goal?',
  data_collection_recording: 'Instrument, format, volume?',
  ethics_biosafety_documentation: 'What docs are outstanding?',
  codebase_review_debugging: 'Language, repo state?',
  algorithm_design: 'Problem and constraints?',
  data_pipeline_development: 'Source → clean → store?',
  model_training_validation: 'Task, metrics, data size?',
  reproducibility_documentation: 'Env, notebook, README?',
  results_visualisation: 'Figure types, software, count?',
  prisma_reporting: 'Flow diagram and checklist items?',
  cheers_reporting: 'Which version / section needs completing?',
}

// ─── Paper tracking stages ────────────────────────────────────────────────────

export const TRACKING_STAGES = [
  'idea',
  'recruiting',
  'data_analysis',
  'drafting',
  'internal_review',
  'submitted',
  'revisions',
  'published',
] as const

export type TrackingStage = (typeof TRACKING_STAGES)[number]

export const TRACKING_STAGE_LABELS: Record<TrackingStage, string> = {
  idea: 'Idea',
  recruiting: 'Recruiting co-authors',
  data_analysis: 'Data & analysis',
  drafting: 'Drafting',
  internal_review: 'Internal review',
  submitted: 'Submitted',
  revisions: 'Revisions',
  published: 'Accepted / Published',
}

// Matches the tracker mockup's per-column accent colors (see --tracker-* tokens in globals.css)
export const TRACKING_STAGE_COLORS: Record<TrackingStage, string> = {
  idea: '#9089B8',
  recruiting: '#6C63A6',
  data_analysis: '#3B3168',
  drafting: '#3B3168',
  internal_review: '#C1652F',
  submitted: '#B8863B',
  revisions: '#C1652F',
  published: '#4B7A51',
}

export const AUTHORSHIP_OFFER_LABELS: Record<string, string> = {
  coauthor: 'Co-authorship for substantial work',
  acknowledgement: 'Acknowledgement only',
  case_by_case: 'To be discussed',
}

export const AUTHORSHIP_OFFER_HINTS: Record<string, string> = {
  coauthor: 'Assessed after completion. Not guaranteed in advance.',
  acknowledgement: 'No authorship credit regardless of contribution.',
  case_by_case: "You'll agree terms directly with each collaborator.",
}

export const AUTHORSHIP_ORDER_LABELS: Record<string, string> = {
  discussed: 'To be agreed',
  first_retained: 'Lead remains first author',
  open: 'Open',
}

/** One-line summary for apply modal / listings. */
export function authorshipSummaryLine(
  offer?: string | null,
  order?: string | null,
): string | null {
  const parts: string[] = []
  if (offer) {
    const label = AUTHORSHIP_OFFER_LABELS[offer]
    if (label) parts.push(label)
  }
  if (order) {
    const label = AUTHORSHIP_ORDER_LABELS[order]
    if (label) parts.push(label)
  }
  return parts.length > 0 ? parts.join(' · ') : null
}

export const JOB_TITLE_LABELS: Record<string, string> = {
  phd_candidate: 'PhD Candidate',
  postdoc: 'Postdoctoral Researcher',
  research_officer: 'Research Officer',
  lecturer: 'Lecturer',
  senior_lecturer: 'Senior Lecturer',
  associate_professor: 'Associate Professor',
  professor: 'Professor',
  other: 'Other',
}

export const DATASET_SIZE_LABELS: Record<string, string> = {
  small: 'Small (e.g. under 100 samples/records)',
  medium: 'Medium (e.g. 100–1,000 samples/records)',
  large: 'Large (e.g. 1,000–10,000 samples/records)',
  very_large: 'Very large (e.g. 10,000+ samples/records)',
  not_applicable: 'Not applicable',
  // Legacy row-count values from before the taxonomy update
  none: 'No dataset',
  lt500: '< 500 rows',
  '500_1k': '500 – 1,000 rows',
  '1k_10k': '1,000 – 10,000 rows',
  '10k_100k': '10,000 – 100,000 rows',
  '100k_500k': '100,000 – 500,000 rows',
  gt500k: '500,000+ rows',
}

export const APPLICATION_STATUS_LABELS: Record<string, string> = {
  interest_registered: 'Interest registered',
  pending: 'Interest registered', // legacy pre-rename status
  accepted: 'Accepted',
  rejected: 'Not selected',
}

/** Contributor-facing status wording — answers "did they respond yet?" */
export const CONTRIBUTOR_APPLICATION_STATUS_LABELS: Record<string, string> = {
  interest_registered: 'Awaiting response',
  pending: 'Awaiting response', // legacy pre-rename status
  accepted: 'Accepted',
  rejected: 'Not selected',
}

export const PAPER_STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  published: 'Published',
}

/** Application statuses awaiting an owner decision (includes legacy `pending`). */
export const AWAITING_REVIEW_STATUSES = ['interest_registered', 'pending'] as const

/** Open applications awaiting owner decision (includes legacy `pending`). */
export function isAwaitingReviewStatus(status: string | null | undefined): boolean {
  return status === 'interest_registered' || status === 'pending'
}

// ─── Owner collaboration management ──────────────────────────────────────────

export const COLLABORATION_STATUS_LABELS: Record<string, string> = {
  in_progress: 'Awaiting contributor confirmation',
  interest_confirmed: 'Awaiting document share',
  document_shared: 'Awaiting confirmation',
  contribution_confirmed: 'In progress',
  revision_requested: 'Revision requested',
  submitted: 'Needs review',
  substantial: 'Completed',
  not_substantial: 'Completed',
  expired: 'Expired',
  completed: 'Completed',
}

export type CollaborationUrgency = 'needs_you' | 'in_progress' | 'completed'

export type CollaborationNextAction = 'share_document' | 'review_submission' | 'message' | 'view'

/** Owner must act: share a doc or review a submission. */
export function collaborationNeedsOwnerAction(status: string): boolean {
  return status === 'interest_confirmed' || status === 'submitted'
}

export function collaborationUrgency(status: string): CollaborationUrgency {
  if (collaborationNeedsOwnerAction(status)) return 'needs_you'
  if (status === 'substantial' || status === 'not_substantial' || status === 'expired' || status === 'completed') {
    return 'completed'
  }
  return 'in_progress'
}

export function collaborationNextAction(status: string): CollaborationNextAction {
  if (status === 'interest_confirmed') return 'share_document'
  if (status === 'submitted') return 'review_submission'
  if (status === 'in_progress' || status === 'document_shared' || status === 'contribution_confirmed' || status === 'revision_requested') {
    return 'message'
  }
  return 'view'
}

export const COLLABORATION_NEXT_ACTION_LABELS: Record<CollaborationNextAction, string> = {
  share_document: 'Share document',
  review_submission: 'Review submission',
  message: 'Message',
  view: 'View',
}

export const COLLABORATION_OWNER_NEXT_STEPS = {
  afterAccept:
    'Next: wait for them to confirm they’d like to proceed — you’ll get a notification. Then open Manage on your paper and share your Google Doc with them. You can also message them from Collaborations.',
  afterDocShare:
    'Document saved. They’ll confirm their role on Scholara, then submit their work. You’ll get a notification when it’s ready to review. Message them anytime if they have questions.',
} as const

// ─── Contributor collaboration management ────────────────────────────────────

export const CONTRIBUTOR_COLLABORATION_STATUS_LABELS: Record<string, string> = {
  in_progress: 'Confirm you want to proceed',
  interest_confirmed: 'Waiting for document',
  document_shared: 'Confirm your role',
  contribution_confirmed: 'Submit your work',
  revision_requested: 'Revise and resubmit',
  submitted: 'Under review',
  substantial: 'Completed',
  not_substantial: 'Completed',
  expired: 'Expired',
  completed: 'Completed',
}

export type ContributorNextAction = 'confirm_interest' | 'confirm_role' | 'submit_work' | 'submit_revision' | 'message' | 'view'

export function collaborationNeedsContributorAction(status: string): boolean {
  return status === 'in_progress' || status === 'document_shared' || status === 'contribution_confirmed' || status === 'revision_requested'
}

export function contributorCollaborationUrgency(status: string): CollaborationUrgency {
  if (collaborationNeedsContributorAction(status)) return 'needs_you'
  if (status === 'substantial' || status === 'not_substantial' || status === 'expired' || status === 'completed') {
    return 'completed'
  }
  return 'in_progress'
}

export function contributorCollaborationNextAction(status: string): ContributorNextAction {
  if (status === 'in_progress') return 'confirm_interest'
  if (status === 'document_shared') return 'confirm_role'
  if (status === 'contribution_confirmed') return 'submit_work'
  if (status === 'revision_requested') return 'submit_revision'
  if (status === 'interest_confirmed' || status === 'submitted') return 'message'
  return 'view'
}

export const CONTRIBUTOR_NEXT_ACTION_LABELS: Record<ContributorNextAction, string> = {
  confirm_interest: 'Confirm to proceed',
  confirm_role: 'Confirm role',
  submit_work: 'Submit work',
  submit_revision: 'Submit revision',
  message: 'Message',
  view: 'View',
}

/** Short status for a stage row on My papers. */
export function paperStageRowLabel(
  stageOpen: boolean,
  contribStatuses: string[],
): string {
  if (contribStatuses.length === 0) {
    return stageOpen ? 'Open' : 'Closed'
  }
  if (contribStatuses.some((s) => s === 'interest_confirmed')) return 'Awaiting document'
  if (contribStatuses.some((s) => s === 'in_progress')) return 'Awaiting confirmation'
  if (contribStatuses.some((s) => s === 'submitted')) return 'Needs review'
  if (contribStatuses.every((s) => collaborationUrgency(s) === 'completed')) return 'Completed'
  return 'In progress'
}

export function paperStageRowAction(
  stageOpen: boolean,
  contribStatuses: string[],
): CollaborationNextAction | null {
  if (contribStatuses.some((s) => s === 'interest_confirmed')) return 'share_document'
  if (contribStatuses.some((s) => s === 'submitted')) return 'review_submission'
  if (contribStatuses.some((s) => collaborationUrgency(s) === 'in_progress')) return 'view'
  if (stageOpen && contribStatuses.length === 0) return null
  return 'view'
}
