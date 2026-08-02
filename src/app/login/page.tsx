"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, User as UserIcon, Eye, EyeOff, ArrowLeft } from "lucide-react";

export default function LoginPage() {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { signInWithGoogle, signInWithEmail, registerWithEmail, user, loading } = useAuth();
  const router = useRouter();

  if (loading) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-paper gap-4">
        {/* Stamp spinner */}
        <div className="w-16 h-16 border-[4px] border-pencil border-t-marker-red rounded-full animate-spin" />
        <p className="font-patrick text-lg text-pencil/60">Đang tải...</p>
      </div>
    );
  }

  if (user) {
    router.push("/profile");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (isLoginMode) {
        await signInWithEmail(email, password);
        router.push("/profile");
      } else {
        if (!name.trim()) throw new Error("Vui lòng nhập tên hiển thị");
        await registerWithEmail(email, password, name);
        router.push("/profile");
      }
    } catch (err: any) {
      console.error(err);
      if (
        err.code === "auth/invalid-credential" ||
        err.code === "auth/user-not-found" ||
        err.code === "auth/wrong-password"
      ) {
        setError("Tài khoản hoặc mật khẩu không chính xác.");
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
    } catch {
      setError("Không thể đăng nhập bằng Google.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-paper flex flex-col font-patrick overflow-x-hidden">

      {/* ── Top decorative illustration band ── */}
      <div className="relative w-full h-44 sm:h-56 bg-[#ff4d4d] flex-shrink-0 overflow-hidden">
        {/* wavy bottom edge */}
        <svg
          className="absolute bottom-0 left-0 w-full"
          viewBox="0 0 1440 60"
          preserveAspectRatio="none"
          fill="#fdfbf7"
        >
          <path d="M0,30 C240,60 480,0 720,30 C960,60 1200,0 1440,30 L1440,60 L0,60 Z" />
        </svg>

        {/* Illustrated faces pattern (CSS-only decorative circles to simulate the ref) */}
        {[
          { top: "10%", left: "8%", size: 52, rot: "-10deg" },
          { top: "5%",  left: "28%", size: 40, rot: "6deg" },
          { top: "20%", left: "52%", size: 60, rot: "-6deg" },
          { top: "4%",  left: "72%", size: 44, rot: "12deg" },
          { top: "25%", left: "85%", size: 50, rot: "-8deg" },
          { top: "40%", left: "15%", size: 36, rot: "8deg" },
          { top: "45%", left: "38%", size: 48, rot: "-4deg" },
          { top: "38%", left: "62%", size: 38, rot: "10deg" },
        ].map((c, i) => (
          <div
            key={i}
            className="absolute rounded-full border-[3px] border-white/60 bg-white/20"
            style={{
              top: c.top,
              left: c.left,
              width: c.size,
              height: c.size,
              transform: `rotate(${c.rot})`,
            }}
          />
        ))}

        {/* Back button */}
        <Link
          href="/"
          className="absolute top-4 left-4 z-20 flex items-center justify-center w-10 h-10 rounded-full bg-white/30 border-2 border-white/60 text-white hover:bg-white/50 transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
      </div>

      {/* ── Main card ── */}
      <div className="flex-1 flex flex-col items-center px-6 pb-10 -mt-6 relative z-10">

        {/* Stamp logo badge */}
        <div className="w-20 h-20 bg-paper border-[3px] border-pencil shadow-[4px_4px_0px_0px_#2d2d2d] flex items-center justify-center mb-5 relative"
          style={{ clipPath: "polygon(8px 0%,calc(100% - 8px) 0%,100% 8px,100% calc(100% - 8px),calc(100% - 8px) 100%,8px 100%,0% calc(100% - 8px),0% 8px)" }}>
          <img src="/logo.png" alt="Temsy" className="w-12 h-12 object-contain" />
          {/* Wavy lines like a real stamp cancel */}
          <div className="absolute bottom-2 left-0 right-0 flex flex-col gap-0.5 px-1 pointer-events-none">
            <div className="h-px bg-pencil/20" />
            <div className="h-px bg-pencil/15" />
          </div>
        </div>

        {/* Title */}
        <h1 className="font-kalam font-bold text-center mb-1">
          <span className="text-3xl text-pencil">
            {isLoginMode ? "Đăng " : "Tạo "}
          </span>
          <span className="text-3xl text-marker-red">
            {isLoginMode ? "Nhập" : "Tài Khoản"}
          </span>
        </h1>
        <p className="text-pencil/60 text-sm text-center mb-7">
          {isLoginMode
            ? "Chào mừng trở lại! Bộ sưu tập tem đang chờ bạn 📮"
            : "Bắt đầu lưu giữ khoảnh khắc của bạn thành những con tem ❤️"}
        </p>

        {/* Error */}
        {error && (
          <div className="w-full max-w-sm mb-5 px-4 py-3 bg-marker-red/10 border-2 border-marker-red text-marker-red text-sm font-bold rounded-xl wobbly-border">
            {error}
          </div>
        )}

        {/* Google button */}
        <button
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="w-full max-w-sm flex items-center justify-center gap-3 py-3.5 bg-white border-2 border-pencil rounded-2xl shadow-[3px_3px_0px_0px_#2d2d2d] font-bold text-pencil text-base hover:translate-y-[-2px] hover:shadow-[3px_5px_0px_0px_#2d2d2d] active:translate-y-[2px] active:shadow-none transition-all disabled:opacity-50"
        >
          <svg viewBox="0 0 24 24" width="22" height="22" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 15.01 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Tiếp tục với Google
        </button>

        {/* Divider */}
        <div className="w-full max-w-sm flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-pencil/20" />
          <span className="text-xs font-bold text-pencil/40 tracking-widest">HOẶC EMAIL</span>
          <div className="flex-1 h-px bg-pencil/20" />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="w-full max-w-sm flex flex-col gap-3">

          {/* Name field — only for register */}
          {!isLoginMode && (
            <div className="relative">
              <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-pencil/40" size={18} />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 bg-white border-2 border-pencil/30 rounded-2xl focus:outline-none focus:border-marker-red text-base font-patrick text-pencil placeholder-pencil/40 transition-colors"
                placeholder="Tên hiển thị"
              />
            </div>
          )}

          {/* Email */}
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-pencil/40" size={18} />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 bg-white border-2 border-pencil/30 rounded-2xl focus:outline-none focus:border-marker-red text-base font-patrick text-pencil placeholder-pencil/40 transition-colors"
              placeholder="Email"
            />
          </div>

          {/* Password */}
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-pencil/40" size={18} />
            <input
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-11 pr-12 py-3.5 bg-white border-2 border-pencil/30 rounded-2xl focus:outline-none focus:border-marker-red text-base font-patrick text-pencil placeholder-pencil/40 transition-colors"
              placeholder="Mật khẩu"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-pencil/40 hover:text-pencil transition-colors"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {/* Primary CTA — Sign Up / Sign In */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 mt-2 bg-marker-red text-white font-bold text-lg rounded-2xl shadow-[4px_4px_0px_0px_#c01c1c] hover:translate-y-[-2px] hover:shadow-[4px_6px_0px_0px_#c01c1c] active:translate-y-[2px] active:shadow-none transition-all disabled:opacity-60 flex items-center justify-center"
          >
            {isLoading ? (
              <div className="w-6 h-6 border-[3px] border-white/40 border-t-white rounded-full animate-spin" />
            ) : isLoginMode ? (
              "Đăng Nhập"
            ) : (
              "Đăng Ký"
            )}
          </button>

          {/* Secondary CTA — toggle mode */}
          <button
            type="button"
            onClick={() => { setIsLoginMode(!isLoginMode); setError(""); }}
            className="w-full py-4 bg-transparent text-marker-red font-bold text-lg rounded-2xl border-2 border-marker-red hover:bg-marker-red/5 active:bg-marker-red/10 transition-colors"
          >
            {isLoginMode ? "Tạo Tài Khoản" : "Đã có tài khoản? Đăng Nhập"}
          </button>
        </form>

        {/* Footer note */}
        <p className="text-xs text-pencil/40 text-center mt-6 max-w-xs">
          Bằng cách tiếp tục, bạn đồng ý với{" "}
          <span className="text-marker-red underline cursor-pointer">Điều khoản dịch vụ</span>{" "}
          và{" "}
          <span className="text-marker-red underline cursor-pointer">Chính sách bảo mật</span>{" "}
          của Temsy.
        </p>
      </div>
    </div>
  );
}
