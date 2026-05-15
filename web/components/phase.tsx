'use client'

import { useUnitWizard } from './unit-wizard-context'

const PHASE_ORDER = ['activation', 'reflection', 'concept', 'practice'] as const
type PhaseType = (typeof PHASE_ORDER)[number]

const PHASE_META: Record<PhaseType, { label: string; icon: string; color: string }> = {
  activation: { label: 'Активация', icon: '⚡', color: '#00ff88' },
  reflection: { label: 'Рефлексия', icon: '👁', color: '#00aaff' },
  concept: { label: 'Концепция', icon: '💡', color: '#ff9900' },
  practice: { label: 'Практика', icon: '🛠', color: '#ff44aa' },
}

interface Props {
  type: PhaseType
  children: React.ReactNode
}

export function Phase({ type, children }: Props) {
  const { currentStep } = useUnitWizard()
  const stepIndex = PHASE_ORDER.indexOf(type)

  if (stepIndex !== currentStep) return null

  const { label, icon, color } = PHASE_META[type]

  return (
    <div>
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        background: `${color}18`,
        borderLeft: `3px solid ${color}`,
        padding: '4px 14px',
        borderRadius: '0 4px 4px 0',
        marginBottom: '1.5rem',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.65rem',
        color,
        textTransform: 'uppercase' as const,
        letterSpacing: '0.12em',
      }}>
        {icon} {label}
      </div>
      <div>{children}</div>
    </div>
  )
}
