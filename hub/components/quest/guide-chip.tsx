import type { Guide } from '../../lib/quest/content'
import { GUIDE_ASSETS } from '../../lib/quest/scenes'

interface Props { guide: Guide; label: string }

export function GuideChip({ guide, label }: Props) {
  return (
    <span className="quest-chip">
      <img src={GUIDE_ASSETS[guide]} alt="" width={40} height={40} loading="lazy" />
      {label}
    </span>
  )
}
