import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ohio Microfinance Limited | Your next chapter starts here",
  description: "Explore personal and business loans with Ohio Microfinance Limited. Start your application online.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
