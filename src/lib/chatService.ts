import { db } from "./firebase";
import { collection, doc, setDoc, addDoc, serverTimestamp, query, orderBy, onSnapshot, getDocs, where } from "firebase/firestore";
import { createPersonalNotification } from "./notificationService";
import { getUserProfile } from "./userService";

export interface Message {
  id?: string;
  senderId: string;
  text: string;
  createdAt: any;
}

export interface ChatSession {
  id: string;
  participants: string[];
  lastMessage?: string;
  lastUpdated?: any;
}

// Generate a deterministic chat ID for two users
export const getChatId = (uid1: string, uid2: string) => {
  return [uid1, uid2].sort().join("_");
};

// Send a message
export const sendMessage = async (senderId: string, receiverId: string, text: string) => {
  const chatId = getChatId(senderId, receiverId);
  const chatRef = doc(db, "chats", chatId);
  
  // Ensure chat document exists and update lastMessage
  await setDoc(chatRef, {
    participants: [senderId, receiverId],
    lastMessage: text,
    lastUpdated: serverTimestamp()
  }, { merge: true });

  // Add message to subcollection
  const messagesRef = collection(chatRef, "messages");
  await addDoc(messagesRef, {
    senderId,
    text,
    createdAt: serverTimestamp()
  });

  // Send notification to the receiver
  try {
    const senderProfile = await getUserProfile(senderId);
    const senderName = senderProfile?.displayName || "Một người bạn";
    await createPersonalNotification(
      receiverId,
      "chat",
      `Tin nhắn mới từ ${senderName}`,
      text,
      `/chat/${senderId}`,
      senderProfile?.photoURL
    );
  } catch (error) {
    console.error("Lỗi gửi thông báo tin nhắn:", error);
  }
};

// Subscribe to messages in a chat (returns unsubscribe function)
export const subscribeToMessages = (chatId: string, callback: (messages: Message[]) => void) => {
  const messagesRef = collection(db, "chats", chatId, "messages");
  const q = query(messagesRef, orderBy("createdAt", "asc"));
  
  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Message));
    callback(messages);
  });
};

// Get list of active chats for a user
export const getActiveChats = async (userId: string): Promise<ChatSession[]> => {
  const chatsRef = collection(db, "chats");
  const q = query(chatsRef, where("participants", "array-contains", userId));
  const snapshot = await getDocs(q);
  
  const chats = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as ChatSession));
  
  return chats.sort((a, b) => {
    const timeA = a.lastUpdated?.toMillis ? a.lastUpdated.toMillis() : 0;
    const timeB = b.lastUpdated?.toMillis ? b.lastUpdated.toMillis() : 0;
    return timeB - timeA;
  });
};
