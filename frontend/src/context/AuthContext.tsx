import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { Profile, ProfileUpdate } from '../types/profile'
import { AuthContext } from './authContextDef'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:8000'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(false)
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(() => {
    return typeof window !== 'undefined' && window.location.hash.includes('type=recovery')
  })

  // Invalidates out-of-order profile responses and prevents the startup
  // getSession() call and INITIAL_SESSION event from fetching twice.
  const profileRequestRef = useRef(0)
  const lastProfileTokenRef = useRef<string | null>(null)

  const loadProfile = useCallback(async (accessToken: string, userId: string) => {
    const requestId = ++profileRequestRef.current
    setProfileLoading(true)

    // Never render a profile belonging to a different account.
    setProfile((current) => (current && current.id === userId ? current : null))

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/auth/profile`, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      })
      if (requestId !== profileRequestRef.current) return

      if (res.ok) {
        const data: Profile = await res.json()
        if (requestId !== profileRequestRef.current) return
        setProfile(data)
      } else {
        setProfile(null)
      }
    } catch (err) {
      if (requestId === profileRequestRef.current) {
        console.warn('Could not load profile from backend:', err)
        setProfile(null)
      }
    } finally {
      if (requestId === profileRequestRef.current) {
        setProfileLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    // 1. Restore an existing session on load.
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)

      if (session?.access_token) {
        // INITIAL_SESSION may have already handled this same token.
        if (lastProfileTokenRef.current !== session.access_token) {
          lastProfileTokenRef.current = session.access_token
          loadProfile(session.access_token, session.user.id)
        }
      }
      setLoading(false)
    })

    // 2. React to sign-in, sign-out, token refresh, etc.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, currentSession) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsPasswordRecovery(true)
      }
      setSession(currentSession)
      setUser(currentSession?.user ?? null)

      if (currentSession?.access_token) {
        const alreadyHandled =
          event === 'INITIAL_SESSION' &&
          lastProfileTokenRef.current === currentSession.access_token

        if (!alreadyHandled) {
          lastProfileTokenRef.current = currentSession.access_token
          loadProfile(currentSession.access_token, currentSession.user.id)
        }
      } else {
        // Invalidate any in-flight request so it cannot repopulate the profile.
        profileRequestRef.current += 1
        lastProfileTokenRef.current = null
        setProfile(null)
        setProfileLoading(false)
      }
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [loadProfile])

  const signInWithPassword = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }

  const signUpWithPassword = async (
    email: string,
    password: string,
    displayName?: string,
    fullName?: string
  ) => {
    const metadata: Record<string, string> = {}
    if (displayName) metadata.display_name = displayName
    if (fullName) metadata.full_name = fullName
    if (!metadata.display_name && fullName) metadata.display_name = fullName

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: Object.keys(metadata).length > 0 ? metadata : undefined
      }
    })
    return { error, user: data.user }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    profileRequestRef.current += 1
    lastProfileTokenRef.current = null
    setProfile(null)
    setProfileLoading(false)
  }

  const refreshProfile = async () => {
    if (session?.access_token) {
      await loadProfile(session.access_token, session.user.id)
    }
  }

  const updateProfile = async (updates: ProfileUpdate) => {
    if (!session?.access_token) {
      return { error: 'Not authenticated', profile: null }
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify(updates)
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        return {
          error: errorData.detail || `Server error (${res.status})`,
          profile: null
        }
      }

      const updatedProfile: Profile = await res.json()
      // A profile read may still be in flight; make sure it cannot overwrite
      // the freshly saved values with a stale response.
      profileRequestRef.current += 1
      setProfile(updatedProfile)
      setProfileLoading(false)
      return { error: null, profile: updatedProfile }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Network error'
      return { error: message, profile: null }
    }
  }

  const uploadAvatar = async (file: File) => {
    if (!user) {
      return { error: 'You must be signed in to upload a profile picture.', url: null }
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    const ext = file.name.split('.').pop()?.toLowerCase() || ''
    const allowedExts = ['jpg', 'jpeg', 'png', 'webp', 'gif']

    if (!allowedTypes.includes(file.type) || !allowedExts.includes(ext)) {
      return { error: 'Please choose a valid image file (JPG, PNG, WEBP, or GIF).', url: null }
    }

    if (file.size > 4 * 1024 * 1024) {
      return { error: 'Image file size must be under 4MB.', url: null }
    }

    try {
      const filePath = `${user.id}/avatar-${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true })

      if (uploadError) {
        return { error: uploadError.message, url: null }
      }

      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      return { error: null, url: publicUrlData.publicUrl }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to upload photo'
      return { error: message, url: null }
    }
  }

  const resetPasswordForEmail = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: typeof window !== 'undefined' ? `${window.location.origin}` : undefined
    })
    return { error }
  }

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    })
    if (!error) {
      setIsPasswordRecovery(false)
    }
    return { error }
  }

  const clearPasswordRecovery = () => {
    setIsPasswordRecovery(false)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        profileLoading,
        signInWithPassword,
        signUpWithPassword,
        signOut,
        refreshProfile,
        updateProfile,
        uploadAvatar,
        resetPasswordForEmail,
        updatePassword,
        isPasswordRecovery,
        clearPasswordRecovery
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
