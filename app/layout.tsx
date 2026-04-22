import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Apparel Art Director",
  description: "Creative direction workflow for apparel event and retail art."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
