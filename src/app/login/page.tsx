"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, User as UserIcon, Eye, EyeOff, ArrowLeft } from "lucide-react";
import Image from "next/image";

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
    <div className="min-h-screen flex items-center justify-center bg-[#f2f1eb] p-4 font-sans relative overflow-hidden">
      
      {/* Background blobs for extra flavor */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#3b82f6]/10 rounded-full blur-3xl -z-10"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#ff6b6b]/10 rounded-full blur-3xl -z-10"></div>

      <Link href="/" className="absolute top-6 left-6 flex items-center gap-2 text-foreground/60 hover:text-foreground z-50">
        <ArrowLeft size={20} /> <span className="font-medium hidden md:inline">Về trang chủ</span>
      </Link>

      {/* 3D Scene Container */}
      <div className="w-full max-w-[1000px] h-auto min-h-[600px] md:h-[650px] [perspective:2000px] relative">
        
        {/* Flipper Card */}
        <div className={`w-full h-full relative transition-transform duration-1000 ease-in-out [transform-style:preserve-3d] ${isLoginMode ? "" : "[transform:rotateY(180deg)]"}`}>
          
          {/* ================= FRONT FACE (SIGN IN) ================= */}
          <div className="absolute inset-0 w-full h-full bg-white md:rounded-[2rem] rounded-3xl shadow-xl flex flex-col md:flex-row overflow-hidden [backface-visibility:hidden]">
            
            {/* Left Image Side */}
            <div className="hidden md:block w-[45%] h-full bg-[#f4f3ed] relative p-8">
              <Image 
                src="/login-illustration.jpg" 
                alt="Login Illustration" 
                fill
                style={{ objectFit: 'cover' }}
                className="rounded-3xl"
              />
              <div className="absolute top-6 left-6">
                 {/* App Logo */}
                 <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">T</div>
              </div>
            </div>

            {/* Right Form Side */}
            <div className="flex-1 p-8 md:p-12 lg:p-16 flex flex-col justify-center h-full relative">
              <div className="absolute top-8 right-8 text-sm font-medium text-gray-500">
                Chưa có tài khoản?{" "}
                <button 
                  onClick={() => {setIsLoginMode(false); setError("");}}
                  className="text-black font-bold hover:underline"
                >
                  Đăng ký
                </button>
              </div>

              <div className="max-w-sm w-full mx-auto mt-8 md:mt-0">
                <h1 className="text-4xl font-bold mb-8 text-gray-900 tracking-tight">Sign in</h1>
                
                {error && <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-600 text-sm font-medium text-center">{error}</div>}

                <div className="mb-4">
                  <p className="text-xs font-bold text-gray-400 mb-3">Đăng nhập nhanh (Open account)</p>
                  <div className="flex gap-4">
                    <button 
                      onClick={handleGoogleSignIn}
                      disabled={isLoading}
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl border border-gray-200 font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 15.01 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </svg>
                      Google
                    </button>
                    <button 
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl border border-gray-200 font-semibold text-gray-700 hover:bg-gray-50 transition-colors opacity-50 cursor-not-allowed"
                    >
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                        <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.04 2.26-.79 3.59-.76 2.47.06 4.14 1.25 5.05 3.01-4.04 2.22-3.27 7.07.6 8.54-.7 1.83-2.03 3.5-3.81 5.38zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.32 2.37-2.04 4.39-3.74 4.25z"/>
                      </svg>
                      Apple ID
                    </button>
                  </div>
                </div>

                <p className="text-xs font-bold text-gray-400 mb-4 mt-8">Hoặc đăng nhập bằng email</p>
                
                <form onSubmit={handleSubmit} className="space-y-3">
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 rounded-2xl bg-gray-50/80 border-transparent focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 font-medium transition-all"
                      placeholder="Email address"
                    />
                  </div>

                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-12 pr-12 py-4 rounded-2xl bg-gray-50/80 border-transparent focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 font-medium transition-all"
                      placeholder="Password"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>

                  <button disabled={isLoading} className="w-full bg-[#1e5af0] text-white py-4 rounded-2xl font-bold mt-4 hover:bg-[#1546c4] transition-all active:scale-[0.98] flex items-center justify-center">
                    {isLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : "Đăng Nhập"}
                  </button>
                </form>

              </div>
            </div>
          </div>

          {/* ================= BACK FACE (SIGN UP) ================= */}
          <div className="absolute inset-0 w-full h-full bg-white md:rounded-[2rem] rounded-3xl shadow-xl flex flex-col md:flex-row overflow-hidden [backface-visibility:hidden] [transform:rotateY(180deg)]">
            
            {/* Right Form Side (Actually rendered on the left visually after flip) */}
            <div className="flex-1 p-8 md:p-12 lg:p-16 flex flex-col justify-center h-full relative">
              <div className="absolute top-8 left-8 text-sm font-medium text-gray-500">
                Đã có tài khoản?{" "}
                <button 
                  onClick={() => {setIsLoginMode(true); setError("");}}
                  className="text-black font-bold hover:underline"
                >
                  Đăng nhập
                </button>
              </div>

              <div className="max-w-sm w-full mx-auto mt-8 md:mt-0">
                <h1 className="text-4xl font-bold mb-8 text-gray-900 tracking-tight">Sign up</h1>
                
                {error && <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-600 text-sm font-medium text-center">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-3">
                  <div className="relative">
                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 rounded-2xl bg-gray-50/80 border-transparent focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 font-medium transition-all"
                      placeholder="Nickname"
                    />
                  </div>
                  
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 rounded-2xl bg-gray-50/80 border-transparent focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 font-medium transition-all"
                      placeholder="Email address"
                    />
                  </div>

                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-12 pr-12 py-4 rounded-2xl bg-gray-50/80 border-transparent focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 font-medium transition-all"
                      placeholder="Password"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>

                  <button disabled={isLoading} className="w-full bg-[#1e5af0] text-white py-4 rounded-2xl font-bold mt-4 hover:bg-[#1546c4] transition-all active:scale-[0.98] flex items-center justify-center">
                    {isLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : "Đăng Ký"}
                  </button>
                </form>
              </div>
            </div>

            {/* Left Image Side (Rendered on the right after flip) */}
            <div className="hidden md:block w-[45%] h-full bg-[#f4f3ed] relative p-8">
              <Image 
                src="/login-illustration.jpg" 
                alt="Login Illustration" 
                fill
                style={{ objectFit: 'cover' }}
                className="rounded-3xl"
              />
              <div className="absolute top-6 right-6">
                 {/* App Logo */}
                 <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">T</div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
