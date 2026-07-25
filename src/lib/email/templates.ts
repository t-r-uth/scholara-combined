const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://scholara.app'

function layout(content: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Scholara</title>
</head>
<body style="margin:0;padding:0;background:#f6f7f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:40px 16px;">
      <table width="100%" style="max-width:520px;background:#fff;border-radius:12px;border:1px solid #e4e7ec;overflow:hidden;">
        <tr>
          <td style="padding:24px 32px 16px;border-bottom:1px solid #f0f2f5;">
            <span style="font-size:18px;font-weight:700;color:#111827;">Scho<span style="color:#3b6fcc;">lara</span></span>
          </td>
        </tr>
        <tr><td style="padding:28px 32px 32px;">${content}</td></tr>
        <tr>
          <td style="padding:16px 32px;background:#f6f7f9;border-top:1px solid #f0f2f5;">
            <p style="margin:0;font-size:11px;color:#9ca3af;line-height:1.6;">
              You're receiving this because you have a Scholara account.<br/>
              Scholara — Research Collaboration Marketplace
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function btn(href: string, label: string) {
  return `<a href="${href}" style="display:inline-block;margin-top:20px;padding:10px 22px;background:#1e2533;color:#fff;border-radius:8px;text-decoration:none;font-size:13px;font-weight:500;">${label}</a>`
}

function p(text: string) {
  return `<p style="margin:0 0 12px;font-size:14px;color:#374151;line-height:1.7;">${text}</p>`
}

function muted(text: string) {
  return `<p style="margin:8px 0 0;font-size:12px;color:#9ca3af;">${text}</p>`
}

// ─── Templates ────────────────────────────────────────────────────────────────

export function newApplicantEmail(opts: {
  ownerEmail: string
  applicantName: string
  paperTitle: string
  stageLabel: string
  paperId: string
}) {
  const html = layout(`
    ${p(`<strong>${opts.applicantName}</strong> has applied to your <strong>${opts.stageLabel}</strong> stage.`)}
    ${p(`Paper: <em>${opts.paperTitle}</em>`)}
    ${btn(`${BASE_URL}/work/applicants`, 'Review applicants')}
    ${muted('You can accept or reject this application from My work.')}
  `)
  return {
    to: opts.ownerEmail,
    subject: `New application for "${opts.paperTitle}"`,
    html,
  }
}

export function applicationAcceptedEmail(opts: {
  contributorEmail: string
  paperTitle: string
  stageLabel: string
  paperId: string
}) {
  const html = layout(`
    ${p(`Great news — your application to the <strong>${opts.stageLabel}</strong> stage has been <strong>accepted</strong>.`)}
    ${p(`Paper: <em>${opts.paperTitle}</em>`)}
    ${p(`The author's contact information is now available on the paper page. Head over to see it and share your preferred contact method.`)}
    ${btn(`${BASE_URL}/papers/${opts.paperId}`, 'View paper & connect')}
  `)
  return {
    to: opts.contributorEmail,
    subject: `You've been accepted — ${opts.paperTitle}`,
    html,
  }
}

export function applicationRejectedEmail(opts: {
  contributorEmail: string
  paperTitle: string
  stageLabel: string
}) {
  const html = layout(`
    ${p(`Thank you for your interest. Unfortunately, the author has selected another contributor for the <strong>${opts.stageLabel}</strong> stage.`)}
    ${p(`Paper: <em>${opts.paperTitle}</em>`)}
    ${p(`Keep exploring — there are many other collaboration opportunities on Scholara.`)}
    ${btn(`${BASE_URL}/discover`, 'Discover more papers')}
  `)
  return {
    to: opts.contributorEmail,
    subject: `Application update — ${opts.paperTitle}`,
    html,
  }
}

export function slotExpiredContributorEmail(opts: {
  contributorEmail: string
  paperTitle: string
  stageLabel: string
}) {
  const html = layout(`
    ${p(`Your 30-day window to submit your <strong>${opts.stageLabel}</strong> contribution has passed.`)}
    ${p(`Paper: <em>${opts.paperTitle}</em>`)}
    ${p(`The slot has been reopened to new applicants. If you're still interested in contributing to this paper, you're welcome to re-apply.`)}
    ${btn(`${BASE_URL}/discover`, 'Discover more papers')}
  `)
  return {
    to: opts.contributorEmail,
    subject: `Contribution slot expired — ${opts.paperTitle}`,
    html,
  }
}

export function revisionSubmittedEmail(opts: {
  ownerEmail: string
  contributorName: string
  paperTitle: string
  stageLabel: string
  paperId: string
  submissionNote: string
  submissionUrl: string
}) {
  const html = layout(`
    ${p(`<strong>${opts.contributorName}</strong> has resubmitted their <strong>${opts.stageLabel}</strong> contribution after your revision request.`)}
    ${p(`Paper: <em>${opts.paperTitle}</em>`)}
    ${opts.submissionNote ? p(`Their note: "<em>${opts.submissionNote}</em>"`) : ''}
    ${btn(`${BASE_URL}/papers/${opts.paperId}`, 'Review resubmission')}
  `)
  return {
    to: opts.ownerEmail,
    subject: `Revision resubmitted — ${opts.paperTitle}`,
    html,
  }
}

export function newMessageEmail(opts: {
  recipientEmail: string
  senderName: string
  paperTitle: string
  paperId: string
  applicationId: string
  messagePreview: string
}) {
  const preview = opts.messagePreview.length > 200
    ? opts.messagePreview.slice(0, 200) + '…'
    : opts.messagePreview
  const html = layout(`
    ${p(`<strong>${opts.senderName}</strong> sent you a message on Scholara.`)}
    ${p(`Paper: <em>${opts.paperTitle}</em>`)}
    ${p(`"<em>${preview}</em>"`)}
    ${btn(`${BASE_URL}/messages/${opts.applicationId}`, 'Reply on Scholara')}
    ${muted('Open Messages to continue the conversation.')}
  `)
  return {
    to: opts.recipientEmail,
    subject: `New message from ${opts.senderName} — ${opts.paperTitle}`,
    html,
  }
}

export function stageCompletedEmail(opts: {
  contributorEmail: string
  paperTitle: string
  stageLabel: string
  paperId: string
}) {
  const html = layout(`
    ${p(`The author has marked the <strong>${opts.stageLabel}</strong> stage as <strong>completed</strong> on their paper.`)}
    ${p(`Paper: <em>${opts.paperTitle}</em>`)}
    ${p(`This contribution will now appear on your profile. The author will also make a co-authorship decision shortly.`)}
    ${btn(`${BASE_URL}/papers/${opts.paperId}`, 'View paper')}
  `)
  return {
    to: opts.contributorEmail,
    subject: `Stage completed — ${opts.paperTitle}`,
    html,
  }
}

export function coauthorDecisionEmail(opts: {
  contributorEmail: string
  paperTitle: string
  stageLabel: string
  decision: 'granted' | 'declined'
  paperId: string
}) {
  const granted = opts.decision === 'granted'
  const html = layout(`
    ${p(`The author has made a co-authorship decision for the <strong>${opts.stageLabel}</strong> stage.`)}
    ${p(`Paper: <em>${opts.paperTitle}</em>`)}
    ${p(granted
      ? `<strong style="color:#166534;">Co-authorship granted.</strong> Congratulations — you'll be credited as a co-author on this paper.`
      : `Co-authorship has not been granted for this contribution. Thank you for your work on this stage.`
    )}
    ${btn(`${BASE_URL}/profile/me`, 'View your profile')}
  `)
  return {
    to: opts.contributorEmail,
    subject: granted
      ? `Co-authorship granted — ${opts.paperTitle}`
      : `Co-authorship update — ${opts.paperTitle}`,
    html,
  }
}
