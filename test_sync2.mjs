// using native fetch
// using native env

const folderId = process.env.VITE_GOOGLE_DRIVE_FOLDER_ID;
const apiKey = process.env.VITE_GOOGLE_API_KEY;

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

const run = async () => {
  const rootContents = await fetchFolderContents(folderId, apiKey);
  console.log("Root contents subfolders:", rootContents.subFolders.map(f => f.name));

  for (const item of rootContents.subFolders) {
    console.log("Checking item:", item.name);
    const itemContents = await fetchFolderContents(item.id, apiKey);
    
    // 1. Standalone Book
    if (itemContents.audioFiles.length > 0) {
      console.log("-> Found standalone book:", item.name);
    } 
    // 2. Series
    else if (itemContents.subFolders.length > 0) {
      console.log("-> Found series:", item.name);
      const seriesName = item.name;
      
      for (const subBookFolder of itemContents.subFolders) {
        console.log("  -> Checking subBook:", subBookFolder.name);
        const subBookContents = await fetchFolderContents(subBookFolder.id, apiKey);
        
        if (subBookContents.audioFiles.length > 0) {
           console.log("    -> Found book in series:", subBookFolder.name);
        } else {
           console.log("    -> NO AUDIO FILES IN BOOK FOLDER:", subBookFolder.name);
        }
      }
    } else {
      console.log("-> Found empty or invalid folder:", item.name);
    }
  }
}

run().catch(console.error);
