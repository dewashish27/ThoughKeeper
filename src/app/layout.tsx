import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Life Journey",
  description: "Capture your thoughts as you travel through time.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
