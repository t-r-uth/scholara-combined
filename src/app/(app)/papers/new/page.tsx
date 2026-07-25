import { redirect, notFound } from 'next/navigation'
import { getServerUser } from '@/lib/firebase/session'
import { db } from '@/lib/firebase/admin'
import { ROUTES } from '@/lib/routes'
import { TRACKING_STAGES, type TrackingStage } from '@/lib/labels'
import NewPaperForm from './NewPaperForm'

export const metadata = { title: 'Post a Paper — Scholara' }

export default async function NewPaperPage({
  searchParams,
}: {
  searchParams: { edit?: string }
}) {
  const user = await getServerUser()
  if (!user) redirect(ROUTES.signIn)

  const editId = searchParams.edit?.trim()
  if (!editId) {
    return <NewPaperForm />
  }

  const [paperSnap, stagesSnap] = await Promise.all([
    db.collection('papers').doc(editId).get(),
    db.collection('stages').where('paper_id', '==', editId).get(),
  ])
  if (!paperSnap.exists) notFound()
  const paper = paperSnap.data()!
  if (paper.owner_id !== user.id) notFound()
  if (paper.status !== 'draft' && paper.status !== 'published') {
    redirect(`/papers/${editId}`)
  }

  const str = (v: unknown) => (v as string | null | undefined) || ''

  const stages = stagesSnap.docs
    .map((d) => ({ type: str(d.data().type), description: str(d.data().description) }))
    .filter((s) => s.type)

  const institutions = paper.allowed_institutions
  const allowedInstitutions = Array.isArray(institutions) ? institutions.join('\n') : ''

  return (
    <NewPaperForm
      initial={{
        id: editId,
        status: paper.status as 'draft' | 'published',
        teaser_title: str(paper.teaser_title),
        full_title: str(paper.full_title),
        description: str(paper.description),
        full_abstract: str(paper.full_abstract),
        external_doc_link: str(paper.external_doc_link),
        scope: str(paper.scope),
        study_type: str(paper.study_type),
        dataset_size: str(paper.dataset_size),
        access_type: (paper.access_type as 'open' | 'institution' | 'invite' | undefined) ?? 'open',
        allowed_institutions: allowedInstitutions,
        stages,
        abstract_visibility: (paper.abstract_visibility as 'accepted_only' | 'public' | 'teaser_only' | undefined) ?? 'accepted_only',
        teaser_description: str(paper.teaser_description),
        authorship_offer: str(paper.authorship_offer),
        authorship_order: str(paper.authorship_order),
        target_journal: str(paper.target_journal),
        submission_timeline: str(paper.submission_timeline),
        additional_terms: str(paper.additional_terms),
        post_submission_support: (paper.post_submission_support as boolean | undefined) ?? false,
        tracker_visible_to_contributors: (paper.tracker_visible_to_contributors as boolean | undefined) ?? false,
        tracking_stage: (TRACKING_STAGES.includes(paper.tracking_stage as TrackingStage) ? paper.tracking_stage : 'idea') as TrackingStage,
        needs_contributors: (paper.needs_contributors === 'no' ? 'no' : 'yes') as 'yes' | 'no',
      }}
    />
  )
}
