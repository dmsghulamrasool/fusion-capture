import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { SessionProviderWrapper } from "@/components/providers/SessionProviderWrapper";
import { AuthProvider } from "@/contexts/AuthContext";
import { Navbar } from "@/components/navigation/Navbar";
import { Footer } from "@/components/layout/Footer";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Fusion Capture",
  description:
    "Fusion Capture - SSO authentication and role-based access control",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        <SessionProviderWrapper>
          <AuthProvider>
            <div className="flex flex-col min-h-screen">
              <Navbar />
              <main className="flex-1">{children}</main>
              <Footer />
            </div>
          </AuthProvider>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
