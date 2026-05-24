'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Nav } from '@/components/nav'
import { useProgress } from '@/components/progress-provider'
import { buildQuestLog } from '@/lib/rpg/quest-log'
import { SKINS_META } from '@/lib/rpg/skins-meta'
import { CharacterStrip } from '@/components/rpg/character-strip'
import { WorldMap } from '@/components/rpg/world-map'
import { QuestFeed } from '@/components/rpg/quest-feed'
import wandererPack from '@/lib/rpg/skins/wanderer.json'
import type { SkinPack } from '@/lib/rpg/types'
import type { Locale, WorldSkin } from '@/lib/intake/types'
import { ShardBalance } from '@/components/cs/shard-balance'
import { Vault } from '@/components/cs/vault'

interface Props { modules: Record<string, { title: string; duration: string }>; locale: Locale }

export function DashboardClient({ modules, locale }: Props) {
  const router = useRouter()
  const { getState, loaded } = useProgress()
  const [profile, setProfile] = useState<any>(null)
  const [pack, setPack] = useState<SkinPack | null>(null)

  useEffect(() => {
    fetch('/api/intake/me', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(async p => {
        if (!p || p.status !== 'completed') { router.replace(locale === 'en' ? '/en/quest-intake/' : '/quest-intake/'); return }
        setProfile(p)
        try {
          const mod = await import(`@/lib/rpg/skins/${p.world_skin}.json`)
          setPack(mod.default as SkinPack)
        } catch { setPack(wandererPack as SkinPack) }
      })
      .catch(() => router.replace(locale === 'en' ? '/en/quest-intake/' : '/quest-intake/'))
  }, [router, locale])

  if (!profile || !loaded) return (<><Nav locale={locale} /><main style={{ maxWidth: 660, margin: '0 auto', padding: '4rem 1.5rem' }}><p style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>…</p></main></>)

  const accent = SKINS_META[profile.world_skin as keyof typeof SKINS_META]?.accent ?? 'var(--text-accent)'
  const glyph = SKINS_META[profile.world_skin as keyof typeof SKINS_META]?.glyph ?? '⬡'
  const completed = Object.keys(modules).filter(s => getState(s) === 'completed')
  const vm = buildQuestLog(profile, modules, completed, getState as any, pack, locale)

  return (
    <>
      <Nav locale={locale} />
      <main style={{ maxWidth: 660, margin: '0 auto', padding: '2.5rem 1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.75rem' }}>
          <ShardBalance accent={accent} />
        </div>
        <CharacterStrip summary={vm.summary} accent={accent} locale={locale} />
        <div style={{ margin: '1.5rem 0' }}><WorldMap zones={vm.zones} accent={accent} glyph={glyph} /></div>
        <QuestFeed zones={vm.zones} accent={accent} locale={locale} />
        <Vault activeSkin={profile.world_skin as WorldSkin} locale={locale} />
      </main>
    </>
  )
}
