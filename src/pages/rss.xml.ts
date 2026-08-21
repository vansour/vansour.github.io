import rss from '@astrojs/rss';
import { getPublishedPosts } from '../lib/posts';

export async function GET(context: { site: URL }) {
  const posts = await getPublishedPosts();
  return rss({
    title: 'Vansour 的博客',
    description: 'Vansour 的个人技术博客：技术笔记、踩坑经历与学习心得。',
    site: context.site,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      link: `/blog/${post.id}/`,
    })),
    customData: '<language>zh-cn</language>',
  });
}
