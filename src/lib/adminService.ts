import { db } from "./firebase";
import { collection, getDocs, doc, updateDoc, deleteDoc, setDoc } from "firebase/firestore";
import { initializeApp, getApps } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, updateProfile, signOut } from "firebase/auth";

// Lấy tất cả user profiles
export const getAllUsers = async () => {
  try {
    const usersRef = collection(db, "users");
    const snapshot = await getDocs(usersRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Lỗi lấy danh sách user:", error);
    throw error;
  }
};

// Cập nhật danh hiệu (title)
export const updateUserTitle = async (uid: string, title: string) => {
  try {
    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, { title });
  } catch (error) {
    console.error("Lỗi cập nhật danh hiệu:", error);
    throw error;
  }
};

// Cập nhật vai trò (role)
export const updateUserRole = async (uid: string, role: "admin" | "user") => {
  try {
    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, { role });
  } catch (error) {
    console.error("Lỗi cập nhật vai trò:", error);
    throw error;
  }
};

// Xóa profile người dùng (chỉ xóa ở Firestore)
export const deleteUserProfile = async (uid: string) => {
  try {
    const userRef = doc(db, "users", uid);
    await deleteDoc(userRef);
  } catch (error) {
    console.error("Lỗi xóa profile user:", error);
    throw error;
  }
};

// Tạo tài khoản mới thông qua Secondary App để không làm đăng xuất Admin hiện tại
export const createNewUser = async (email: string, pass: string, name: string, role: "admin" | "user" = "user") => {
  // Config giống hệt app chính
  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  // Khởi tạo app phụ nếu chưa có
  const apps = getApps();
  let secondaryApp = apps.find(app => app.name === "Secondary");
  if (!secondaryApp) {
    secondaryApp = initializeApp(firebaseConfig, "Secondary");
  }
  
  const secondaryAuth = getAuth(secondaryApp);
  
  try {
    const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, pass);
    if (userCredential.user) {
      await updateProfile(userCredential.user, { displayName: name });
      
      // Khởi tạo thông tin user trong Firestore của app chính (dùng db hiện tại)
      const userDocRef = doc(db, "users", userCredential.user.uid);
      await setDoc(userDocRef, {
        uid: userCredential.user.uid,
        name: name,
        email: email,
        avatar: null,
        joinDate: new Date().toISOString(),
        stats: { stamps: 0, albums: 0, followers: 0, following: 0 },
        role: role,
        title: "Tân binh"
      });
      
      // Ký xuất app phụ để sạch phiên
      await signOut(secondaryAuth);
      
      return userCredential.user.uid;
    }
  } catch (error) {
    console.error("Lỗi tạo tài khoản mới:", error);
    throw error;
  }
};
