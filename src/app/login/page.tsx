"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, User as UserIcon, ArrowLeft, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { signInWithGoogle, signInWithEmail, registerWithEmail, user } = useAuth();
  const router = useRouter();

  // If already logged in, redirect to profile
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
      if (err.code === "auth/invalid-credential" || err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
        setError("Tài khoản hoặc mật khẩu không chính xác.");
      } else if (err.code === "auth/email-already-in-use") {
        setError("Tài khoản (Email) này đã được sử dụng.");
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
    <div className="min-h-screen flex items-center justify-center bg-background md:bg-gray-50/50 p-4">
      <Link href="/" className="absolute top-6 left-6 flex items-center gap-2 text-foreground/60 hover:text-foreground z-50">
        <ArrowLeft size={20} /> <span className="font-medium hidden md:inline">Trang chủ</span>
      </Link>

      <div className="w-full max-w-4xl h-[600px] bg-white rounded-3xl shadow-2xl relative overflow-hidden flex flex-col md:flex-row">
        
        {/* Mobile View Toggle (Visible only on small screens) */}
        <div className="md:hidden flex bg-gray-100 m-4 rounded-xl p-1 relative z-10 shrink-0">
          <button 
            onClick={() => setIsLoginMode(true)}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${isLoginMode ? "bg-white shadow-sm text-pastel-blue-dark" : "text-gray-500"}`}
          >
            Đăng nhập
          </button>
          <button 
            onClick={() => setIsLoginMode(false)}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${!isLoginMode ? "bg-white shadow-sm text-pastel-blue-dark" : "text-gray-500"}`}
          >
            Đăng ký
          </button>
        </div>

        {/* --- SIGN IN PANEL --- */}
        <div className={`absolute top-0 left-0 w-full md:w-1/2 h-full flex flex-col justify-center p-8 md:p-12 transition-all duration-700 ease-in-out ${isLoginMode ? "opacity-100 z-20 translate-x-0" : "opacity-0 z-0 translate-x-[100%] md:translate-x-full pointer-events-none"}`}>
          <div className="text-center mb-8 mt-4 md:mt-0">
            <h2 className="text-3xl font-bold mb-2 text-gray-800">Đăng Nhập</h2>
            <p className="text-gray-500 text-sm">Chào mừng trở lại! Vui lòng nhập thông tin.</p>
          </div>
          
          {error && <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm font-medium border border-red-100 text-center">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider pl-1">Tài Khoản (Email)</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-pastel-blue/50 focus:border-pastel-blue transition-all"
                  placeholder="hello@temsy.com"
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-end">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider pl-1">Mật khẩu</label>
                <button type="button" className="text-xs font-semibold text-pastel-blue-dark hover:underline">
                  Quên mật khẩu?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-12 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-pastel-blue/50 focus:border-pastel-blue transition-all"
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button disabled={isLoading} className="w-full bg-gray-900 text-white py-3.5 rounded-xl font-bold mt-2 hover:bg-black transition-all active:scale-[0.98] flex items-center justify-center">
              {isLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : "Đăng Nhập"}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
            <div className="relative flex justify-center text-xs"><span className="px-4 bg-white text-gray-400 font-medium">HOẶC</span></div>
          </div>
          
          <button onClick={handleGoogleSignIn} disabled={isLoading} className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 py-3.5 rounded-xl font-bold text-gray-700 hover:bg-gray-50 transition-all active:scale-[0.98]">
             <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 15.01 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
             Google
          </button>
        </div>

        {/* --- SIGN UP PANEL --- */}
        <div className={`absolute top-0 left-0 w-full md:w-1/2 h-full flex flex-col justify-center p-8 md:p-12 transition-all duration-700 ease-in-out ${!isLoginMode ? "opacity-100 z-20 translate-x-0" : "opacity-0 z-0 -translate-x-[100%] md:-translate-x-full pointer-events-none"}`}>
          <div className="text-center mb-8 mt-4 md:mt-0">
            <h2 className="text-3xl font-bold mb-2 text-gray-800">Tạo Tài Khoản</h2>
            <p className="text-gray-500 text-sm">Tham gia cộng đồng sưu tầm ngay hôm nay.</p>
          </div>

          {error && <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm font-medium border border-red-100 text-center">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider pl-1">Nickname (Tên hiển thị)</label>
              <div className="relative">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-pastel-blue/50 focus:border-pastel-blue transition-all"
                  placeholder="Nguyễn Văn A"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider pl-1">Tài Khoản (Email)</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-pastel-blue/50 focus:border-pastel-blue transition-all"
                  placeholder="hello@temsy.com"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider pl-1">Mật khẩu</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-12 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-pastel-blue/50 focus:border-pastel-blue transition-all"
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button disabled={isLoading} className="w-full bg-pastel-blue text-white py-3.5 rounded-xl font-bold mt-2 hover:bg-pastel-blue-dark transition-all active:scale-[0.98] flex items-center justify-center">
              {isLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : "Đăng Ký Ngay"}
            </button>
          </form>
        </div>

        {/* --- OVERLAY PANEL (Desktop Only) --- */}
        <div className={`hidden md:block absolute top-0 left-1/2 w-1/2 h-full overflow-hidden transition-transform duration-700 ease-in-out z-50 ${isLoginMode ? "translate-x-0" : "-translate-x-full"}`}>
          <div className={`bg-pastel-blue w-[200%] h-full absolute top-0 left-[-100%] transition-transform duration-700 ease-in-out ${isLoginMode ? "translate-x-1/2" : "translate-x-0"}`}>
            
            {/* Overlay Left Content (Shown when Registering) */}
            <div className={`absolute w-1/2 h-full flex flex-col items-center justify-center p-12 text-center text-white transition-all duration-700 ${isLoginMode ? "-translate-x-[20%] opacity-0" : "translate-x-0 opacity-100"}`}>
              <h2 className="text-4xl font-bold mb-4 drop-shadow-sm">Chào mừng trở lại!</h2>
              <p className="mb-8 text-white/90 text-lg">Nếu bạn đã có tài khoản, hãy đăng nhập để tiếp tục khám phá Temsy nhé.</p>
              <button 
                onClick={() => { setIsLoginMode(true); setError(""); }}
                className="px-10 py-3 rounded-full border-2 border-white text-white font-bold hover:bg-white hover:text-pastel-blue-dark transition-colors"
              >
                Đăng Nhập
              </button>
            </div>

            {/* Overlay Right Content (Shown when Logging In) */}
            <div className={`absolute right-0 w-1/2 h-full flex flex-col items-center justify-center p-12 text-center text-white transition-all duration-700 ${isLoginMode ? "translate-x-0 opacity-100" : "translate-x-[20%] opacity-0"}`}>
              <h2 className="text-4xl font-bold mb-4 drop-shadow-sm">Người mới?</h2>
              <p className="mb-8 text-white/90 text-lg">Đăng ký tài khoản ngay để tạo ra những con tem mang phong cách của riêng bạn.</p>
              <button 
                onClick={() => { setIsLoginMode(false); setError(""); }}
                className="px-10 py-3 rounded-full border-2 border-white text-white font-bold hover:bg-white hover:text-pastel-blue-dark transition-colors"
              >
                Đăng Ký
              </button>
            </div>
            
          </div>
        </div>

      </div>
    </div>
  );
}
