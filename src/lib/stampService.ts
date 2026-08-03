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
  privacy: "public" | "private" | "friend" = "public"
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
    privacy,
    isPublic: privacy === "public", // for legacy queries
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

// Lấy tất cả tem public, tem private của chính user, và tem friend (nếu user là bạn)
export const getMapStamps = async (currentUserId?: string) => {
  try {
    const stampsRef = collection(db, "stamps");
    const stampsMap = new Map();
    
    // 1. Fetch public stamps
    const publicQuery = query(stampsRef, where("privacy", "==", "public"));
    const publicSnap = await getDocs(publicQuery);
    publicSnap.docs.forEach(doc => {
      stampsMap.set(doc.id, { id: doc.id, ...doc.data() });
    });
    
    // For legacy stamps that don't have privacy field but have isPublic=true
    const legacyPublicQuery = query(stampsRef, where("isPublic", "==", true));
    const legacyPublicSnap = await getDocs(legacyPublicQuery);
    legacyPublicSnap.docs.forEach(doc => {
      if (!stampsMap.has(doc.id)) {
        stampsMap.set(doc.id, { id: doc.id, ...doc.data() });
      }
    });

    if (currentUserId) {
      // 2. Fetch user's own stamps (private or otherwise)
      const userStampsQuery = query(stampsRef, where("userId", "==", currentUserId));
      const userStampsSnap = await getDocs(userStampsQuery);
      userStampsSnap.docs.forEach(doc => {
        if (!stampsMap.has(doc.id)) {
          stampsMap.set(doc.id, { id: doc.id, ...doc.data() });
        }
      });

      // 3. Fetch friend stamps and filter locally
      // First get current user profile to know their friends
      const { getUserProfile } = await import("./userService");
      const userProfile = await getUserProfile(currentUserId);
      const friendsList = userProfile?.friends || [];

      if (friendsList.length > 0) {
        const friendQuery = query(stampsRef, where("privacy", "==", "friend"));
        const friendSnap = await getDocs(friendQuery);
        friendSnap.docs.forEach(doc => {
          const data = doc.data();
          if (friendsList.includes(data.userId) && !stampsMap.has(doc.id)) {
            stampsMap.set(doc.id, { id: doc.id, ...data });
          }
        });
      }
    }

    return Array.from(stampsMap.values());
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
    const data = docSnap.data();
    try {
      const { getUserProfile } = await import("./userService");
      const profile = await getUserProfile(data.userId);
      if (profile) {
        data.userName = profile.displayName;
        data.userAvatar = profile.photoURL;
      }
    } catch (err) {}
    return { id: docSnap.id, ...data };
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
    
    // Fetch latest user profiles to ensure up-to-date avatars
    const { getUserProfile } = await import("./userService");
    await Promise.all(comments.map(async (comment) => {
      if (comment.userId) {
        try {
          const profile = await getUserProfile(comment.userId);
          if (profile) {
            comment.userName = profile.displayName;
            comment.userAvatar = profile.photoURL;
          }
        } catch (err) {}
      }
    }));

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
    const { getUserProfile } = await import("./userService");
    const profile = await getUserProfile(uid);
    if (profile) {
      userName = profile.displayName;
      userAvatar = profile.photoURL;
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
