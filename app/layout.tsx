import type { Metadata } from "next";
import { AuthProvider } from "@/components/AuthProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "NEXORA AI | One AI. Every Task.",
  description: "NEXORA AI is an all-in-one AI workspace for chat, writing, study, PDF analysis and productivity.",
  openGraph: {
    title: "NEXORA AI | One AI. Every Task.",
    description: "Write, study, analyze files and get things done in one AI workspace.",
    type: "website",
  },
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}