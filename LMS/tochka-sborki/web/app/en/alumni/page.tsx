import type { Metadata } from 'next'
import { AlumniClient } from '@/components/alumni-client'

export const metadata: Metadata = {
  title: 'Alumni — Tochka Sborki',
  description: 'An opt-in directory of fellow learners by field.',
  robots: { index: false, follow: false },
}

export default function Page() {
  return <AlumniClient locale="en" />
}
