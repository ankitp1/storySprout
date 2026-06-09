export const getFallbackCover = (title, width = 400, height = 600) => {
  const cleanTitle = (title || 'Unknown Title')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
    
  const words = cleanTitle.split(' ');
  const lines = [];
  let currentLine = '';
  
  words.forEach(word => {
    if ((currentLine + word).length > 15) {
      if (currentLine) lines.push(currentLine.trim());
      currentLine = word + ' ';
    } else {
      currentLine += word + ' ';
    }
  });
  if (currentLine) lines.push(currentLine.trim());

  if (lines.length > 5) {
    lines.length = 5;
    lines[4] += '...';
  }

  const lineHeight = Math.max(30, height * 0.05);
  const startY = (height / 2) - ((lines.length - 1) * lineHeight / 2);

  const textElements = lines.map((line, i) => {
    return `<text x="50%" y="${startY + (i * lineHeight)}" font-family="sans-serif" font-weight="bold" font-size="${Math.max(20, height * 0.04)}" fill="#475569" text-anchor="middle" dominant-baseline="middle">${line}</text>`;
  }).join('');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="#e2e8f0"/>${textElements}</svg>`;
  
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
};
