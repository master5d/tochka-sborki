'use client'

import React from 'react'

/** 
 * DesOps Hub Master Diagram - Option 1: THE CYBERNETIC ENGINE (Skeletal/Academic)
 * Inspired by: PaperBanana (NeurIPS skeletons), Tufte (Data Density).
 * Focus: Systemic connectivity and information flow.
 */
export function DesOpsEngineDiagram() {
  const accent = '#00d1ff'
  const text = '#e8e8f0'
  const border = 'rgba(255, 255, 255, 0.1)'
  
  return (
    <div style={{ margin: '3rem 0', padding: '3rem', background: '#0a0a0f', borderRadius: '4px', border: `1px solid ${border}`, backdropFilter: 'blur(20px)' }}>
      <svg viewBox="0 0 1000 600" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Central Core: THE META-DESIGNER KERNEL */}
        <circle cx="500" cy="300" r="80" stroke={accent} strokeWidth="1" strokeDasharray="8 4" />
        <circle cx="500" cy="300" r="15" fill={accent}>
          <animate attributeName="opacity" values="0.4;1;0.4" dur="3s" repeatCount="indefinite" />
        </circle>
        <text x="500" y="410" fill={accent} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="16" fontWeight="900" letterSpacing="0.3em">DESOPS HUB KERNEL</text>
        <text x="500" y="430" fill={text} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="10" opacity="0.6">SOVRN v3.3 ARCHITECTURE</text>

        {/* 3 Pillars (Harness Layers) */}
        {[0, 120, 240].map((angle, i) => {
          const rad = (angle - 90) * (Math.PI / 180)
          const x = 500 + Math.cos(rad) * 220
          const y = 300 + Math.sin(rad) * 220
          const labels = ["LAYER 1: SKILLS", "LAYER 2: CANVAS", "LAYER 3: THE EYE"]
          const items = [
            ["Reflection Audit", "Core Protocols", "UI UX Pro Max"],
            ["Onlook Production", "Paper HTML/CSS", "Pencil Vector"],
            ["Visual DNA", "Brand Injection", "DataViz Intelligence"]
          ]
          
          return (
            <g key={angle}>
              <line x1="500" y1="300" x2={x} y2={y} stroke={border} strokeWidth="1" />
              <rect x={x-80} y={y-30} width="160" height="60" rx="2" stroke={accent} strokeWidth="1" fill="rgba(0, 209, 255, 0.05)" />
              <text x={x} y={y+5} fill={accent} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="12" fontWeight="700">{labels[i]}</text>
              
              {/* Sub-items */}
              {items[i].map((item, j) => {
                const ix = x + (j - 1) * 120
                const iy = y + (i === 0 ? -80 : 80)
                return (
                  <g key={item} opacity="0.4">
                    <line x1={x} y1={y + (i === 0 ? -30 : 30)} x2={ix} y2={iy} stroke={border} strokeWidth="0.5" />
                    <text x={ix} y={iy} fill={text} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="8">{item}</text>
                  </g>
                )
              })}
            </g>
          )
        })}

        {/* Outer Ring: The Ethics & Standards (Self-Correction Loop) */}
        <circle cx="500" cy="300" r="320" stroke={border} strokeWidth="0.5" />
        <path d="M500 20 A280 280 0 0 1 780 300" stroke={accent} opacity="0.2" strokeWidth="2" strokeDasharray="10 10" />
        <text x="800" y="100" fill={accent} fontFamily="var(--font-mono)" fontSize="10" opacity="0.5">SELF-CORRECTION LOOP (Impeccable 3.5)</text>
        <text x="200" y="550" fill={accent} fontFamily="var(--font-mono)" fontSize="10" opacity="0.5">THE NEW QUOTIENT (Magical Logic)</text>
        
        {/* Connection Mesh */}
        <path d="M200 300 Q500 100 800 300" stroke={accent} opacity="0.05" />
        <path d="M200 300 Q500 500 800 300" stroke={accent} opacity="0.05" />
      </svg>
      <div style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: accent, letterSpacing: '0.2em', marginTop: '2rem' }}>
        OPTION A // SYSTEMIC INTELLIGENCE ENGINE
      </div>
    </div>
  )
}

/** 
 * DesOps Hub Master Diagram - Option 2: THE SOVEREIGN FACTORY (Process Flow)
 * Inspired by: huashu-design (Protocols), Onlook (Code-is-Design).
 * Focus: The "Zero-GUI" linear production chain.
 */
