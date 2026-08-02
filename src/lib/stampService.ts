import { db, auth } from "./firebase";
import { collection, addDoc, serverTimestamp, getDocs, query, where } from "firebase/firestore";
import { StampStyle } from "@/components/StampPreview";

export const uploadStamp = async (
  dataUrl: string, 
  style: StampStyle, 
  metadata: { title: string; location: string; date: string; }
) => {
  if (!auth.currentUser) throw new Error("Vui lòng đăng nhập để lưu tem!");

  const uid = auth.currentUser.uid;

  // LƯU TRỰC TIẾP ẢNH BASE64 VÀO FIRESTORE (BỎ QUA FIREBASE STORAGE)
  // Ảnh JPEG nén sẽ có dung lượng nhỏ, đủ để lưu vào document (limit 1MB)
  const stampDoc = {
    userId: uid,
    imageUrl: dataUrl, // Dùng thẳng chuỗi Base64 làm nguồn ảnh
    style,
    metadata,
    likes: 0,
    createdAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, "stamps"), stampDoc);
  return { id: docRef.id, ...stampDoc };
};

export const getUserStamps = async (userId: string) => {
  try {
    // Chỉ query where để tránh lỗi yêu cầu tạo Composite Index trên Firestore
    const q = query(
      collection(db, "stamps"), 
      where("userId", "==", userId)
    );
    
    const snapshot = await getDocs(q);
    const stamps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Sort bằng JavaScript client-side
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
