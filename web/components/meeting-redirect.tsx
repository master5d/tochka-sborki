'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUnitProgress } from '@/lib/unit-progress'

interface Props {
  meetingSlug: string
  units: { slug: string; title: string }[]
}

export function MeetingRedirect({ meetingSlug, units }: Props) {
  const router = useRouter()
  const { isCompleted, ready } = useUnitProgress()

  useEffect(() => {
    if (!ready) return
    const firstIncomplete = units.find(u => !isCompleted(meetingSlug, u.slug))
    const target = firstIncomplete ?? units[0]
    router.replace(`/lessons/${meetingSlug}/${target.slug}/`)
  }, [ready, meetingSlug, units, isCompleted, router])

  return null
}
