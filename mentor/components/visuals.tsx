'use client'

import React from 'react'

/** 
 * High-Density Observability Graph for the Mentor Hero.
 * Built using DesOps Hub standards: Tufte + RAWGraphs logic.
 * Represents Agentic Performance.
 */
export function HeroObservability() {
  const accent = '#00d1ff'
  const text = 'rgba(255, 255, 255, 0.4)'
  const border = 'rgba(0, 209, 255, 0.1)'
  
  return (
    <div style={{ padding: '2rem', border: `1px solid ${border}`, background: 'rgba(0,0,0,0.2)', borderRadius: '4px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: '1rem', left: '1.5rem', fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: accent, letterSpacing: '0.1em' }}>
        STATUS: MONITORING AGENTIC_FLOW
      </div>
      <svg viewBox="0 0 400 200" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Grid lines */}
        {[0, 50, 100, 150].map(y => (
          <line key={y} x1="0" y1={y} x2="400" y2={y} stroke={border} strokeWidth="0.5" />
        ))}
        
        {/* The Wave (Performance Pulse) */}
        <path d="M0 150 Q50 150 100 80 T200 120 T300 40 T400 90" stroke={accent} strokeWidth="1.5" />
        <path d="M0 150 Q50 150 100 80 T200 120 T300 40 T400 90 V200 H0 Z" fill={accent} opacity="0.05" />
        
        {/* Activity Nodes */}
        <circle cx="100" cy="80" r="3" fill={accent} />
        <circle cx="300" cy="40" r="3" fill={accent} />
        
        {/* Legend */}
        <text x="350" y="190" fill={text} fontFamily="var(--font-mono)" fontSize="8">LOAD: 1.0</text>
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
        {['NODE_01', 'NODE_02', 'ORCHESTRATOR', 'RECOVERY'].map(node => (
          <div key={node} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', color: text }}>{node}: OK</div>
        ))}
      </div>
    </div>
  )
}
