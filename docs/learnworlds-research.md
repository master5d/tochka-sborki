# LearnWorlds innovations — research & gap analysis

**Ticket:** `fb_ac57d81228f0` (idea, area lms, impact 7) — absorb LearnWorlds innovations for the LMS architecture.
**Date:** 2026-06-17
**Method:** feature-set review of LearnWorlds (2026) + gap analysis against our LMS (`LMS/tochka-sborki/web`).

## What LearnWorlds is known for (2026)

1. **Interactive video** — flagship differentiator. In-video quizzes, clickable CTAs/buttons, forms, AI-generated subtitles/transcripts. Marketed as "3× engagement."
2. **AI course assistant** — generates course outlines, quizzes, text content; content revitalization. On all plans.
3. **No-code drag-drop course builder** — unlimited courses, structured programs/learning paths.
4. **Gamification** — points, badges, leaderboards, gamified in-course questions.
5. **Community / social learning** — built-in cohort/community spaces.
6. **Marketing & sales suite** — landing pages, funnels, checkout, affiliates, drip content.
7. **White-label mobile app**, advanced analytics, assessments/certificates, SCORM, accessibility.

Sources: [learnworlds.com/product/features/interactive-video](https://www.learnworlds.com/product/features/interactive-video/) · [learnworlds.com/ai](https://www.learnworlds.com/ai/) · [LearningRevolution review 2026](https://www.learningrevolution.net/learnworlds-review/)

## Gap analysis vs «Точка Сборки» LMS

| LearnWorlds | Our LMS | Verdict |
|---|---|---|
| Gamification (points/badges/leaderboards) | **RPG layer** — skins, mentors, companions, Cognitive Shards, dungeons, daily quests | ✅ We go **deeper** |
| Learning paths / programs | Roadmap (Vibe Coder→AI Generalist) + electable topics + syllabus tree | ✅ Have |
| AI assistant (learner-facing) | **learn-with-AI** handoff to the learner's *own* AI + companion charter | ✅ Have, **sovereign** (no vendor lock) |
| Certificates | `/certificate` | ✅ Have |
| Personalized paths | Intake → profile → personalized framing/skins | ✅ Have |
| Analytics | Plausible + feedback-loop board | ✅ Have (privacy-first) |
| Mobile app | **PWA** (installable) | ✅ Covered |
| **Interactive video** | Showcase videos, but **no in-video interaction** | ⚠️ **Gap** |
| AI-assisted *authoring* | Hand-authored MDX | ⚠️ Gap (author-side) |
| Graded quizzes / assessments | Reflection-based (Kolb + bisociation, **deliberately no "test/write"**) | ❌ Philosophy mismatch |
| Community / cohort | Feedback loop only; no peer community | ⚠️ Gap (→ alumni ticket) |
| Drip-locking, funnels/checkout | Self-paced, all-open, free | ❌ Intentional difference |

## Recommendations (prioritized for a sovereign, free, non-techie-creator course)

**Adopt — high:**
- **Lightweight interactive video.** LearnWorlds' strongest idea. Don't build their heavy overlay editor; add the cheap 80%: timestamped **chapters** + an **end-of-video reflection/checkpoint** (mental, bisociative — fits our pedagogy) on showcase/lesson videos. Closest engagement win that respects our reflection-first approach.

**Adopt — medium (author-side, not learner-facing):**
- **AI-assisted authoring.** Use AI to draft unit outlines, `_meta.json`, and showcase/materials copy. We already lean into AI; this speeds content without changing the learner experience. Pairs with `LMS/_template/`.

**Skip — philosophy mismatch (do NOT adopt):**
- **Graded quizzes / assessments** and **drip-locking.** They conflict with our intentional design: reflection phases forbid "write/test/type" verbs (drift-guard test enforces this), and the course is all-open + self-paced by design. Adopting these would regress the pedagogy.

**Defer — overlaps existing tickets:**
- **Community / cohort / social learning** → folds into `fb_7fdd9f89` (post-course group project + alumni matching).
- **Mobile app** → already covered by the PWA.

## Net takeaway
Our LMS already **matches or exceeds** LearnWorlds on gamification, AI assistance (sovereignly), paths, certificates, personalization, and mobile. The one genuinely-worth-stealing innovation is **interactive video** — adopt it in a lightweight, reflection-compatible form. AI-assisted authoring is a smaller internal win. The rest either exists, overlaps open tickets, or conflicts with the course's deliberate reflection-first, all-open philosophy.

Follow-up to file if pursued: a spec for lightweight interactive-video chapters + end-of-video reflection checkpoint.
