"use client";

import { useState, useEffect } from "react";
import { getPendingReports, resolveReport, ReportData } from "@/lib/reportService";
import { deleteStamp } from "@/lib/stampService";
import { createPersonalNotification } from "@/lib/notificationService";
import { getStampById } from "@/lib/stampService";
import { Flag, Trash2, CheckCircle2, RefreshCw, ExternalLink } from "lucide-react";
import Link from "next/link";

export default function AdminReportsPage() {
  const [reports, setReports] = useState<ReportData[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const data = await getPendingReports();
      setReports(data);
    } catch (error) {
      console.error(error);
      alert("Không thể tải danh sách báo cáo.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleDismiss = async (reportId: string) => {
    if (!window.confirm("Bạn muốn bỏ qua báo cáo này? (Tem sẽ không bị xóa)")) return;
    
    setProcessingId(reportId);
    try {
      await resolveReport(reportId);
      setReports(prev => prev.filter(r => r.id !== reportId));
    } catch (error) {
      alert("Lỗi khi xử lý báo cáo.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeleteStamp = async (report: ReportData) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa vĩnh viễn tem này?")) return;
    
    setProcessingId(report.id || null);
    try {
      // Get stamp info to know who to notify
      let stampUserId = null;
      try {
        const stampData = await getStampById(report.stampId);
        stampUserId = (stampData as any).userId;
      } catch (e) {
        console.warn("Could not get stamp owner (maybe already deleted)");
      }

      // Delete the stamp
      await deleteStamp(report.stampId);

      // Resolve the report
      if (report.id) {
        await resolveReport(report.id);
      }

      // Notify the stamp owner
      if (stampUserId) {
        await createPersonalNotification(
          stampUserId,
          'system',
          'Tem của bạn đã bị gỡ',
          `Tem "${report.stampTitle}" đã bị gỡ do vi phạm tiêu chuẩn cộng đồng (bị cộng đồng báo cáo).`,
          undefined,
          report.stampImageUrl
        );
      }

      // Notify the reporter
      if (report.reportedBy) {
        await createPersonalNotification(
          report.reportedBy,
          'system',
          'Báo cáo đã được xử lý',
          `Cảm ơn bạn đã báo cáo tem "${report.stampTitle}". Quản trị viên đã xem xét và gỡ bỏ tem vi phạm này.`
        );
      }

      // Remove from UI (both this report and any other reports for the SAME stamp)
      setReports(prev => prev.filter(r => r.stampId !== report.stampId));
      
    } catch (error) {
      alert("Lỗi khi xóa tem hoặc xử lý báo cáo.");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="p-6 md:p-10 font-patrick max-w-6xl mx-auto">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-4xl font-bold text-pencil mb-2 font-kalam flex items-center gap-3">
            <Flag className="text-marker-red" size={32} /> 
            Quản lý Báo cáo
          </h1>
          <p className="text-pencil/60 font-bold">Danh sách các tem bị người dùng báo cáo vi phạm.</p>
        </div>
        <button 
          onClick={fetchReports}
          className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-pencil rounded-xl wobbly-border-sm hover:bg-muted-paper transition-colors font-bold text-pencil"
        >
          <RefreshCw size={18} className={loading ? "animate-spin" : ""} /> Làm mới
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="w-10 h-10 border-4 border-pencil border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reports.map((report) => (
            <div key={report.id} className="bg-white border-[3px] border-pencil rounded-2xl p-5 wobbly-border shadow-[4px_4px_0_0_#2d2d2d] flex flex-col relative group">
              <div className="flex gap-4">
                {/* Stamp Image Thumbnail */}
                <div className="w-24 h-24 shrink-0 bg-gray-100 border-2 border-pencil/20 rounded-xl overflow-hidden">
                  {report.stampImageUrl ? (
                    <img src={report.stampImageUrl} alt={report.stampTitle} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-pencil/40 text-xs text-center p-2">Không có ảnh</div>
                  )}
                </div>

                {/* Report Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <Link href={`/stamp/${report.stampId}`} className="font-bold text-xl text-pencil hover:text-marker-blue transition-colors truncate mb-1 inline-flex items-center gap-1">
                      {report.stampTitle} <ExternalLink size={16} />
                    </Link>
                  </div>
                  
                  <div className="bg-red-50 border border-red-200 rounded-lg p-2.5 mt-1">
                    <div className="text-xs font-bold text-red-500 mb-0.5">Lý do báo cáo:</div>
                    <div className="font-bold text-pencil text-sm line-clamp-2">{report.reason}</div>
                  </div>
                  
                  <div className="text-xs text-pencil/50 font-bold mt-3">
                    Ngày gửi: {new Date(report.createdAt?.toMillis ? report.createdAt.toMillis() : Date.now()).toLocaleString('vi-VN')}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-4 pt-4 border-t-2 border-dashed border-pencil/20 grid grid-cols-2 gap-3">
                <button 
                  disabled={processingId === report.id}
                  onClick={() => handleDismiss(report.id!)}
                  className="flex items-center justify-center gap-1.5 py-2.5 bg-gray-50 hover:bg-gray-100 rounded-xl border-2 border-pencil transition-colors font-bold text-pencil disabled:opacity-50"
                >
                  <CheckCircle2 size={18} /> 
                  {processingId === report.id ? "Đang xử lý..." : "Bỏ qua"}
                </button>

                <button 
                  disabled={processingId === report.id}
                  onClick={() => handleDeleteStamp(report)}
                  className="flex items-center justify-center gap-1.5 py-2.5 bg-red-50 hover:bg-red-100 rounded-xl border-2 border-pencil text-marker-red font-bold transition-colors disabled:opacity-50"
                >
                  <Trash2 size={18} /> 
                  {processingId === report.id ? "Đang xóa..." : "Xóa tem"}
                </button>
              </div>
            </div>
          ))}

          {reports.length === 0 && (
            <div className="col-span-full py-16 text-center border-4 border-dashed border-pencil/20 rounded-2xl bg-white/50">
              <Flag size={48} className="mx-auto text-pencil/20 mb-4" />
              <p className="text-2xl text-pencil/50 font-bold font-kalam">Tuyệt vời! Không có báo cáo vi phạm nào.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
