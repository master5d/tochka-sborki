'use client'

import React from 'react'

/** 
 * Publication-ready diagrams for the Prologue manifesto.
 * Built using DesOps Hub standards: PaperBanana + Google-grade Agentic Patterns.
 * Aesthetics: Cyber Blue, Glassmorphism, 1px lines, data-dense.
 */

type ThemeProps = {
  accent: string
  text: string
  bg: string
  border: string
}

const theme: ThemeProps = {
  accent: '#00d1ff',
  text: '#e8e8f0',
  bg: 'rgba(10, 10, 15, 0.85)',
  border: 'rgba(255, 255, 255, 0.1)'
}

/** 1. The Mirror Paradox (Opening/Act III) */
export function MirrorParadox() {
  return (
    <div style={{ margin: '3rem 0', padding: '2rem', background: theme.bg, borderRadius: '4px', border: `1px solid ${theme.border}`, backdropFilter: 'blur(12px)' }}>
      <svg viewBox="0 0 800 400" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Central Axis (The AI Mirror) */}
        <line x1="400" y1="50" x2="400" y2="350" stroke={theme.accent} strokeWidth="1" strokeDasharray="4 4" />
        <text x="400" y="30" fill={theme.accent} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="10" letterSpacing="0.2em">THE AI MIRROR</text>
        
        {/* Left Side: Splitting */}
        <g opacity="0.6">
          <circle cx="200" cy="200" r="40" stroke={theme.text} strokeWidth="0.5" strokeDasharray="2 2" />
          <path d="M180 180 L220 220 M220 180 L180 220" stroke="#ff4d4d" strokeWidth="1" />
          <text x="200" y="260" fill={theme.text} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="12">SPLITTING / FEAR</text>
        </g>
        
        {/* Right Side: Accelerated Chaos */}
        <g>
          <path d="M500 150 L700 150 M500 200 L750 200 M500 250 L650 250" stroke="#ff4d4d" strokeWidth="1" opacity="0.4" />
          <path d="M550 120 L580 180 L520 180 Z" fill="#ff4d4d" opacity="0.2" />
          <text x="600" y="260" fill={theme.text} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="12">ACCELERATED CHAOS</text>
        </g>

        {/* Reflection Flow (Chaos) */}
        <path d="M300 200 Q400 200 500 200" stroke="#ff4d4d" strokeWidth="1" markerEnd="url(#arrow-red)" />
        
        {/* Bottom: Integrity Path */}
        <g transform="translate(0, 100)">
          <circle cx="200" cy="180" r="40" stroke={theme.accent} strokeWidth="1" />
          <circle cx="200" cy="180" r="10" fill={theme.accent} />
          <text x="200" y="240" fill={theme.text} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="12">INTEGRITY / VOICE</text>
          
          <path d="M500 180 L700 180" stroke={theme.accent} strokeWidth="2" />
          <path d="M500 160 L700 160 M500 200 L700 200" stroke={theme.accent} strokeWidth="0.5" opacity="0.3" />
          <text x="600" y="240" fill={theme.text} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="12">EXTENDED PRESENCE</text>
          
          <path d="M300 180 Q400 180 500 180" stroke={theme.accent} strokeWidth="1" markerEnd="url(#arrow-blue)" />
        </g>

        <defs>
          <marker id="arrow-blue" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
            <path d="M0,0 L10,5 L0,10 Z" fill={theme.accent} />
          </marker>
          <marker id="arrow-red" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
            <path d="M0,0 L10,5 L0,10 Z" fill="#ff4d4d" />
          </marker>
        </defs>
      </svg>
      <div style={{ marginTop: '1rem', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
        Fig 1.0 // The Reflective Scaling Pattern
      </div>
    </div>
  )
}

/** 2. The Great Transition (Act I) */
export function PhaseShiftDiagram() {
  return (
    <div style={{ margin: '3rem 0', padding: '2rem', background: theme.bg, borderRadius: '4px', border: `1px solid ${theme.border}`, backdropFilter: 'blur(12px)' }}>
      <svg viewBox="0 0 800 450" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Liquid State (Old World) */}
        <rect x="50" y="100" width="300" height="250" rx="4" stroke={theme.border} strokeWidth="1" />
        <text x="200" y="80" fill={theme.text} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="10" letterSpacing="0.1em">PHASE: LIQUID (STABILITY)</text>
        <g opacity="0.4">
          <text x="200" y="150" fill={theme.text} textAnchor="middle" fontSize="12">Institutions: Meaning Holders</text>
          <text x="200" y="200" fill={theme.text} textAnchor="middle" fontSize="12">Map == Terrain</text>
          <text x="200" y="250" fill={theme.text} textAnchor="middle" fontSize="12">Goal: Survival (How?)</text>
        </g>

        {/* Transition Axis */}
        <path d="M350 225 L450 225" stroke={theme.accent} strokeWidth="1" markerEnd="url(#arrow-blue)" />
        <text x="400" y="210" fill={theme.accent} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="9">TRANSITION</text>

        {/* Gas State (New World) */}
        <rect x="450" y="100" width="300" height="250" rx="4" stroke={theme.accent} strokeWidth="1" />
        <text x="600" y="80" fill={theme.accent} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="10" letterSpacing="0.1em">PHASE: GAS (PHASE SHIFT)</text>
        <g>
          <text x="600" y="150" fill={theme.text} textAnchor="middle" fontSize="12">Institutions: Empty Shells</text>
          <text x="600" y="200" fill={theme.text} textAnchor="middle" fontSize="12">Map Fragmented</text>
          <text x="600" y="250" fill={theme.text} textAnchor="middle" fontSize="12" fontWeight="700">Goal: Meaning (Why?)</text>
        </g>
        
        {/* Turbulence particles */}
        {[...Array(20)].map((_, i) => (
          <circle key={i} cx={450 + Math.random() * 300} cy={100 + Math.random() * 250} r="1" fill={theme.accent} opacity={Math.random()} />
        ))}

        <defs>
          <marker id="arrow-blue" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
            <path d="M0,0 L10,5 L0,10 Z" fill={theme.accent} />
          </marker>
        </defs>
      </svg>
      <div style={{ marginTop: '1rem', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
        Fig 2.0 // Civilizational Phase Shift Axes
      </div>
    </div>
  )
}

/** 3. The Two Curves (Act II) */
export function IntelligenceCurves() {
  return (
    <div style={{ margin: '3rem 0', padding: '2rem', background: theme.bg, borderRadius: '4px', border: `1px solid ${theme.border}`, backdropFilter: 'blur(12px)' }}>
      <svg viewBox="0 0 800 400" fill="none" xmlns="http://www.w3.org/2000/svg">
        <line x1="100" y1="350" x2="700" y2="350" stroke={theme.border} />
        <line x1="100" y1="350" x2="100" y2="50" stroke={theme.border} />
        <text x="400" y="380" fill={theme.text} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="10">TIME / PROGRESS</text>
        <text x="80" y="200" fill={theme.text} textAnchor="middle" transform="rotate(-90 80 200)" fontFamily="var(--font-mono)" fontSize="10">INTELLIGENCE / COST</text>

        {/* Centralized AI S-Curve */}
        <path d="M100 300 Q200 300 300 200 T700 150" stroke={theme.text} strokeWidth="1" opacity="0.3" />
        <text x="600" y="140" fill={theme.text} opacity="0.5" fontFamily="var(--font-mono)" fontSize="10">CENTRALIZED MONOLITH (PLATEAU)</text>

        {/* Local Node Exponential Curve */}
        <path d="M100 340 Q300 340 500 250 T700 50" stroke={theme.accent} strokeWidth="2" />
        <text x="600" y="40" fill={theme.accent} fontFamily="var(--font-mono)" fontSize="10">SOVEREIGN NODES (EXPONENTIAL)</text>

        {/* Intersection */}
        <circle cx="530" cy="215" r="5" fill={theme.accent} />
        <text x="545" y="220" fill={theme.accent} fontFamily="var(--font-mono)" fontSize="12" fontWeight="700">THE ASSEMBLY POINT</text>
      </svg>
      <div style={{ marginTop: '1rem', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
        Fig 3.0 // The Intersection of Intelligence Economics
      </div>
    </div>
  )
}

/** 4. The Sovereignty Formula (Assembly) */
export function SovereigntyFormula() {
  return (
    <div style={{ margin: '3rem 0', padding: '2rem', background: theme.bg, borderRadius: '4px', border: `1px solid ${theme.border}`, backdropFilter: 'blur(12px)' }}>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>EXTERNAL</div>
          <div style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '4px' }}>PHASE SHIFT</div>
        </div>
        <div style={{ fontSize: '1.5rem', color: theme.accent }}>+</div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>TECHNOLOGICAL</div>
          <div style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '4px' }}>PERSONAL NODE</div>
        </div>
        <div style={{ fontSize: '1.5rem', color: theme.accent }}>+</div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>INTERNAL</div>
          <div style={{ padding: '1rem', border: `1px solid ${theme.accent}`, borderRadius: '4px', background: 'rgba(0, 209, 255, 0.1)' }}>INTEGRITY</div>
        </div>
        <div style={{ fontSize: '1.5rem', color: theme.accent }}>=</div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>RESULT</div>
          <div style={{ padding: '1rem 2rem', background: theme.accent, color: '#000', fontWeight: 900, borderRadius: '4px' }}>SOVEREIGNTY</div>
        </div>
      </div>
      <div style={{ marginTop: '2rem', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
        Fig 4.0 // The Sovereign Practice Formula
      </div>
    </div>
  )
}
