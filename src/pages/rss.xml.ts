import rss from '@astrojs/rss';
import { getPublishedPosts } from '../lib/posts';

export async function GET(context: { site: URL }) {
  const posts = await getPublishedPosts();
  return rss({
    title: 'Vansour Blog',
    description: 'Vansour Blog',
    site: context.site,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      link: `/blog/${post.id}/`,
    })),
    customData: '<language>zh-cn</language>',
  });
}
