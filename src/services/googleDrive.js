export const extractFolderId = (link) => {
  if (!link) return null;
  const match = link.match(/folders\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : link; // fallback to the string itself if they pasted an ID
};

const fetchFolderContents = async (folderId, apiKey) => {
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents+and+(mimeType='application/vnd.google-apps.folder'+or+mimeType+contains+'audio/'+or+mimeType+contains+'image/')+and+trashed=false&key=${apiKey}&fields=files(id,name,mimeType,webContentLink)&orderBy=name`
  );
  if (!res.ok) {
    throw new Error(`Failed to fetch folder contents for ${folderId}`);
  }
  const data = await res.json();
  const files = data.files || [];
  
  return {
    audioFiles: files.filter(f => f.mimeType.startsWith('audio/')),
    imageFiles: files.filter(f => f.mimeType.startsWith('image/')),
    subFolders: files.filter(f => f.mimeType === 'application/vnd.google-apps.folder')
  };
};

const buildBookObj = (folderItem, contents, apiKey, seriesName) => {
  let coverUrl = 'https://placehold.co/400x600/e2e8f0/475569?text=' + encodeURIComponent(folderItem.name);
  let hasCustomCover = false;
  
  if (contents.imageFiles.length > 0) {
    coverUrl = `https://www.googleapis.com/drive/v3/files/${contents.imageFiles[0].id}?alt=media&key=${apiKey}`;
    hasCustomCover = true;
  }

  return {
    id: folderItem.id,
    title: folderItem.name,
    series: seriesName || null,
    coverUrl,
    hasCustomCover,
    chapters: contents.audioFiles.map(file => ({
      id: file.id,
      name: file.name,
      url: `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media&key=${apiKey}`,
    }))
  };
};

export const fetchBooksFromDrive = async () => {
  const folderId = import.meta.env.VITE_GOOGLE_DRIVE_FOLDER_ID;
  const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
  
  if (!folderId || !apiKey) {
    throw new Error('Missing Google Drive configuration in .env file');
  }

  const books = [];
  const rootContents = await fetchFolderContents(folderId, apiKey);

  for (const item of rootContents.subFolders) {
    const itemContents = await fetchFolderContents(item.id, apiKey);
    
    // 1. Standalone Book (Folder directly contains audio files)
    if (itemContents.audioFiles.length > 0) {
      books.push(buildBookObj(item, itemContents, apiKey, null));
    } 
    // 2. Series (Folder contains subfolders but no direct audio files)
    else if (itemContents.subFolders.length > 0) {
      const seriesName = item.name;
      const seriesCover = itemContents.imageFiles.length > 0 ? 
        `https://www.googleapis.com/drive/v3/files/${itemContents.imageFiles[0].id}?alt=media&key=${apiKey}` : null;
      
      for (const subBookFolder of itemContents.subFolders) {
        const subBookContents = await fetchFolderContents(subBookFolder.id, apiKey);
        
        if (subBookContents.audioFiles.length > 0) {
           const bookObj = buildBookObj(subBookFolder, subBookContents, apiKey, seriesName);
           
           // If the individual book doesn't have a cover, fallback to the series cover
           if (!bookObj.hasCustomCover && seriesCover) {
             bookObj.coverUrl = seriesCover;
             bookObj.hasCustomCover = true;
           }
           
           books.push(bookObj);
        }
      }
    }
  }

  return books;
};
