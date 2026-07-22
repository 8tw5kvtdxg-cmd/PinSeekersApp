import type { Metadata } from "next";
import { DevConsoleFilter } from "@/app/components/dev-console-filter";
import { SiteFooter } from "@/app/components/site-footer";
import { SiteHeader } from "@/app/components/site-header";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pin2Win | Golf Challenges",
  description:
    "QR-powered golf simulator hole-in-one challenges for venues and players.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <DevConsoleFilter />
      </head>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <SiteHeader />
        <div className="pt-[72px]">{children}</div>
        <SiteFooter />
      </body>
    </html>
  );
}
