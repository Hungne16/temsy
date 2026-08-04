import { db } from "./firebase";
import { collection, addDoc, serverTimestamp, query, where, doc, updateDoc, arrayUnion, onSnapshot, getDocs } from "firebase/firestore";

export interface NotificationData {
  id?: string;
  recipientId: string; // user.uid hoặc 'ALL'
  type: 'system' | 'comment' | 'friend_request' | 'chat' | 'reward';
  title: string;
  message: string;
  link?: string;
  imageUrl?: string; // Hình ảnh đính kèm (ví dụ: ảnh tem bị xóa)
  readBy?: string[]; // Mảng chứa ID những người đã đọc (dùng cho 'ALL')
  isRead?: boolean; // Dùng cho thông báo cá nhân
  senderId?: string; // ID người gửi (dùng cho kết bạn)
  status?: 'pending' | 'accepted' | 'rejected'; // Trạng thái kết bạn
  rewardData?: {
    badgeTitle?: string;
    badgeImage?: string;
    content?: string;
  };
  createdAt?: any;
}

// 1. Tạo thông báo cá nhân (ví dụ: có bình luận mới)
export const createPersonalNotification = async (recipientId: string, type: 'system' | 'comment' | 'chat', title: string, message: string, link?: string, imageUrl?: string) => {
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

// 1.2. Tạo thông báo phần thưởng (Surprise Reward)
export const createRewardNotification = async (
  recipientId: string, 
  title: string, 
  message: string, 
  badgeTitle?: string, 
  badgeImage?: string
) => {
  try {
    const notification: any = {
      recipientId,
      type: 'reward',
      title,
      message,
      isRead: false,
      status: 'pending',
      rewardData: {
        badgeTitle: badgeTitle || "",
        badgeImage: badgeImage || "",
        content: message
      },
      createdAt: serverTimestamp(),
    };
    await addDoc(collection(db, "notifications"), notification);
  } catch (error) {
    console.error("Lỗi khi tạo phần thưởng:", error);
    throw error;
  }
};

// 1.5 Tạo lời mời kết bạn
export const createFriendRequestNotification = async (senderId: string, recipientId: string, senderName: string, senderAvatar?: string) => {
  try {
    // Check if pending request already exists
    const q = query(
      collection(db, "notifications"),
      where("recipientId", "==", recipientId),
      where("senderId", "==", senderId),
      where("type", "==", "friend_request"),
      where("status", "==", "pending")
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      throw new Error("Bạn đã gửi lời mời rồi, vui lòng chờ phản hồi!");
    }

    const notification: any = {
      recipientId,
      type: "friend_request",
      title: "Lời mời kết bạn",
      message: `${senderName} muốn kết bạn với bạn.`,
      isRead: false,
      senderId,
      status: 'pending',
      createdAt: serverTimestamp(),
    };
    if (senderAvatar) notification.imageUrl = senderAvatar;
    await addDoc(collection(db, "notifications"), notification);
  } catch (error) {
    console.error("Lỗi khi gửi lời mời kết bạn:", error);
    throw error;
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

// 3.5 Cập nhật trạng thái thông báo
export const updateNotificationStatus = async (notificationId: string, status: 'accepted' | 'rejected') => {
  try {
    const docRef = doc(db, "notifications", notificationId);
    await updateDoc(docRef, {
      status,
      isRead: true // Đánh dấu đã đọc khi đã xử lý xong
    });
  } catch (error) {
    console.error("Lỗi cập nhật trạng thái thông báo:", error);
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
