export const fetchBookCover = async (bookTitle) => {
  try {
    // Search the Google Books API
    const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=intitle:${encodeURIComponent(bookTitle)}`);
    if (!res.ok) return null;
    
    const data = await res.json();
    if (data.items && data.items.length > 0) {
      // Find the first result with an image link
      for (const item of data.items) {
        if (item.volumeInfo && item.volumeInfo.imageLinks && item.volumeInfo.imageLinks.thumbnail) {
          // Replace http with https for secure loading, and remove the edge curl
          return item.volumeInfo.imageLinks.thumbnail.replace('http:', 'https:').replace('&edge=curl', '');
        }
      }
    }
    return null;
  } catch (err) {
    console.error('Failed to fetch book cover:', err);
    return null;
  }
};
