import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CineCircle | Movie playlists for your people",
  description: "Collect, share, and discover movies with your circle.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
