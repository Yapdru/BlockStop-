import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./styles/responsive-utilities.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "BlockStop NEO - Email & File Security",
  description: "Tiered security platform with email analysis, file scanning, team collaboration, and VPN integration",
  formatDetection: {
    telephone: false,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  minimumScale: 1,
  userScalable: true,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Responsive viewport configuration */}
        <meta charSet="UTF-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />

        {/* Disable automatic phone number detection */}
        <meta name="format-detection" content="telephone=no" />

        {/* iOS web app configuration */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="BlockStop" />

        {/* Theme color for browser chrome */}
        <meta name="theme-color" content="#1f2937" />

        {/* Safe area configuration for notched devices */}
        <meta name="viewport-fit" content="cover" />

        {/* Disable zoom on input focus for iOS */}
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes, viewport-fit=cover" />
      </head>
      <body className="bg-light-bg text-gray-900">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
