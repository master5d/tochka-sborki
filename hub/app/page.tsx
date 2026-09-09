import type { Metadata } from 'next'
import { QuestHome } from '../components/quest/quest-home'
import { quest } from '../lib/quest/content'

export const metadata: Metadata = { title: quest.ru.seo.title, description: quest.ru.seo.description }

export default function Page() {
  return <QuestHome locale="ru" />
}
