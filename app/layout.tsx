import type { Metadata } from "next";
import { SiteFooter } from "@/app/components/site-footer";
import { SiteHeader } from "@/app/components/site-header";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pin2Win | Golf Entertainment for Simulator Venues",
  description:
    "QR-powered golf entertainment, simulator challenge access, and partner marketing tools for indoor golf simulator venues.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <SiteHeader />
        <div className="pt-[72px]">{children}</div>
        <SiteFooter />
      </body>
    </html>
  );
}
