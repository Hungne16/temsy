import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { SplashScreen } from "@/components/SplashScreen";
import { FloatingDock } from "@/components/FloatingDock";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});


export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#fbfbf9",
};

export const metadata: Metadata = {
  title: "Temsy - Biến ảnh thành tem kỷ niệm",
  description: "Ứng dụng sưu tầm tem kỹ thuật số, biến mỗi khoảnh khắc thành một con tem lưu giữ.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Temsy",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background text-foreground">
        <AuthProvider>
          <SplashScreen>
            <main className="w-full max-w-7xl mx-auto pb-32">
              {children}
            </main>
            <FloatingDock />
          </SplashScreen>
        </AuthProvider>
      </body>
    </html>
  );
}