export function DesOpsFactoryDiagram() {
  const accent = '#00ff88' // Slight shift to emphasize "Action/Production"
  const text = '#e8e8f0'
  const border = 'rgba(255, 255, 255, 0.1)'

  const steps = [
    { id: "01", name: "INGEST", desc: "Fact Verification & Core Asset Protocol" },
    { id: "02", name: "SCHEMA", desc: "DESIGN.md Rationale & Cognitive Mapping" },
    { id: "03", name: "GENERATE", desc: "Agent Teams (Pencil/Stitch/Open-Design)" },
    { id: "04", name: "REFINE", desc: "Onlook Visual Production (AST Edits)" },
    { id: "05", name: "AUDIT", desc: "Reflection Loop & Impeccable Verify" }
  ]

  return (
    <div style={{ margin: '3rem 0', padding: '3rem', background: '#0a0f0d', borderRadius: '4px', border: `1px solid ${border}`, backdropFilter: 'blur(20px)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {steps.map((step, i) => (
          <div key={step.id} style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
            <div style={{ width: '4rem', height: '4rem', border: `1px solid ${accent}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', color: accent, fontSize: '1.5rem', fontWeight: 900 }}>
              {step.id}
            </div>
            <div style={{ flex: 1, padding: '1.5rem', border: `1px solid ${border}`, background: 'rgba(255,255,255,0.02)' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 900, textTransform: 'uppercase', color: text, marginBottom: '0.25rem' }}>{step.name}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: text, opacity: 0.6 }}>{step.desc}</div>
            </div>
            {i < steps.length - 1 && (
              <div style={{ height: '2rem', width: '1px', background: accent, opacity: 0.3, margin: '0.5rem 0' }} />
            )}
          </div>
        ))}
      </div>
      <div style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: accent, letterSpacing: '0.2em', marginTop: '3rem' }}>
        OPTION B // THE PRODUCTION PIPELINE (ZERO-GUI)
      </div>
    </div>
  )
}

/** 
 * DesOps Hub Master Diagram - Option 3: THE DESOPS CONSTELLATION (Holistic)
 * Inspired by: Ward Shelley, Constellation mapping.
 * Focus: High-density ecosystem nodes.
 */
export function DesOpsConstellation() {
  const accent = '#00d1ff'
  return (
    <div style={{ margin: '3rem 0', padding: '3rem', background: '#050508', borderRadius: '4px', border: '1px solid rgba(0, 209, 255, 0.1)', position: 'relative', overflow: 'hidden' }}>
      {/* Background Star-field (Data Density) */}
      <div style={{ position: 'absolute', inset: 0, opacity: 0.1, backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      
      <div style={{ position: 'relative', height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '120px', height: '120px', borderRadius: '50%', border: `2px solid ${accent}`, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '1rem', background: '#0a0a0f', zIndex: 10 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '0.8rem', color: '#fff' }}>DESOPS HUB MASTER</div>
        </div>
        
        {/* Orbital Nodes */}
        {['ORCHESTRATION', 'INTELLIGENCE', 'PRODUCTION', 'ETHICS', 'SOVEREIGNTY'].map((node, i) => {
          const angle = (i * 72) * (Math.PI / 180)
          const x = Math.cos(angle) * 160
          const y = Math.sin(angle) * 160
          return (
            <div key={node} style={{ 
              position: 'absolute', 
              transform: `translate(${x}px, ${y}px)`,
              padding: '0.5rem 1rem',
              border: '1px solid rgba(255,255,255,0.2)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.7rem',
              background: 'rgba(10, 10, 15, 0.9)',
              color: accent,
              letterSpacing: '0.1em'
            }}>
              {node}
            </div>
          )
        })}
        
        {/* Connecting Paths */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
          {[0, 72, 144, 216, 288].map(angle => (
            <line key={angle} x1="50%" y1="50%" x2={`${50 + 16 * Math.cos(angle * Math.PI / 180)}%`} y2={`${50 + 16 * Math.sin(angle * Math.PI / 180)}%`} stroke={accent} opacity="0.3" />
          ))}
        </svg>
      </div>

      <div style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: accent, letterSpacing: '0.2em', marginTop: '1rem' }}>
        OPTION C // THE ECOSYSTEM CONSTELLATION
      </div>
    </div>
  )
}
