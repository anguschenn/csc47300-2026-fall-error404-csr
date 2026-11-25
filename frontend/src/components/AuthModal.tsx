import { useState, type FormEvent } from 'react'
import { useAuth } from '../context/useAuth'
import './AuthModal.css'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
}

type AuthMode = 'signin' | 'signup' | 'forgot' | 'update-password'

function AuthModalContent({ onClose }: { onClose: () => void }) {
  const {
    signInWithPassword,
    signUpWithPassword,
    resetPasswordForEmail,
    updatePassword,
    isPasswordRecovery,
    clearPasswordRecovery
  } = useAuth()

  const [mode, setMode] = useState<AuthMode>(() => (isPasswordRecovery ? 'update-password' : 'signin'))
  const [displayName, setDisplayName] = useState('')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const handleClose = () => {
    if (mode === 'update-password') {
      clearPasswordRecovery()
    }
    setError(null)
    setSuccessMessage(null)
    onClose()
  }

  const validatePasswordSecurity = (pass: string): string | null => {
    if (pass.length < 8) {
      return 'Password must be at least 8 characters long.'
    }
    if (!/[A-Za-z]/.test(pass) || !/[0-9]/.test(pass)) {
      return 'Password must contain at least one letter and one number.'
    }
    return null
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccessMessage(null)

    // 1. Password security & matching for registration
    if (mode === 'signup') {
      const securityError = validatePasswordSecurity(password)
      if (securityError) {
        setError(securityError)
        return
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match. Please retype your password.')
        return
      }
    }

    // 2. Password security & matching for setting new password
    if (mode === 'update-password') {
      const securityError = validatePasswordSecurity(newPassword)
      if (securityError) {
        setError(securityError)
        return
      }
      if (newPassword !== confirmNewPassword) {
        setError('Passwords do not match. Please retype your password.')
        return
      }
    }

    setLoading(true)

    try {
      if (mode === 'signup') {
        const { error: signUpError, user } = await signUpWithPassword(
          email,
          password,
          displayName.trim() || undefined,
          fullName.trim() || undefined
        )
        if (signUpError) {
          setError(signUpError.message)
        } else {
          if (user && !user.confirmed_at && (!user.identities || user.identities.length === 0)) {
            setSuccessMessage('Registration successful! Please check your email to verify your account.')
          } else {
            setSuccessMessage('Account created successfully!')
            setTimeout(() => {
              handleClose()
            }, 1200)
          }
        }
      } else if (mode === 'signin') {
        const { error: signInError } = await signInWithPassword(email, password)
        if (signInError) {
          setError(signInError.message)
        } else {
          handleClose()
        }
      } else if (mode === 'forgot') {
        const { error: resetError } = await resetPasswordForEmail(email)
        if (resetError) {
          setError(resetError.message)
        } else {
          setSuccessMessage('Password reset link sent! Please check your email inbox.')
        }
      } else if (mode === 'update-password') {
        const { error: updateError } = await updatePassword(newPassword)
        if (updateError) {
          setError(updateError.message)
        } else {
          setSuccessMessage('Password updated successfully! Redirecting...')
          setTimeout(() => {
            handleClose()
          }, 1200)
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode)
    setError(null)
    setSuccessMessage(null)
    setPassword('')
    setConfirmPassword('')
    setNewPassword('')
    setConfirmNewPassword('')
  }

  return (
    <div className="auth-modal-overlay" onClick={handleClose}>
      <div
        className="auth-modal-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <button className="auth-modal-close" onClick={handleClose} aria-label="Close dialog">
          ✕
        </button>

        <h2 className="auth-modal-title">
          {mode === 'signup' && 'Create your MetroPulse account'}
          {mode === 'signin' && 'Welcome back'}
          {mode === 'forgot' && 'Reset your password'}
          {mode === 'update-password' && 'Set a new password'}
        </h2>
        <p className="auth-modal-subtitle">
          {mode === 'signup' && 'Sign up to personalize station alerts and save your commutes.'}
          {mode === 'signin' && 'Sign in to access your saved routes and commuter profile.'}
          {mode === 'forgot' && "Enter your account email and we'll send you a password reset link."}
          {mode === 'update-password' && 'Enter a secure new password for your account below.'}
        </p>

        {error && <div className="auth-banner error">{error}</div>}
        {successMessage && <div className="auth-banner success">{successMessage}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          {mode === 'signup' && (
            <>
              <div className="form-group">
                <label htmlFor="auth-displayname">Display Name (Nickname / Handle)</label>
                <input
                  id="auth-displayname"
                  type="text"
                  placeholder="e.g. Alex or SubwayRider99"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  autoComplete="username"
                />
              </div>

              <div className="form-group">
                <label htmlFor="auth-fullname">Full Name (optional)</label>
                <input
                  id="auth-fullname"
                  type="text"
                  placeholder="Jane Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  autoComplete="name"
                />
              </div>
            </>
          )}

          {/* Email input shown on signin, signup, and forgot */}
          {mode !== 'update-password' && (
            <div className="form-group">
              <label htmlFor="auth-email">Email</label>
              <input
                id="auth-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
          )}

          {/* Password for signin */}
          {mode === 'signin' && (
            <div className="form-group">
              <div className="label-row">
                <label htmlFor="auth-password">Password</label>
                <button
                  type="button"
                  className="forgot-password-link"
                  onClick={() => switchMode('forgot')}
                >
                  Forgot password?
                </button>
              </div>
              <div className="password-input-wrapper">
                <input
                  id="auth-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
          )}

          {/* Password + Confirm Password for signup */}
          {mode === 'signup' && (
            <>
              <div className="form-group">
                <label htmlFor="auth-password">Password</label>
                <div className="password-input-wrapper">
                  <input
                    id="auth-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                <span className="password-hint">
                  Must be at least 8 characters with a letter and a number.
                </span>
              </div>

              <div className="form-group">
                <label htmlFor="auth-confirm-password">Confirm Password</label>
                <div className="password-input-wrapper">
                  <input
                    id="auth-confirm-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Re-type your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />
                </div>
              </div>
            </>
          )}

          {/* New Password + Confirm for recovery */}
          {mode === 'update-password' && (
            <>
              <div className="form-group">
                <label htmlFor="auth-new-password">New Password</label>
                <div className="password-input-wrapper">
                  <input
                    id="auth-new-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                <span className="password-hint">
                  Must be at least 8 characters with a letter and a number.
                </span>
              </div>

              <div className="form-group">
                <label htmlFor="auth-confirm-new-password">Confirm New Password</label>
                <div className="password-input-wrapper">
                  <input
                    id="auth-confirm-new-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Re-type your new password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />
                </div>
              </div>
            </>
          )}

          <button type="submit" className="submit-auth-btn" disabled={loading}>
            {loading && 'Please wait...'}
            {!loading && mode === 'signup' && 'Create Account'}
            {!loading && mode === 'signin' && 'Sign In'}
            {!loading && mode === 'forgot' && 'Send Reset Link'}
            {!loading && mode === 'update-password' && 'Save New Password'}
          </button>
        </form>

        <div className="auth-switch">
          {mode === 'signup' && (
            <span>
              Already have an account?{' '}
              <button
                type="button"
                className="switch-link"
                onClick={() => switchMode('signin')}
              >
                Sign in
              </button>
            </span>
          )}

          {mode === 'signin' && (
            <span>
              Don't have an account?{' '}
              <button
                type="button"
                className="switch-link"
                onClick={() => switchMode('signup')}
              >
                Create one
              </button>
            </span>
          )}

          {mode === 'forgot' && (
            <span>
              Remembered your password?{' '}
              <button
                type="button"
                className="switch-link"
                onClick={() => switchMode('signin')}
              >
                Back to Sign in
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { isPasswordRecovery } = useAuth()

  if (!isOpen) return null

  return (
    <AuthModalContent
      key={isPasswordRecovery ? 'recovery' : 'normal'}
      onClose={onClose}
    />
  )
}
