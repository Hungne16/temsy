import { db } from "./firebase";
import { collection, addDoc, getDocs, doc, updateDoc, serverTimestamp, query, where, orderBy, getDoc } from "firebase/firestore";

export interface ReportData {
  id?: string;
  stampId: string;
  stampTitle?: string;
  stampImageUrl?: string;
  reportedBy: string; // User ID của người report
  reason: string;
  status: 'pending' | 'resolved';
  createdAt?: any;
}

// 1. Tạo một report mới
export const createReport = async (stampId: string, reportedBy: string, reason: string, stampTitle?: string, stampImageUrl?: string) => {
  try {
    const report: ReportData = {
      stampId,
      reportedBy,
      reason,
      stampTitle: stampTitle || "Không tiêu đề",
      stampImageUrl: stampImageUrl || "",
      status: 'pending',
      createdAt: serverTimestamp(),
    };
    const docRef = await addDoc(collection(db, "reports"), report);
    return docRef.id;
  } catch (error) {
    console.error("Lỗi khi tạo báo cáo:", error);
    throw error;
  }
};

// 2. Lấy danh sách báo cáo đang chờ xử lý cho Admin
export const getPendingReports = async () => {
  try {
    const q = query(
      collection(db, "reports"),
      where("status", "==", "pending")
    );
    const snapshot = await getDocs(q);
    
    // Sort in memory to avoid needing complex composite index if not present
    const reports = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ReportData));
    reports.sort((a, b) => {
      const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
      const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
      return timeB - timeA;
    });

    return reports;
  } catch (error) {
    console.error("Lỗi lấy danh sách báo cáo:", error);
    throw error;
  }
};

// 3. Xử lý báo cáo (Đánh dấu đã giải quyết)
export const resolveReport = async (reportId: string) => {
  try {
    const reportRef = doc(db, "reports", reportId);
    await updateDoc(reportRef, {
      status: 'resolved'
    });
  } catch (error) {
    console.error("Lỗi cập nhật trạng thái báo cáo:", error);
    throw error;
  }
};
