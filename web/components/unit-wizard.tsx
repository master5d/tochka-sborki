'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { UnitWizardContext } from './unit-wizard-context'
import { useUnitProgress } from '@/lib/unit-progress'
import { getDictionary, type Locale } from '@/lib/dictionaries'
import { SKINS_META } from '@/lib/rpg/skins-meta'
import { getUnitFraming } from '@/lib/rpg/unit-framing'
import type { SkinPack, WorldSkin } from '@/lib/rpg/types'
import { useShards } from '@/lib/cs/use-shards'
import { usePacing } from '@/lib/pacing/use-pacing'
import { suggestModeFromCalibration } from '@/lib/pacing/suggest-mode'
import { MODE } from '@/lib/cs/modes'
import { getAppliedChallenge } from '@/lib/cs/applied-challenge'
import { buildLearnPrompt } from '@/lib/learn-prompt'
import { LearnWithAI } from '@/components/learn-with-ai'
import { ModeSelector } from '@/components/cs/mode-selector'
import { CycleComplete } from '@/components/cs/cycle-complete'
import type { Mode } from '@/lib/cs/types'
import { HelpTip } from '@/components/help/help-tip'
import { IntroCard } from '@/components/help/intro-card'

const PHASE_COLORS = ['var(--phase-1)', 'var(--phase-2)', 'var(--phase-3)', 'var(--phase-4)']
const TOTAL_STEPS = 4

interface Props {
  moduleSlug: string
  unitSlug: string
  nextUnitSlug: string | null
  moduleTitle: string
  unitIndex: number
  totalUnits: number
  locale?: Locale
  children: React.ReactNode
}

