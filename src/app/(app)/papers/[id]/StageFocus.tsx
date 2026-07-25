'use client'

import { useEffect, useRef } from 'react'

/** Scrolls to and briefly flashes the stage a notification linked to (?stage=<id>). */
export default function StageFocus({ stageId }: { stageId?: string }) {
  const done = useRef(false)

  useEffect(() => {
    if (!stageId || done.current) return
    const el = document.getElementById(`stage-${stageId}`)
    if (!el) return
    done.current = true
    requestAnimationFrame(() => {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      el.classList.add('stage-focus-highlight')
      el.addEventListener('animationend', () => el.classList.remove('stage-focus-highlight'), { once: true })
    })
  }, [stageId])

  return null
}
