'use client'

import { useEffect, useState } from 'react'

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const [authed, setAuthed] = useState(false)

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then(res => {
        if (res.ok) {
          setAuthed(true)
        } else {
          const redirect = encodeURIComponent(window.location.pathname)
          window.location.replace(`/login/?redirect=${redirect}`)
        }
      })
      .catch(() => {
        window.location.replace('/login/')
      })
  }, [])

  if (!authed) return null

  return <>{children}</>
}
