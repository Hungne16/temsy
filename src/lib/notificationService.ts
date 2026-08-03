import { db } from "./firebase";
import { collection, addDoc, serverTimestamp, query, where, doc, updateDoc, arrayUnion, onSnapshot } from "firebase/firestore";

export interface NotificationData {
  id?: string;
  recipientId: string; // user.uid hoặc 'ALL'
  type: 'system' | 'comment';
  title: string;
  message: string;
  link?: string;
  imageUrl?: string; // Hình ảnh đính kèm (ví dụ: ảnh tem bị xóa)
  readBy?: string[]; // Mảng chứa ID những người đã đọc (dùng cho 'ALL')
  isRead?: boolean; // Dùng cho thông báo cá nhân
  createdAt?: any;
}

// 1. Tạo thông báo cá nhân (ví dụ: có bình luận mới)
export const createPersonalNotification = async (recipientId: string, type: 'system' | 'comment', title: string, message: string, link?: string, imageUrl?: string) => {
  try {
    const notification: any = {
      recipientId,
      type,
      title,
      message,
      isRead: false,
      createdAt: serverTimestamp(),
    };
    if (link) notification.link = link;
    if (imageUrl) notification.imageUrl = imageUrl;
    await addDoc(collection(db, "notifications"), notification);
  } catch (error) {
    console.error("Lỗi khi tạo thông báo cá nhân:", error);
  }
};

// 2. Tạo thông báo toàn hệ thống (dành cho Admin)
export const createGlobalNotification = async (title: string, message: string, link?: string) => {
  try {
    const notification: any = {
      recipientId: "ALL",
      type: "system",
      title,
      message,
      readBy: [],
      createdAt: serverTimestamp(),
    };
    if (link) notification.link = link;
    await addDoc(collection(db, "notifications"), notification);
  } catch (error) {
    console.error("Lỗi khi tạo thông báo toàn hệ thống:", error);
    throw error;
  }
};

// 3. Đánh dấu thông báo đã đọc
export const markNotificationAsRead = async (notificationId: string, isGlobal: boolean, userId: string) => {
  try {
    const docRef = doc(db, "notifications", notificationId);
    if (isGlobal) {
      await updateDoc(docRef, {
        readBy: arrayUnion(userId)
      });
    } else {
      await updateDoc(docRef, {
        isRead: true
      });
    }
  } catch (error) {
    console.error("Lỗi khi đánh dấu thông báo đã đọc:", error);
  }
};

// 4. Lắng nghe thông báo theo thời gian thực
export const subscribeToNotifications = (userId: string, callback: (notifications: NotificationData[]) => void) => {
  const q = query(
    collection(db, "notifications"),
    // Chỉ lấy thông báo của người này hoặc tất cả
    where("recipientId", "in", [userId, "ALL"])
  );

  return onSnapshot(q, (snapshot) => {
    let notifications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as NotificationData));
    
    // Sort by createdAt descending (client-side to avoid complex index requirements)
    notifications = notifications.sort((a, b) => {
      const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : Date.now();
      const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : Date.now();
      return timeB - timeA;
    });

    callback(notifications);
  }, (error) => {
    console.error("Lỗi khi lắng nghe thông báo:", error);
  });
};
