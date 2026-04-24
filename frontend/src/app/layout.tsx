import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "GlobeWatch",
  description: "A 3D crisis intelligence command center for humanitarian signals."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}
