"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminPage() {
  const router = useRouter();
  
  useEffect(() => {
    router.push("/admin/dashboard");
  }, [router]);
  
  return (
    <div className="p-8 flex items-center justify-center">
      <p className="font-patrick font-bold text-xl text-pencil/50 animate-pulse">Đang chuyển hướng...</p>
    </div>
  );
}
