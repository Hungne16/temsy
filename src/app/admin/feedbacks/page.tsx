"use client";

import { useState, useEffect } from "react";
import { getFeedbacks, resolveFeedback, deleteFeedback, FeedbackData } from "@/lib/feedbackService";
import { CheckCircle, Trash2, Mail, MessageSquare } from "lucide-react";

export default function AdminFeedbacksPage() {
  const [feedbacks, setFeedbacks] = useState<FeedbackData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'resolved'>('all');

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const fetchFeedbacks = async () => {
    setLoading(true);
    try {
      const data = await getFeedbacks();
      setFeedbacks(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (id: string) => {
    if (!confirm("Đánh dấu phản hồi này là đã xử lý?")) return;
    try {
      await resolveFeedback(id);
      setFeedbacks(feedbacks.map(f => f.id === id ? { ...f, status: 'resolved' } : f));
    } catch (err) {
      alert("Lỗi khi xử lý phản hồi");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa phản hồi này?")) return;
    try {
      await deleteFeedback(id);
      setFeedbacks(feedbacks.filter(f => f.id !== id));
    } catch (err) {
      alert("Lỗi khi xóa phản hồi");
    }
  };

  const filteredFeedbacks = feedbacks.filter(f => {
    if (filter === 'all') return true;
    return f.status === filter;
  });

  return (
    <div className="p-6 md:p-10 font-patrick">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
        <div>
          <h1 className="text-4xl font-kalam font-bold text-marker-blue flex items-center gap-3">
            <MessageSquare className="text-marker-blue" size={36} />
            Quản lý Phản hồi
          </h1>
          <p className="text-pencil/70 text-lg mt-2 font-bold">Xử lý các góp ý từ người dùng</p>
        </div>
        
        <div className="flex bg-white border-[3px] border-pencil p-1 wobbly-border shadow-[2px_2px_0_0_#2d2d2d] rotate-1">
          <button 
            onClick={() => setFilter('all')}
            className={`px-4 py-2 font-bold ${filter === 'all' ? 'bg-marker-blue text-white' : 'text-pencil hover:bg-muted-paper'} transition-colors`}
          >
            Tất cả
          </button>
          <button 
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 font-bold ${filter === 'pending' ? 'bg-marker-red text-white' : 'text-pencil hover:bg-muted-paper'} transition-colors`}
          >
            Chờ xử lý
          </button>
          <button 
            onClick={() => setFilter('resolved')}
            className={`px-4 py-2 font-bold ${filter === 'resolved' ? 'bg-green-500 text-white' : 'text-pencil hover:bg-muted-paper'} transition-colors`}
          >
            Đã xử lý
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-2xl font-bold text-pencil/50 animate-pulse">
          Đang tải danh sách phản hồi...
        </div>
      ) : (
        <div className="space-y-6">
          {filteredFeedbacks.length === 0 ? (
            <div className="bg-white border-[3px] border-pencil p-10 text-center wobbly-border shadow-pencil">
              <p className="text-2xl font-bold text-pencil/50 font-kalam">Không có phản hồi nào {filter !== 'all' ? 'trong mục này' : ''}.</p>
            </div>
          ) : (
            filteredFeedbacks.map((feedback) => (
              <div 
                key={feedback.id} 
                className={`bg-white border-[3px] border-pencil p-6 wobbly-border shadow-pencil flex flex-col md:flex-row gap-6 items-start md:items-center relative ${feedback.status === 'resolved' ? 'opacity-70 grayscale-[30%]' : ''}`}
              >
                {/* User Info */}
                <div className="w-full md:w-1/4 shrink-0 border-b-2 md:border-b-0 md:border-r-2 border-pencil/20 pb-4 md:pb-0 md:pr-4">
                  <div className="font-bold text-xl text-pencil font-kalam">{feedback.userName}</div>
                  <div className="flex items-center gap-1 text-sm text-pencil/60 mt-1">
                    <Mail size={14} /> {feedback.userEmail}
                  </div>
                  <div className="text-sm font-bold text-pencil/50 mt-2">
                    {feedback.createdAt?.toMillis ? new Date(feedback.createdAt.toMillis()).toLocaleString('vi-VN') : "Vừa xong"}
                  </div>
                </div>

                {/* Message */}
                <div className="flex-1 w-full">
                  <p className="text-lg whitespace-pre-wrap">{feedback.message}</p>
                </div>

                {/* Actions */}
                <div className="flex gap-2 w-full md:w-auto shrink-0 justify-end mt-4 md:mt-0">
                  {feedback.status === 'pending' ? (
                    <button 
                      onClick={() => handleResolve(feedback.id!)}
                      className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 border-2 border-green-200 hover:bg-green-100 hover:border-green-300 font-bold transition-colors wobbly-border"
                      title="Đánh dấu đã xử lý"
                    >
                      <CheckCircle size={18} /> Đã xử lý
                    </button>
                  ) : (
                    <span className="flex items-center gap-2 px-4 py-2 bg-muted-paper text-pencil/50 border-2 border-pencil/20 font-bold wobbly-border">
                      <CheckCircle size={18} /> Hoàn tất
                    </span>
                  )}
                  <button 
                    onClick={() => handleDelete(feedback.id!)}
                    className="flex items-center justify-center p-2 bg-red-50 text-marker-red border-2 border-red-200 hover:bg-red-100 hover:border-red-300 transition-colors wobbly-border"
                    title="Xóa phản hồi"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
