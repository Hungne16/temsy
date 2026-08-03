import { db, auth } from "./firebase";
import { collection, addDoc, serverTimestamp, getDocs, query, where, or } from "firebase/firestore";
import { StampStyle } from "@/components/StampPreview";

export interface StampMetadata {
  title: string;
  location: string;
  date: string;
  story?: string;
  coordinates?: { lat: number; lng: number };
  isSecret?: boolean;
  audioData?: string;
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

// ── Comments ─────────────────────────────────────────────────────────────────

export interface CommentData {
  id?: string;
  userId: string;
  userName: string;
  userAvatar: string;
  text: string;
  createdAt: any;
}

export const getComments = async (stampId: string): Promise<CommentData[]> => {
  try {
    const commentsRef = collection(db, "stamps", stampId, "comments");
    // Sort by createdAt descending
    const q = query(commentsRef);
    const snapshot = await getDocs(q);
    const comments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as CommentData[];
    
    // Client-side sort if no index
    return comments.sort((a: any, b: any) => {
      const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
      const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
      return timeB - timeA;
    });
  } catch (error) {
    console.error("Lỗi lấy bình luận:", error);
    return [];
  }
};

export const addComment = async (stampId: string, text: string) => {
  if (!auth.currentUser) throw new Error("Vui lòng đăng nhập để bình luận!");
  
  const uid = auth.currentUser.uid;
  let userName = auth.currentUser.displayName || "Người dùng ẩn danh";
  let userAvatar = auth.currentUser.photoURL || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop";

  try {
    const userDocRef = doc(db, "users", uid);
    const userSnap = await getDoc(userDocRef);
    if (userSnap.exists()) {
      const userData = userSnap.data();
      if (userData.name) userName = userData.name;
      if (userData.avatar) userAvatar = userData.avatar;
    }
  } catch (err) {
    console.error("Lỗi lấy thông tin user:", err);
  }

  const comment: CommentData = {
    userId: uid,
    userName,
    userAvatar,
    text,
    createdAt: serverTimestamp(),
  };

  const commentsRef = collection(db, "stamps", stampId, "comments");
  const docRef = await addDoc(commentsRef, comment);
  
  // Gửi thông báo cho chủ tem (nếu người bình luận khác chủ tem)
  try {
    const stampRef = doc(db, "stamps", stampId);
    const stampSnap = await getDoc(stampRef);
    if (stampSnap.exists()) {
      const stampOwnerId = stampSnap.data().userId;
      if (stampOwnerId && stampOwnerId !== auth.currentUser.uid) {
        // dynamic import để tránh circular dependency nếu có
        const { createPersonalNotification } = await import("./notificationService");
        const stampTitle = stampSnap.data().metadata?.title || "Một tem không tên";
        await createPersonalNotification(
          stampOwnerId,
          "comment",
          "Bình luận mới!",
          `${auth.currentUser.displayName || "Ai đó"} đã bình luận vào tem "${stampTitle}" của bạn.`,
          `/stamp/${stampId}`
        );
      }
    }
  } catch (err) {
    console.error("Lỗi khi gửi thông báo bình luận:", err);
  }

  return { id: docRef.id, ...comment, createdAt: { toMillis: () => Date.now() } };
};
