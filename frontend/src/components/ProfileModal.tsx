import { useCallback, useEffect, useRef, type ReactNode, type RefObject } from 'react'
import { Navigate, useLocation, useNavigate, useParams, type Location } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import type { Station } from '../types/station'
import { ProfileContent } from './profile/ProfileContent'
import './ProfileModal.css'

interface ProfileLocationState {
  backgroundLocation?: Location
}

interface ModalShellProps {
  onClose: () => void
  titleId: string
  cardRef: RefObject<HTMLDivElement | null>
  children: ReactNode
}

function ModalShell({ onClose, titleId, cardRef, children }: ModalShellProps) {
  const closeRef = useRef<HTMLButtonElement>(null)
  const previouslyFocused = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!previouslyFocused.current) {
      previouslyFocused.current = document.activeElement as HTMLElement | null
    }

    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }

      if (event.key !== 'Tab' || !cardRef.current) return

      const focusable = Array.from(
        cardRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      ).filter((element) => element.getClientRects().length > 0)

      if (focusable.length === 0) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = prevOverflow
      previouslyFocused.current?.focus?.()
    }
  }, [cardRef, onClose])

  return (
    <div className="profile-modal-overlay" onClick={onClose}>
      <div
        className="profile-modal-card"
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="profile-modal-close"
          ref={closeRef}
          onClick={onClose}
          aria-label="Close profile"
        >
          ✕
        </button>
        {children}
      </div>
    </div>
  )
}

export function ProfileModalRoute({ stations }: { stations: Station[] }) {
  const { userId = '' } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { user, profile, loading, profileLoading, refreshProfile, signOut } = useAuth()
  const cardRef = useRef<HTMLDivElement>(null)

  const backgroundLocation = (location.state as ProfileLocationState | null)?.backgroundLocation
  const hasBackground = Boolean(backgroundLocation)

  const close = useCallback(() => {
    if (hasBackground) {
      navigate(-1)
    } else {
      navigate('/', { replace: true })
    }
  }, [hasBackground, navigate])

  const scrollCardToTop = useCallback(() => {
    cardRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const handleSignOut = useCallback(async () => {
    // Close first so the modal is gone before the auth state clears and this
    // route would otherwise redirect on its own.
    close()
    await signOut()
  }, [close, signOut])

  const titleId = 'profile-modal-title'

  if (loading) {
    return (
      <ModalShell onClose={close} titleId={titleId} cardRef={cardRef}>
        <h2 className="profile-title" id={titleId}>Your profile</h2>
        <p className="profile-modal-status">Checking your session…</p>
      </ModalShell>
    )
  }

  if (!user) {
    return <Navigate to="/" replace />
  }

  // The URL id is only an ownership check. Profile data always comes from the
  // token-scoped AuthContext, never from a by-id request.
  if (userId.toLowerCase() !== user.id.toLowerCase()) {
    return (
      <ModalShell onClose={close} titleId={titleId} cardRef={cardRef}>
        <h2 className="profile-title" id={titleId}>Profile not available</h2>
        <p className="profile-modal-status">
          Profiles are private. You can only view and edit your own profile.
        </p>
        <button type="button" className="save-btn profile-retry-btn" onClick={close}>
          Close
        </button>
      </ModalShell>
    )
  }

  if (!profile) {
    if (profileLoading) {
      return (
        <ModalShell onClose={close} titleId={titleId} cardRef={cardRef}>
          <h2 className="profile-title" id={titleId}>Your profile</h2>
          <p className="profile-modal-status">Loading your profile…</p>
        </ModalShell>
      )
    }

    return (
      <ModalShell onClose={close} titleId={titleId} cardRef={cardRef}>
        <h2 className="profile-title" id={titleId}>Could not load your profile</h2>
        <p className="profile-modal-status">Check your connection and try again.</p>
        <button
          type="button"
          className="save-btn profile-retry-btn"
          onClick={() => { void refreshProfile() }}
        >
          Retry
        </button>
      </ModalShell>
    )
  }

  return (
    <ModalShell onClose={close} titleId={titleId} cardRef={cardRef}>
      <ProfileContent
        key={user.id}
        user={user}
        profile={profile}
        stations={stations}
        onSignOut={handleSignOut}
        onSaved={scrollCardToTop}
        titleId={titleId}
      />
    </ModalShell>
  )
}
