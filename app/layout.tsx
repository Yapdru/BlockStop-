import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BlockStop PRO - Email & File Security",
  description: "Advanced email and file security analysis tool with DRAR AI and BetterBot PRO",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-light-bg text-gray-900">
        {children}
      </body>
    </html>
  );
}
