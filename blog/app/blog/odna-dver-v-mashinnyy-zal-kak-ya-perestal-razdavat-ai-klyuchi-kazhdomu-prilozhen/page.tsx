import type { Metadata } from 'next'
import { PublishedMarkdownPost } from '@/components/blog/published-markdown-post'
import { PostLayout } from '@/components/blog/post-layout'
import { getPost } from '@/lib/posts'

const title = 'Одна дверь в машинный зал: как я перестал раздавать AI-ключи каждому приложению'
const description =
  'Почему прямой доступ каждого приложения к провайдерам AI превращается в постоянный контроль ключей, моделей и отказов — и зачем нужна одна дверь в машинный зал.'
const content = `## Одна дверь в машинный зал: как я перестал раздавать AI‑ключи каждому приложению
Раньше я выдавал ключи всем приложениям подряд, не думая о последствиях.
После обновления модели в приложении X код пришлось править вручную.
Теперь одна дверь в машинный зал, и ключи выдаю только по запросу)

## Что болело

Раньше я отдавал каждому приложению прямой доступ к провайдерам AI, как в коммунальной квартире с кучей ключей, где никто не знал, где главный замок. Клиенту приходилось запоминать имя модели, адрес, API‑ключ, таймаут и нюансы ответа. Когда я сменил модель, пришлось переписать правила для всех. Провайдер упал, и я стал разбирать каждый сервис вручную. Добавив локальную модель, я понял, что надо контролировать, кто может к ней зайти, иначе запросы уйдут в облако при первом 429. Болело, что каждый сервис требовал свои настройки и ломался при смене модели. Это уже не интеграция, а постоянный контроль, кто где сломался)
`

export const metadata: Metadata = {
  metadataBase: new URL('https://mamaev.coach'),
  title,
  description,
  alternates: { canonical: 'https://mamaev.coach/blog/odna-dver-v-mashinnyy-zal-kak-ya-perestal-razdavat-ai-klyuchi-kazhdomu-prilozhen/' },
  openGraph: {
    title,
    description,
    url: 'https://mamaev.coach/blog/odna-dver-v-mashinnyy-zal-kak-ya-perestal-razdavat-ai-klyuchi-kazhdomu-prilozhen/',
    type: 'article',
    locale: 'ru_RU',
  },
  twitter: { card: 'summary_large_image', title, description },
}

export default function GatewayPostPage() {
  return (
    <PostLayout post={getPost('odna-dver-v-mashinnyy-zal-kak-ya-perestal-razdavat-ai-klyuchi-kazhdomu-prilozhen')!} locale="ru">
      <PublishedMarkdownPost content={content} title={title} lang="ru" />
    </PostLayout>
  )
}
