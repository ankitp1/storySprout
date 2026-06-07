export const extractYoutubeVideoId = (url) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

export const fetchPodcastFeed = async (rssUrl) => {
  try {
    const res = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`);
    if (!res.ok) throw new Error('Failed to parse RSS feed via proxy');
    
    const data = await res.json();
    if (data.status !== 'ok') {
      throw new Error(data.message || 'Failed to parse RSS feed');
    }
    
    return {
      title: data.feed.title || 'Custom Podcast',
      coverUrl: data.feed.image || 'https://placehold.co/400x600/e2e8f0/475569?text=Podcast',
      author: data.feed.author || 'Podcast Creator',
      description: data.feed.description || '',
      episodes: (data.items || [])
        .filter(item => item.enclosure && item.enclosure.link)
        .map((item, index) => ({
          id: item.guid || item.link || `${Date.now()}_${index}`,
          name: item.title,
          url: item.enclosure.link
        }))
    };
  } catch (error) {
    console.error('Error fetching podcast feed:', error);
    throw error;
  }
};
