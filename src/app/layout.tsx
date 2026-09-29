import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AttireLab — Cultural Attire Design Platform",
  description:
    "Human-AI collaborative platform for cultural-aware, body-personalized, cost-optimized attire design.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-neutral-50 text-neutral-900 antialiased">
        {children}
      </body>
    </html>
  );
}
