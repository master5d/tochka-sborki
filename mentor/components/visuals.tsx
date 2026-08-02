'use client'

import React from 'react'

/**
 * Панель обсервабилити в hero.
 *
 * ⚠️ История: компонент был написан только под тёмную тему — цвета зашиты
 * константами (`rgba(255,255,255,0.4)`, `#00d1ff`, `rgba(0,0,0,0.2)`).
 * На светлой теме белый текст по светлому фону давал контраст 1.0–1.15,
 * то есть подписи были физически невидимы; сама панель переполняла вьюпорт
 * на +139px и добавляла странице горизонтальный скролл.
 * Теперь цвета берутся из токен-слоя, а ширина — из контейнера.
 */
export function HeroObservability() {
  return (
    <div
      style={{
        padding: '1.25rem',
        border: '1px solid var(--border-color)',
        background: 'var(--bg-surface)',
        borderRadius: 'var(--radius)',
        position: 'relative',
        overflow: 'hidden',
        // Без max-width/box-sizing SVG растягивал родителя за край экрана.
        maxWidth: '100%',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--text-xs)',
          color: 'var(--text-accent)',
          letterSpacing: '0.04em',
          marginBottom: '0.75rem',
          // строка mono с трекингом шире панели → перенос вместо выпирания
          overflowWrap: 'anywhere',
        }}
      >
        STATUS: MONITORING AGENTIC_FLOW
      </div>

      <svg
        viewBox="0 0 400 200"
        fill="none"
        role="img"
        aria-label="Схема мониторинга агентного потока"
        preserveAspectRatio="xMidYMid meet"
        style={{ width: '100%', height: 'auto', display: 'block' }}
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Сетка */}
        {[0, 50, 100, 150].map((y) => (
          <line key={y} x1="0" y1={y} x2="400" y2={y} stroke="var(--border-color)" strokeWidth="0.5" />
        ))}

        {/* Кривая нагрузки */}
        <path d="M0 150 Q50 150 100 80 T200 120 T300 40 T400 90" stroke="var(--text-accent)" strokeWidth="1.5" />
        <path
          d="M0 150 Q50 150 100 80 T200 120 T300 40 T400 90 V200 H0 Z"
          fill="var(--text-accent)"
          opacity="0.07"
        />

        {/* Узлы активности */}
        <circle cx="100" cy="80" r="3" fill="var(--text-accent)" />
        <circle cx="300" cy="40" r="3" fill="var(--text-accent)" />
      </svg>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.75rem',
          justifyContent: 'space-between',
          marginTop: '1rem',
        }}
      >
        {['NODE_01', 'NODE_02', 'ORCHESTRATOR', 'RECOVERY'].map((node) => (
          <div
            key={node}
            style={{
              fontFamily: 'var(--font-mono)',
              // было 0.55rem (8.8px) — ниже читаемого минимума
              fontSize: 'var(--text-xs)',
              color: 'var(--text-secondary)',
            }}
          >
            {node}: OK
          </div>
        ))}
      </div>
    </div>
  )
}
