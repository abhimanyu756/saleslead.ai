import type { Metadata } from "next";
import "./globals.css";
import AuthWrapper from "@/components/AuthWrapper";

export const metadata: Metadata = {
  title: "SalesLead.ai — Rupeezy Partner Conversion",
  description: "AI Voice Agent for Rupeezy Partner Lead Conversion",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="bg-slate-50">
        <AuthWrapper>{children}</AuthWrapper>
      </body>
    </html>
  );
}
