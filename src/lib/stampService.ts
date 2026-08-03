import { db, auth } from "./firebase";
import { collection, addDoc, serverTimestamp, getDocs, query, where, or } from "firebase/firestore";
import { StampStyle } from "@/components/StampPreview";

export interface StampMetadata {
  title: string;
  location: string;
  date: string;
  story?: string;
  coordinates?: { lat: number; lng: number };
}

export const uploadStamp = async (
  dataUrl: string, 
  style: StampStyle, 
  metadata: StampMetadata,
  isPublic: boolean = true
) => {
  if (!auth.currentUser) throw new Error("Vui lòng đăng nhập để lưu tem!");

  const uid = auth.currentUser.uid;
  const userName = auth.currentUser.displayName || "Người dùng ẩn danh";
  const userAvatar = auth.currentUser.photoURL || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop";

  const stampDoc = {
    userId: uid,
    userName,
    userAvatar,
    imageUrl: dataUrl,
    style,
    metadata,
    isPublic,
    likes: 0,
    createdAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, "stamps"), stampDoc);
  return { id: docRef.id, ...stampDoc };
};

export const getUserStamps = async (userId: string) => {
  try {
    const q = query(
      collection(db, "stamps"), 
      where("userId", "==", userId)
    );
    
    const snapshot = await getDocs(q);
    const stamps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    return stamps.sort((a: any, b: any) => {
      const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
      const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
      return timeB - timeA;
    });
  } catch (error) {
    console.error("Lỗi lấy danh sách tem:", error);
    return [];
  }
};

// Lấy tất cả tem public VÀ tem private của chính user đó (để hiển thị trên bản đồ)
export const getMapStamps = async (currentUserId?: string) => {
  try {
    const stampsRef = collection(db, "stamps");
    let snapshot;
    
    // Firestore có hỗ trợ OR queries, hoặc fetch all rồi lọc.
    // Vì collection nhỏ, ta có thể dùng or() nếu có Firebase SDK mới, hoặc chỉ fetch where isPublic == true 
    // và fetch riêng where userId == currentUserId rồi gộp lại để tránh lỗi missing index.
    
    // Cách an toàn ko cần composite index: 
    const publicQuery = query(stampsRef, where("isPublic", "==", true));
    const publicSnap = await getDocs(publicQuery);
    const stamps = publicSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
    
    if (currentUserId) {
      // Tìm tem của chính user nhưng isPublic == false (tem private)
      const userPrivateQuery = query(stampsRef, where("userId", "==", currentUserId));
      const userPrivateSnap = await getDocs(userPrivateQuery);
      
      userPrivateSnap.docs.forEach(doc => {
        const data = doc.data();
        // Thêm vào nếu nó là private và chưa có trong list
        if (data.isPublic === false && !stamps.some(s => s.id === doc.id)) {
          stamps.push({ id: doc.id, ...data });
        }
      });
    }

    return stamps;
  } catch (error) {
    console.error("Lỗi lấy danh sách tem cho bản đồ:", error);
    return [];
  }
};

import { doc, getDoc, deleteDoc, updateDoc } from "firebase/firestore";

export const getStampById = async (id: string) => {
  const docRef = doc(db, "stamps", id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() };
  } else {
    throw new Error("Không tìm thấy tem!");
  }
};

export const deleteStamp = async (id: string) => {
  const docRef = doc(db, "stamps", id);
  await deleteDoc(docRef);
};

export const updateStampMetadata = async (id: string, metadata: StampMetadata) => {
  const docRef = doc(db, "stamps", id);
  await updateDoc(docRef, { metadata });
};
