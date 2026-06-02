import { BlogIndex } from '@/components/blog/blog-index'

export const metadata = {
  title: 'Blog — Alexander Mamaev',
  alternates: {
    canonical: 'https://mamaev.coach/en/blog/',
    languages: {
      'ru-RU': 'https://mamaev.coach/blog/',
      'en-US': 'https://mamaev.coach/en/blog/',
      'x-default': 'https://mamaev.coach/blog/',
    },
  },
}

export default function Page() {
  return <BlogIndex locale="en" />
}
