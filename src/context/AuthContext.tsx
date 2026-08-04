"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { 
  User, 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile
} from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";

interface AuthContextType {
  user: User | null;
  userProfile: any | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (e: string, p: string) => Promise<void>;
  registerWithEmail: (e: string, p: string, name: string) => Promise<void>;
  resetPassword: (e: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  loading: true,
  signInWithGoogle: async () => {},
  signInWithEmail: async () => {},
  registerWithEmail: async () => {},
  resetPassword: async () => {},
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If Firebase config is missing, just don't crash and leave user null
    if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY || !auth) {
      console.warn("Firebase is not configured. Auth will be disabled.");
      setTimeout(() => setLoading(false), 0);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // Create user document in Firestore if it doesn't exist, and fetch userProfile
        try {
          const userDocRef = doc(db, "users", currentUser.uid);
          const docSnap = await getDoc(userDocRef);
          if (!docSnap.exists()) {
            const newProfile = {
              uid: currentUser.uid,
              name: currentUser.displayName,
              email: currentUser.email,
              avatar: currentUser.photoURL,
              joinDate: new Date().toISOString(),
              stats: { stamps: 0, albums: 0, followers: 0, following: 0 },
              role: "user"
            };
            await setDoc(userDocRef, newProfile);
            setUserProfile(newProfile);
          } else {
            const data = docSnap.data();
            // Tự động gỡ ban nếu đã hết hạn
            if (data.isBanned && data.banUntil && Date.now() >= data.banUntil) {
              await updateDoc(userDocRef, {
                isBanned: false,
                banReason: null,
                banUntil: null
              });
              data.isBanned = false;
              data.banReason = null;
              data.banUntil = null;
            }
            setUserProfile(data);
          }
        } catch (error) {
          console.error("Error creating user profile in Firestore:", error);
        }
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY || !auth) {
      alert("Bạn cần cấu hình Firebase trong file .env.local để sử dụng tính năng này!");
      return;
    }
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Lỗi đăng nhập Google:", error);
      throw error;
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    if (!auth) throw new Error("Firebase chưa được cấu hình.");
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const registerWithEmail = async (email: string, pass: string, name: string) => {
    if (!auth) throw new Error("Firebase chưa được cấu hình.");
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    if (userCredential.user) {
      await updateProfile(userCredential.user, { displayName: name });
      
      // Khởi tạo thông tin user trong Firestore
      try {
        const userDocRef = doc(db, "users", userCredential.user.uid);
        const newProfile = {
          uid: userCredential.user.uid,
          name: name,
          email: email,
          avatar: null,
          joinDate: new Date().toISOString(),
          stats: { stamps: 0, albums: 0, followers: 0, following: 0 },
          role: "user"
        };
        await setDoc(userDocRef, newProfile);
        setUserProfile(newProfile);
      } catch (e) {
        console.error("Lỗi tạo Firestore document", e);
      }
    }
  };

  const resetPassword = async (email: string) => {
    if (!auth) throw new Error("Firebase chưa được cấu hình.");
    await sendPasswordResetEmail(auth, email);
  };

  const logout = async () => {
    try {
      if (auth) await signOut(auth);
    } catch (error) {
      console.error("Lỗi đăng xuất:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, signInWithGoogle, signInWithEmail, registerWithEmail, resetPassword, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
