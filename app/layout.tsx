import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "BlockStop NEO - Email & File Security",
  description: "Tiered security platform with email analysis, file scanning, team collaboration, and VPN integration",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-light-bg text-gray-900">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
