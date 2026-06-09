import { getFallbackCover } from '../lib/coverUtils';

export const extractFolderId = (link) => {
  if (!link) return null;
  const match = link.match(/folders\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : link; // fallback to the string itself if they pasted an ID
};

const fetchFolderContents = async (folderId, apiKey) => {
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents+and+(mimeType='application/vnd.google-apps.folder'+or+mimeType+contains+'audio/'+or+mimeType+contains+'image/')+and+trashed=false&key=${apiKey}&fields=files(id,name,mimeType,webContentLink,thumbnailLink)&orderBy=name`
  );
  if (!res.ok) {
    throw new Error(`Failed to fetch folder contents for ${folderId}`);
  }
  const data = await res.json();
  const files = data.files || [];
  
  const audioFiles = files.filter(f => f.mimeType.startsWith('audio/'));
  audioFiles.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

  const subFolders = files.filter(f => f.mimeType === 'application/vnd.google-apps.folder');
  subFolders.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
  
  return {
    audioFiles,
    imageFiles: files.filter(f => f.mimeType.startsWith('image/')),
    subFolders
  };
};

const buildBookObj = (folderItem, contents, apiKey, seriesName) => {
  let coverUrl = getFallbackCover(folderItem.name, 400, 600);
  let hasCustomCover = false;
  
  if (contents.imageFiles.length > 0) {
    const img = contents.imageFiles[0];
    // Always use the persistent Google Drive media download link to prevent link expiry
    coverUrl = `https://drive.google.com/thumbnail?id=${img.id}&sz=w800`;
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
      url: `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media&key=${apiKey}&acknowledgeAbuse=true`,
    }))
  };
};

export const fetchBooksFromDrive = async (existingBooks = []) => {
  const folderId = import.meta.env.VITE_GOOGLE_DRIVE_FOLDER_ID;
  const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
  
  if (!folderId || !apiKey) {
    throw new Error('Missing Google Drive configuration in .env file');
  }

  const existingMap = new Map();
  existingBooks.forEach(b => existingMap.set(b.id, b));

  const books = [];
  const rootContents = await fetchFolderContents(folderId, apiKey);

  for (const item of rootContents.subFolders) {
    if (existingMap.has(item.id)) {
      books.push(existingMap.get(item.id));
      continue;
    }

    const itemContents = await fetchFolderContents(item.id, apiKey);
    
    // 1. Standalone Book (Folder directly contains audio files)
    if (itemContents.audioFiles.length > 0) {
      books.push(buildBookObj(item, itemContents, apiKey, null));
    } 
    // 2. Series (Folder contains subfolders but no direct audio files)
    else if (itemContents.subFolders.length > 0) {
      const seriesName = item.name;
      const seriesCover = itemContents.imageFiles.length > 0 ? 
        `https://drive.google.com/thumbnail?id=${itemContents.imageFiles[0].id}&sz=w800` : null;
      
      for (const subBookFolder of itemContents.subFolders) {
        if (existingMap.has(subBookFolder.id)) {
          books.push(existingMap.get(subBookFolder.id));
          continue;
        }

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
