// web/lib/dungeon/build-dungeon.ts
import type { DungeonInput, DungeonView, StageTier } from './types'
import { NICHE_MODULE } from '@/lib/rpg/niche-map'
import { getAppliedChallenge, fillNicheSlots } from '@/lib/cs/applied-challenge'
import { FLAVOR_BANK } from './flavor-bank'

const TIERS: StageTier[] = ['task', 'process', 'outcome']
const FALLBACK_MODULE = '04-prompt-engineering'

export function buildDungeon(input: DungeonInput): DungeonView {
  const { locale, niche: rawNiche, outcome } = input
  const niche = rawNiche && FLAVOR_BANK[rawNiche] ? rawNiche : 'other'
  const module = NICHE_MODULE[niche] ?? FALLBACK_MODULE
  const flavor = FLAVOR_BANK[niche]
  const locked = !input.isModuleCompleted(module)

  const stages = TIERS.map((tier, i) => ({
    id: `dungeon:${niche}:s${i + 1}`,
    tier,
    body: getAppliedChallenge({ niche: rawNiche, outcome }, module, tier, locale) ?? '',
    cs: 15,
  }))

  const boss = {
    id: `dungeon:${niche}:boss`,
    name: flavor.bossName[locale],
    body: fillNicheSlots(flavor.bossChallenge[locale], rawNiche, outcome, locale),
    cs: 50,
  }

  return { niche, module, locked, dungeonName: flavor.dungeonName[locale], intro: flavor.intro[locale], stages, boss }
}
