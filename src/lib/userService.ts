import { db, auth } from "./firebase";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { updateProfile } from "firebase/auth";

export interface UserProfile {
  uid: string;
  displayName: string;
  photoURL: string;
  bio?: string;
  bannerUrl?: string;
  location?: string;
  role?: string;
  title?: string;
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const docRef = doc(db, "users", uid);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        ...data,
        displayName: data.displayName || data.name || "Người dùng ẩn danh",
        photoURL: data.photoURL || data.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop"
      } as UserProfile;
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
}

export async function updateUserProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
  try {
    const docRef = doc(db, "users", uid);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      await updateDoc(docRef, data);
    } else {
      await setDoc(docRef, { ...data, uid });
    }

    // Đồng bộ với Firebase Auth profile
    if (auth.currentUser && (data.displayName || data.photoURL)) {
      const authUpdates: any = {};
      
      if (data.displayName) {
        authUpdates.displayName = data.displayName;
      }
      
      // Firebase Auth photoURL has a strict length limit and will reject large base64 strings
      if (data.photoURL && !data.photoURL.startsWith("data:image/")) {
        authUpdates.photoURL = data.photoURL;
      }

      if (Object.keys(authUpdates).length > 0) {
        await updateProfile(auth.currentUser, authUpdates);
      }
    }
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw error;
  }
}
