import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, deleteDoc, getDocs, collection } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const isConfigValid = 
  firebaseConfig.apiKey && 
  firebaseConfig.projectId && 
  firebaseConfig.appId;

let db = null;

if (isConfigValid) {
  try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    console.log('Firebase initialized successfully.');
  } catch (error) {
    console.error('Failed to initialize Firebase:', error);
  }
} else {
  console.log('Firebase configuration missing or incomplete. Falling back to local mode.');
}

export const isFirebaseAvailable = () => {
  return db !== null;
};

// Sync a single profile's complete data to the cloud
export const saveProfileToCloud = async (profile) => {
  if (!db) return;
  try {
    const profileRef = doc(db, 'profiles', profile.id);
    await setDoc(profileRef, {
      ...profile,
      lastUpdated: profile.lastUpdated || Date.now()
    }, { merge: true });
  } catch (error) {
    console.error(`Error saving profile ${profile.id} to cloud:`, error);
  }
};

// Delete a profile from the cloud
export const deleteProfileFromCloud = async (profileId) => {
  if (!db) return;
  try {
    const profileRef = doc(db, 'profiles', profileId);
    await deleteDoc(profileRef);
  } catch (error) {
    console.error(`Error deleting profile ${profileId} from cloud:`, error);
  }
};

// Fetch all profiles from the cloud
export const fetchProfilesFromCloud = async () => {
  if (!db) return [];
  try {
    const querySnapshot = await getDocs(collection(db, 'profiles'));
    const profiles = [];
    querySnapshot.forEach((doc) => {
      profiles.push({ ...doc.data(), id: doc.id });
    });
    return profiles;
  } catch (error) {
    console.error('Error fetching profiles from cloud:', error);
    return [];
  }
};
