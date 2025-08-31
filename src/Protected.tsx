import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

export default function ProtectedRoute({ children }: { children: JSX.Element }) {
  const [checking, setChecking] = useState(true)
  const [authed, setAuthed] = useState(false)

  useEffect(() => {
    let mounted = true
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      setAuthed(!!data.session)
      setChecking(false)
    })
    return () => { mounted = false }
  }, [])

  if (checking) return null // or a spinner
  if (!authed) return <Navigate to="/" replace />
  return children
}
