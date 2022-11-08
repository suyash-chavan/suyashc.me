import useTranslation from 'next-translate/useTranslation'
import { POSTS_PER_PAGE } from '..'
import { PageSEO } from '@/components/SEO'
import siteMetadata from '@/data/siteMetadata'
import { getAllFilesFrontMatter, getFileBySlug } from '@/lib/mdx'
import ListLearningLayout from '@/layouts/ListLearningLayout'

export async function getStaticPaths({ locales, defaultLocale }) {
  const paths = (
    await Promise.all(
      locales.map(async (locale) => {
        const otherLocale = locale !== defaultLocale ? locale : ''
        const totalPosts = await getAllFilesFrontMatter('resources', otherLocale) // don't forget to useotherLocale
        const totalPages = Math.ceil(totalPosts.length / POSTS_PER_PAGE)
        return Array.from({ length: totalPages }, (_, i) => [(i + 1).toString(), locale])
      })
    )
  ).flat()

  return {
    paths: paths.map(([page, locale]) => ({
      params: {
        page,
      },
      locale,
    })),
    fallback: false,
  }
}

export async function getStaticProps(context) {
  const {
    params: { page },
    defaultLocale,
    locales,
    locale,
  } = context
  const otherLocale = locale !== defaultLocale ? locale : ''
  const posts = await getAllFilesFrontMatter('resources', otherLocale)
  const pageNumber = parseInt(page)
  const post = await getFileBySlug('resources', posts[pageNumber - 1].slug, otherLocale)
  const initialDisplayPosts = posts.slice(
    POSTS_PER_PAGE * (pageNumber - 1),
    POSTS_PER_PAGE * pageNumber
  )
  const pagination = {
    currentPage: pageNumber,
    totalPages: Math.ceil(posts.length / POSTS_PER_PAGE),
  }

  // Checking if available in other locale for SEO
  const availableLocales = []
  await locales.forEach(async (ilocal) => {
    const otherLocale = ilocal !== defaultLocale ? ilocal : ''
    const iAllPosts = await getAllFilesFrontMatter('resources', otherLocale)
    iAllPosts.forEach(() => {
      if (
        pageNumber <= Math.ceil(iAllPosts.length / POSTS_PER_PAGE) &&
        !availableLocales.includes(ilocal)
      )
        availableLocales.push(ilocal)
    })
  })

  return {
    props: {
      posts,
      post,
      initialDisplayPosts,
      pagination,
      locale,
      availableLocales,
    },
  }
}

export default function PostPage({
  posts,
  post,
  initialDisplayPosts,
  pagination,
  locale,
  availableLocales,
}) {
  const { t } = useTranslation()
  return (
    <>
      <PageSEO
        title={siteMetadata.title[locale]}
        description={siteMetadata.description[locale]}
        availableLocales={availableLocales}
      />
      <ListLearningLayout
        posts={posts}
        post={post}
        initialDisplayPosts={initialDisplayPosts}
        pagination={pagination}
        title={t('common:resources')}
      />
    </>
  )
}
