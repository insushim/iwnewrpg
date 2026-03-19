import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

type SavedPlayerData = {
  name: string;
  className: string;
  mapId: string;
  gold: number;
  exp: number;
  level: number;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  inventory: unknown[];
  equipment: Record<string, unknown>;
  quests: unknown[];
  quizCorrectStreak: number;
  updatedAt: number;
};

export async function loadPlayer(playerId: string): Promise<SavedPlayerData | null> {
  try {
    const snap = await getDoc(doc(db, "players", playerId));
    if (!snap.exists()) return null;
    return snap.data() as SavedPlayerData;
  } catch (err) {
    console.error("[Firestore] load failed:", (err as Error).message);
    return null;
  }
}

export async function savePlayer(playerId: string, data: SavedPlayerData): Promise<void> {
  try {
    await setDoc(doc(db, "players", playerId), { ...data, updatedAt: Date.now() });
  } catch (err) {
    console.error("[Firestore] save failed:", (err as Error).message);
  }
}
