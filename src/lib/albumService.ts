import { db, auth } from "./firebase";
import { collection, addDoc, getDocs, doc, deleteDoc, updateDoc, arrayUnion, arrayRemove, query, where, serverTimestamp } from "firebase/firestore";

export interface Album {
  id: string;
  userId: string;
  title: string;
  stamps?: string[]; // Danh sách ID các tem trong album
  createdAt?: any;
}

export const createAlbum = async (title: string): Promise<Album> => {
  if (!auth.currentUser) throw new Error("Vui lòng đăng nhập để tạo album!");
  
  const albumDoc = {
    userId: auth.currentUser.uid,
    title,
    stamps: [],
    createdAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, "albums"), albumDoc);
  return { id: docRef.id, ...albumDoc };
};

export const getUserAlbums = async (userId: string): Promise<Album[]> => {
  try {
    const q = query(collection(db, "albums"), where("userId", "==", userId));
    const snapshot = await getDocs(q);
    
    const albums = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Album));
    
    // Sort by createdAt desc
    return albums.sort((a, b) => {
      const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
      const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
      return timeB - timeA;
    });
  } catch (error) {
    console.error("Lỗi lấy danh sách album:", error);
    return [];
  }
};

export const deleteAlbum = async (id: string): Promise<void> => {
  try {
    const docRef = doc(db, "albums", id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Lỗi xóa album:", error);
    throw error;
  }
};
export const updateAlbum = async (id: string, title: string): Promise<void> => {
  try {
    const docRef = doc(db, "albums", id);
    await updateDoc(docRef, { title });
  } catch (error) {
    console.error("Lỗi sửa album:", error);
    throw error;
  }
};

export const addStampToAlbum = async (albumId: string, stampId: string): Promise<void> => {
  try {
    const docRef = doc(db, "albums", albumId);
    await updateDoc(docRef, {
      stamps: arrayUnion(stampId)
    });
  } catch (error) {
    console.error("Lỗi thêm tem vào album:", error);
    throw error;
  }
};

export const removeStampFromAlbum = async (albumId: string, stampId: string): Promise<void> => {
  try {
    const docRef = doc(db, "albums", albumId);
    await updateDoc(docRef, {
      stamps: arrayRemove(stampId)
    });
  } catch (error) {
    console.error("Lỗi xóa tem khỏi album:", error);
    throw error;
  }
};
