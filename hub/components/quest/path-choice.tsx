'use client'
interface Props {
  /** Canon wording only — the road's own title (habit/detour), already on screen
   *  as the card's heading; this component adds no copy of its own. */
  label: string
  pressed: boolean
  onPress: () => void
}

/**
 * The road title doubles as the mark control: no invented "select this" copy,
 * `aria-pressed` carries the state to assistive tech, `all: unset` (themes/quest.css
 * `.quest-path-choice`) makes it inherit the heading's own font/colour so it reads
 * identically to the plain title it replaces. Pressed state shows as an underline
 * PLUS a colour change (never colour alone) — see the CSS rule.
 */
export function PathChoice({ label, pressed, onPress }: Props) {
  return (
    <button type="button" className="quest-path-choice" aria-pressed={pressed} onClick={onPress}>
      {label}
    </button>
  )
}
