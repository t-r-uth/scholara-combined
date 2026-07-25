'use client'
import { useState, useTransition, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { sendMessage } from '@/app/(app)/papers/[id]/actions'
import type { Message } from '@/lib/firestore/messages'
import { relativeTimeShort } from '@/lib/relative-time'

export type { Message }

function renderText(raw: string) {
    const parts = raw.split(/(https?:\/\/[^\s]+)/g)
  return parts.map((part, i) =>
    /^https?:\/\//.test(part)
      ? <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="msg-link">{part}</a>
      : <span key={i}>{part}</span>
  )
}

export default function MessageThread({
  applicationId,
  currentUserId,
  initialMessages,
}: {
  applicationId: string
  currentUserId: string
  initialMessages: Message[]
}) {
  const [text, setText] = useState('')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [initialMessages.length])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  function submit() {
    const trimmed = text.trim()
    if (!trimmed || isPending) return
    setText('')
    setError(null)
    startTransition(async () => {
      try {
        await sendMessage(applicationId, trimmed)
        router.refresh()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not send.')
        setText(trimmed)
      }
    })
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  const count = initialMessages.length

  return (
    <div className="msg-screen-thread">
      <div className="msg-screen-thread__list" ref={listRef}>
        {count === 0 ? (
          <div className="msg-screen-thread__empty">
            No messages yet. Send one to get started.
          </div>
        ) : (
          initialMessages.map(msg => {
            const isMine = msg.sender_id === currentUserId
            return (
              <div key={msg.id} className={`msg-bubble${isMine ? ' msg-bubble--mine' : ''}`}>
                <div className="msg-bubble__text">{renderText(msg.body)}</div>
                <div className="msg-bubble__time">{relativeTimeShort(msg.created_at_ms)}</div>
              </div>
            )
          })
        )}
      </div>

      <div className="msg-screen-thread__compose">
        <textarea
          ref={inputRef}
          className="msg-screen-thread__input"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Write a message… (Enter to send, Shift+Enter for new line)"
          rows={2}
          maxLength={2000}
          disabled={isPending}
          aria-label="Message"
        />
        <button
          type="button"
          className="btn-primary btn-primary--compact"
          onClick={submit}
          disabled={isPending || !text.trim()}
        >
          {isPending ? 'Sending…' : 'Send'}
        </button>
      </div>
      {error && <p className="form-error form-error--compact">{error}</p>}
    </div>
  )
}
