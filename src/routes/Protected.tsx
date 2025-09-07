import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

export default function ProtectedRoute({ children }: { children: JSX.Element }) {
  const [checking, setChecking] = useState(true)
  const [authed, setAuthed] = useState(false)

  useEffect(() => {
    let mounted = true
    supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted) return
      // If there's an error (like invalid refresh token), treat as unauthenticated
      if (error) {
        setAuthed(false)
      } else {
        setAuthed(!!data.session)
      }
      setChecking(false)
    }).catch(() => {
      // Handle any unexpected errors during session retrieval
      if (!mounted) return
      setAuthed(false)
      setChecking(false)
    })
    return () => { mounted = false }
  }, [])

  if (checking) return null // or a spinner
  if (!authed) return <Navigate to="/" replace />
  return children
}