export function UnitWizard({
  moduleSlug,
  unitSlug,
  nextUnitSlug,
  moduleTitle,
  unitIndex,
  totalUnits,
  locale = 'ru',
  children,
}: Props) {
  const t = getDictionary(locale).wizard
  const PHASE_LABELS = t.phases
  const prefix = locale === 'en' ? '/en' : ''
  const [currentStep, setCurrentStep] = useState(0)
  const [done, setDone] = useState(false)
  const { markCompleted } = useUnitProgress()
  const router = useRouter()
  const topRef = useRef<HTMLDivElement>(null)

  const [skin, setSkin] = useState<WorldSkin | null>(null)
  const [pack, setPack] = useState<SkinPack | null>(null)
  const [niche, setNiche] = useState<string | null>(null)
  const [outcome, setOutcome] = useState<string | null>(null)

  const unitKey = `${moduleSlug}/${unitSlug}`
  const { award, setMode, getMode, ready: shardsReady } = useShards()
  const chosenMode: Mode | undefined = getMode(unitKey)
  const { state: pacingState, logCompletion: logPacing } = usePacing()

  useEffect(() => {
    fetch('/api/intake/me', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(async p => {
        if (!p?.world_skin) return
        setSkin(p.world_skin as WorldSkin)
        setNiche(p.niche ?? null)
        try {
          const ans = typeof p.answers === 'string' ? JSON.parse(p.answers) : p.answers
          const f3 = ans?.F3
          setOutcome(typeof f3 === 'string' ? f3 : null)
        } catch { setOutcome(null) }
        try {
          const mod = await import(`@/lib/rpg/skins/${p.world_skin}.json`)
          setPack(mod.default as SkinPack)
        } catch { setPack(null) }
      })
      .catch(() => {})
  }, [])

  const framing = getUnitFraming(pack, moduleSlug, unitSlug)
  const mentor = skin ? SKINS_META[skin]?.mentor : undefined
  const accent = skin ? (SKINS_META[skin]?.accent ?? 'var(--text-accent)') : 'var(--text-accent)'
  const suggestedMode = suggestModeFromCalibration(pacingState.lastCalibration?.rating) ?? undefined
  const challengeTier = chosenMode ? MODE[chosenMode].challengeTier : 'task'
  const hintVisible = chosenMode ? MODE[chosenMode].hintVisible : true
  const appliedChallenge = getAppliedChallenge({ niche, outcome }, moduleSlug, challengeTier, locale)

  const skinMeta = skin ? SKINS_META[skin] : undefined
  const learnPrompt = buildLearnPrompt({
    locale,
    moduleTitle,
    unitIndex,
    totalUnits,
    skinName: skinMeta?.displayName[locale] ?? null,
    mentorName: skinMeta?.mentor?.name[locale] ?? null,
    niche,
    outcome,
    mode: chosenMode ?? null,
    appliedChallenge: appliedChallenge ?? null,
  })

  function scrollToTop() {
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function handleNext() {
    setCurrentStep(s => Math.min(s + 1, TOTAL_STEPS - 1))
    scrollToTop()
  }

  function handleBack() {
    setCurrentStep(s => Math.max(s - 1, 0))
    scrollToTop()
  }

  function handleComplete() {
    markCompleted(moduleSlug, unitSlug)
    if (chosenMode) award(unitKey, chosenMode)
    logPacing(unitKey, chosenMode ?? 'commander')
    setDone(true)
  }

  function handleNextUnit() {
    if (nextUnitSlug) {
      router.push(`${prefix}/lessons/${moduleSlug}/${nextUnitSlug}/`)
    } else {
      router.push(`${prefix}/lessons/${moduleSlug}/`)
    }
  }

  return (
    <UnitWizardContext.Provider value={{ currentStep, totalSteps: TOTAL_STEPS, locale }}>
      {/* Module + unit breadcrumb */}
      <div ref={topRef} style={{
        scrollMarginTop: '4rem',
        marginBottom: '0.5rem',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.7rem',
        color: 'var(--text-secondary)',
      }}>
        {moduleTitle} · {t.unit(unitIndex + 1, totalUnits)}
      </div>

      <IntroCard page="unit" locale={locale} accent={accent} />

      {shardsReady && !done && !chosenMode && (
        <ModeSelector
          locale={locale}
          accent={accent}
          selected={chosenMode}
          onSelect={(m) => setMode(unitKey, m)}
          helpId="wizard-modes"
          suggested={suggestedMode}
        />
      )}

      {currentStep === 0 && framing?.intro && (
        <div style={{
          borderLeft: '3px solid var(--text-accent)',
          background: 'var(--bg-surface)',
          borderRadius: 8,
          padding: '0.9rem 1.1rem',
          margin: '0 0 1.5rem',
          fontStyle: 'italic',
          color: 'var(--text-primary)',
        }}>
          {framing.intro[locale]}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.25rem' }}>
        <HelpTip id="wizard-phases" locale={locale} align="right" />
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
        {currentStep === 3 && (
          <>
            {appliedChallenge && (
              <div style={{
                marginTop: '1.5rem',
                background: 'var(--bg-surface)',
                border: '1px dashed var(--text-accent)',
                borderRadius: 10,
                padding: '0.9rem 1.1rem',
              }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-accent)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.35rem' }}>
                  {t.appliedChallenge}
                </div>
                <div style={{ fontSize: '0.92rem' }}>{appliedChallenge}</div>
              </div>
            )}
            {hintVisible && framing?.mentorHint && mentor && (
              <div style={{
                display: 'flex',
                gap: '0.6rem',
                alignItems: 'flex-start',
                marginTop: '1.5rem',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                borderRadius: 10,
                padding: '0.9rem 1.1rem',
              }}>
                <span aria-hidden="true" style={{ fontSize: '1.3rem', lineHeight: 1 }}>{mentor.glyph}</span>
                <div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-accent)' }}>{mentor.name[locale]}</div>
                  <div style={{ fontSize: '0.9rem' }}>«{framing.mentorHint[locale]}»</div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {done && framing?.outro && (
        <div style={{
          borderLeft: '3px solid var(--text-accent)',
          background: 'var(--bg-surface)',
          borderRadius: 8,
          padding: '0.9rem 1.1rem',
          marginTop: '2rem',
          fontStyle: 'italic',
          color: 'var(--text-primary)',
        }}>
          {framing.outro[locale]}
        </div>
      )}

      {done && chosenMode && (
        <CycleComplete
          mode={chosenMode}
          locale={locale}
          accent={accent}
        />
      )}

      {/* Actions */}
      <div style={{
        marginTop: '2.5rem',
        paddingTop: '1.5rem',
        borderTop: '1px solid var(--border-color)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '1rem',
      }}>
        {!done && currentStep > 0 ? (
          <button
            onClick={handleBack}
            style={{
              padding: '0.75rem 1.25rem',
              background: 'transparent',
              border: '1px solid var(--border-color)',
              color: 'var(--text-secondary)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.8rem',
              borderRadius: 'var(--radius)',
              cursor: 'pointer',
            }}
          >
            {t.back}
          </button>
        ) : <span />}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {done ? (
          <>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.8rem',
              color: 'var(--text-accent)',
            }}>
              {t.done}
            </span>
            <button
              onClick={handleNextUnit}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'var(--text-accent)',
                color: 'var(--text-on-accent)',
                fontWeight: 700,
                fontFamily: 'var(--font-mono)',
                fontSize: '0.8rem',
                border: 'none',
                borderRadius: 'var(--radius)',
                cursor: 'pointer',
              }}
            >
              {nextUnitSlug ? t.nextUnit : t.moduleComplete}
            </button>
          </>
        ) : currentStep < TOTAL_STEPS - 1 ? (
          <button
            onClick={handleNext}
            style={{
              padding: '0.75rem 1.5rem',
              background: PHASE_COLORS[currentStep],
              color: 'var(--text-on-accent)',
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              fontSize: '0.8rem',
              border: 'none',
              borderRadius: 'var(--radius)',
              cursor: 'pointer',
            }}
          >
            {t.next}
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
            {t.complete}
          </button>
        )}
        </div>
      </div>

      <LearnWithAI prompt={learnPrompt} locale={locale} />
    </UnitWizardContext.Provider>
  )
}
