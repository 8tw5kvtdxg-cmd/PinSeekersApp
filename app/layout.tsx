import type { Metadata } from "next";
import { SiteHeader } from "@/app/components/site-header";
import "./globals.css";

export const metadata: Metadata = {
  title: "PinSeekers | Golf Challenges",
  description:
    "QR-powered golf simulator challenges for venues, players, and live leaderboards.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <SiteHeader />
        <div className="pt-[72px]">{children}</div>
      </body>
    </html>
  );
}
