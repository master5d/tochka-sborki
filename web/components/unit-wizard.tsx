'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { UnitWizardContext } from './unit-wizard-context'
import { useUnitProgress } from '@/lib/unit-progress'

const PHASE_COLORS = ['#00ff88', '#00aaff', '#ff9900', '#ff44aa']
const PHASE_LABELS = ['Активация', 'Рефлексия', 'Концепция', 'Практика']
const TOTAL_STEPS = 4

interface Props {
  moduleSlug: string
  unitSlug: string
  nextUnitSlug: string | null
  moduleTitle: string
  unitIndex: number
  totalUnits: number
  children: React.ReactNode
}

export function UnitWizard({
  moduleSlug,
  unitSlug,
  nextUnitSlug,
  moduleTitle,
  unitIndex,
  totalUnits,
  children,
}: Props) {
  const [currentStep, setCurrentStep] = useState(0)
  const [done, setDone] = useState(false)
  const { markCompleted } = useUnitProgress()
  const router = useRouter()

  function handleNext() {
    setCurrentStep(s => Math.min(s + 1, TOTAL_STEPS - 1))
  }

  function handleComplete() {
    markCompleted(moduleSlug, unitSlug)
    setDone(true)
  }

  function handleNextUnit() {
    if (nextUnitSlug) {
      router.push(`/lessons/${moduleSlug}/${nextUnitSlug}/`)
    } else {
      router.push(`/lessons/${moduleSlug}/`)
    }
  }

  return (
    <UnitWizardContext.Provider value={{ currentStep, totalSteps: TOTAL_STEPS }}>
      {/* Module + unit breadcrumb */}
      <div style={{
        marginBottom: '0.5rem',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.7rem',
        color: 'var(--text-secondary)',
      }}>
        {moduleTitle} · Unit {unitIndex + 1} из {totalUnits}
      </div>

      {/* Phase progress bar */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '2rem' }}>
        {PHASE_LABELS.map((label, i) => (
          <div key={i} style={{ flex: 1 }}>
            <div style={{
              height: '3px',
              background: i <= currentStep ? PHASE_COLORS[i] : 'var(--border-color)',
              borderRadius: '2px',
              marginBottom: '5px',
              transition: 'background 0.2s',
            }} />
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.6rem',
              color: i === currentStep ? PHASE_COLORS[i] : 'var(--text-secondary)',
              opacity: i > currentStep ? 0.4 : 1,
              transition: 'opacity 0.2s',
            }}>
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* Phase content (controlled by UnitWizardContext) */}
      <div style={{ minHeight: '40vh' }}>
        {children}
      </div>

      {/* Actions */}
      <div style={{
        marginTop: '2.5rem',
        paddingTop: '1.5rem',
        borderTop: '1px solid var(--border-color)',
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
        gap: '1rem',
      }}>
        {done ? (
          <>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.8rem',
              color: 'var(--text-accent)',
            }}>
              ● Пройдено
            </span>
            <button
              onClick={handleNextUnit}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'var(--text-accent)',
                color: '#000',
                fontWeight: 700,
                fontFamily: 'var(--font-mono)',
                fontSize: '0.8rem',
                border: 'none',
                borderRadius: 'var(--radius)',
                cursor: 'pointer',
              }}
            >
              {nextUnitSlug ? 'Следующий unit →' : 'Модуль завершён →'}
            </button>
          </>
        ) : currentStep < TOTAL_STEPS - 1 ? (
          <button
            onClick={handleNext}
            style={{
              padding: '0.75rem 1.5rem',
              background: PHASE_COLORS[currentStep],
              color: '#000',
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              fontSize: '0.8rem',
              border: 'none',
              borderRadius: 'var(--radius)',
              cursor: 'pointer',
            }}
          >
            Далее →
          </button>
        ) : (
          <button
            onClick={handleComplete}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'transparent',
              border: '1px solid var(--text-accent)',
              color: 'var(--text-accent)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.8rem',
              borderRadius: 'var(--radius)',
              cursor: 'pointer',
            }}
          >
            Отметить пройденным ✓
          </button>
        )}
      </div>
    </UnitWizardContext.Provider>
  )
}
