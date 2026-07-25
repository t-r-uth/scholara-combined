'use client'
import { useState } from 'react'

export default function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <button
      type="button"
      className={`copy-btn${copied ? ' copy-btn--copied' : ''}`}
      onClick={handleCopy}
    >
      {copied ? 'Copied!' : 'Copy'}
    </button>
  )
}
