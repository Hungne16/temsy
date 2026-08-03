import { db } from "./firebase";
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, serverTimestamp, query, orderBy } from "firebase/firestore";

export interface FeedbackData {
  id?: string;
  userId: string;
  userName: string;
  userEmail: string;
  message: string;
  status: 'pending' | 'resolved';
  createdAt: any;
}

export const submitFeedback = async (userId: string, userName: string, userEmail: string, message: string) => {
  const feedbacksRef = collection(db, "feedbacks");
  await addDoc(feedbacksRef, {
    userId,
    userName,
    userEmail,
    message,
    status: 'pending',
    createdAt: serverTimestamp()
  });
};

export const getFeedbacks = async (): Promise<FeedbackData[]> => {
  try {
    const q = query(collection(db, "feedbacks"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as FeedbackData);
  } catch (err) {
    console.error("Lỗi khi lấy danh sách phản hồi:", err);
    return [];
  }
};

export const resolveFeedback = async (feedbackId: string) => {
  const feedbackRef = doc(db, "feedbacks", feedbackId);
  await updateDoc(feedbackRef, { status: 'resolved' });
};

export const deleteFeedback = async (feedbackId: string) => {
  const feedbackRef = doc(db, "feedbacks", feedbackId);
  await deleteDoc(feedbackRef);
};
