"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, User as UserIcon, ArrowLeft } from "lucide-react";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "register" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { signInWithGoogle, signInWithEmail, registerWithEmail, resetPassword, user } = useAuth();
  const router = useRouter();

  // If already logged in, redirect to profile
  if (user) {
    router.push("/profile");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setIsLoading(true);

    try {
      if (mode === "login") {
        await signInWithEmail(email, password);
        router.push("/profile");
      } else if (mode === "register") {
        if (!name.trim()) throw new Error("Vui lòng nhập tên hiển thị");
        await registerWithEmail(email, password, name);
        router.push("/profile");
      } else if (mode === "forgot") {
        await resetPassword(email);
        setMessage("Email khôi phục mật khẩu đã được gửi. Vui lòng kiểm tra hộp thư của bạn.");
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/invalid-credential" || err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
        setError("Email hoặc mật khẩu không chính xác.");
      } else if (err.code === "auth/email-already-in-use") {
        setError("Email này đã được sử dụng.");
      } else if (err.code === "auth/weak-password") {
        setError("Mật khẩu phải có ít nhất 6 ký tự.");
      } else {
        setError(err.message || "Đã xảy ra lỗi. Vui lòng thử lại.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signInWithGoogle();
      router.push("/profile");
    } catch (error) {
      setError("Không thể đăng nhập bằng Google.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      {/* Left side - Image & Branding (Hidden on mobile) */}
      <div className="hidden md:flex flex-col flex-1 relative bg-pastel-blue overflow-hidden">
        <div className="absolute inset-0 bg-black/10 z-10"></div>
        <img 
          src="https://images.unsplash.com/photo-1596489371901-52829cc73d81?q=80&w=2000&auto=format&fit=crop" 
          alt="Vintage stamp collection" 
          className="absolute inset-0 w-full h-full object-cover opacity-80"
        />
        <div className="relative z-20 flex flex-col justify-between h-full p-12 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white text-pastel-blue flex items-center justify-center font-bold text-2xl shadow-lg">
              T
            </div>
            <span className="text-3xl font-bold tracking-tight">Temsy</span>
          </div>
          <div>
            <h1 className="text-5xl font-bold leading-tight mb-4 drop-shadow-md">
              Lưu giữ từng<br/>khoảnh khắc
            </h1>
            <p className="text-xl text-white/90 max-w-md drop-shadow-md">
              Biến những bức ảnh tuyệt đẹp của bạn thành những con tem kỹ thuật số mang phong cách riêng.
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 relative">
        <Link href="/" className="absolute top-6 left-6 md:hidden flex items-center gap-2 text-foreground/60 hover:text-foreground">
          <ArrowLeft size={20} /> <span className="font-medium">Quay lại</span>
        </Link>
        <Link href="/" className="absolute top-12 right-12 hidden md:flex items-center gap-2 text-foreground/60 hover:text-foreground transition-colors">
          <ArrowLeft size={20} /> <span className="font-medium">Trang chủ</span>
        </Link>

        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            {/* Mobile Logo */}
            <div className="md:hidden flex items-center justify-center gap-3 mb-8 mt-8">
              <div className="w-12 h-12 rounded-xl bg-pastel-blue text-white flex items-center justify-center font-bold text-3xl shadow-lg">
                T
              </div>
              <span className="text-4xl font-bold tracking-tight">Temsy</span>
            </div>

            <h2 className="text-3xl font-bold mb-2">
              {mode === "login" ? "Chào mừng trở lại!" : mode === "register" ? "Tạo tài khoản mới" : "Khôi phục mật khẩu"}
            </h2>
            <p className="text-foreground/60">
              {mode === "login" 
                ? "Đăng nhập để xem bộ sưu tập tem của bạn." 
                : mode === "register" 
                ? "Tham gia cộng đồng sưu tầm tem ngay hôm nay." 
                : "Nhập email của bạn để nhận liên kết đặt lại mật khẩu."}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-600 text-sm font-medium border border-red-100">
              {error}
            </div>
          )}

          {message && (
            <div className="mb-6 p-4 rounded-xl bg-green-50 text-green-700 text-sm font-medium border border-green-100">
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground/80 pl-1">Tên hiển thị</label>
                <div className="relative">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40" size={18} />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-black/20 focus:outline-none focus:ring-2 focus:ring-pastel-blue/50 focus:border-pastel-blue transition-all"
                    placeholder="Nguyễn Văn A"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground/80 pl-1">Địa chỉ Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40" size={18} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-black/20 focus:outline-none focus:ring-2 focus:ring-pastel-blue/50 focus:border-pastel-blue transition-all"
                  placeholder="hello@temsy.com"
                />
              </div>
            </div>

            {mode !== "forgot" && (
              <div className="space-y-1">
                <div className="flex justify-between items-end">
                  <label className="text-sm font-medium text-foreground/80 pl-1">Mật khẩu</label>
                  {mode === "login" && (
                    <button type="button" onClick={() => setMode("forgot")} className="text-xs font-semibold text-pastel-blue-dark hover:underline">
                      Quên mật khẩu?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40" size={18} />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-black/20 focus:outline-none focus:ring-2 focus:ring-pastel-blue/50 focus:border-pastel-blue transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-foreground text-background py-3.5 rounded-xl font-bold mt-6 hover:bg-foreground/90 transition-all active:scale-[0.98] flex items-center justify-center"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-background border-t-transparent rounded-full animate-spin"></div>
              ) : (
                mode === "login" ? "Đăng nhập" : mode === "register" ? "Tạo tài khoản" : "Gửi yêu cầu"
              )}
            </button>
          </form>

          {mode !== "forgot" && (
            <>
              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-black/10 dark:border-white/10"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-background text-foreground/50">Hoặc tiếp tục với</span>
                </div>
              </div>

              <button
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 bg-white dark:bg-black/20 border border-black/10 dark:border-white/10 py-3.5 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-white/5 transition-all active:scale-[0.98]"
              >
                <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 15.01 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Google
              </button>
            </>
          )}

          <div className="mt-8 text-center text-sm font-medium text-foreground/70">
            {mode === "login" ? (
              <>
                Chưa có tài khoản?{" "}
                <button onClick={() => setMode("register")} className="text-pastel-blue-dark font-bold hover:underline">
                  Đăng ký ngay
                </button>
              </>
            ) : (
              <>
                Đã có tài khoản?{" "}
                <button onClick={() => setMode("login")} className="text-pastel-blue-dark font-bold hover:underline">
                  Đăng nhập
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
