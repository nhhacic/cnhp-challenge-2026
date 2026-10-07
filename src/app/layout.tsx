import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CNHP Challenge Thu Đông 2026 | Running Club",
  description: "Webapp theo dõi, xếp hạng và tự động tính thưởng phạt giải chạy CNHP Thu Đông 2026",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className="scroll-smooth">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className="antialiased selection:bg-orange-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
