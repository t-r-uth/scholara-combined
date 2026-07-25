'use client'

import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

interface ModalProps {
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  isClosing?: boolean
}

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ')

function isVisible(el: HTMLElement): boolean {
  return typeof el.checkVisibility === 'function'
    ? el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })
    : el.getClientRects().length > 0
}

function getFocusable(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(isVisible)
}

let scrollLockCount = 0
let previousBodyOverflow = ''

function lockBodyScroll() {
  if (scrollLockCount === 0) {
    previousBodyOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
  }
  scrollLockCount += 1
}

function unlockBodyScroll() {
  scrollLockCount = Math.max(0, scrollLockCount - 1)
  if (scrollLockCount === 0) {
    document.body.style.overflow = previousBodyOverflow
  }
}

export default function Modal({ title, onClose, children, footer, isClosing = false }: ModalProps) {
  const titleId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    const previous = document.activeElement as HTMLElement | null
    const overlay = overlayRef.current
    const dialog = dialogRef.current
    if (!overlay || !dialog) return

    lockBodyScroll()

    const inerted: HTMLElement[] = []
    for (const child of Array.from(document.body.children)) {
      if (!(child instanceof HTMLElement) || child === overlay) continue
      if (child.hasAttribute('inert')) continue
      child.setAttribute('inert', '')
      inerted.push(child)
    }

    requestAnimationFrame(() => {
      if (!dialog.contains(document.activeElement)) {
        const focusable = getFocusable(dialog)
        ;(focusable[0] ?? dialog).focus()
      }
    })

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        onCloseRef.current()
        return
      }

      if (e.key !== 'Tab' || !dialog) return

      const focusable = getFocusable(dialog)
      if (focusable.length === 0) {
        e.preventDefault()
        dialog.focus()
        return
      }

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const active = document.activeElement

      if (e.shiftKey) {
        if (active === first || active === dialog) {
          e.preventDefault()
          last.focus()
        }
      } else if (active === last) {
        e.preventDefault()
        first.focus()
      }
    }

    function onFocusIn(e: FocusEvent) {
      if (!dialog || dialog.contains(e.target as Node)) return
      const focusable = getFocusable(dialog)
      ;(focusable[0] ?? dialog).focus()
    }

    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('focusin', onFocusIn)

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('focusin', onFocusIn)
      for (const el of inerted) el.removeAttribute('inert')
      unlockBodyScroll()
      previous?.focus()
    }
  }, [mounted])

  if (!mounted) return null

  return createPortal(
    <div
      ref={overlayRef}
      className={`modal-overlay${isClosing ? ' modal-overlay--closing' : ''}`}
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`modal${isClosing ? ' modal--closing' : ''}`}
        onClick={e => e.stopPropagation()}
      >
        <div className="modal__header">
          <div className="modal__title" id={titleId}>{title}</div>
          <button
            type="button"
            className="modal__close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        {children}
        {footer}
      </div>
    </div>,
    document.body,
  )
}
