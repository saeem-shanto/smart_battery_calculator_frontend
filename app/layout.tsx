import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Smart Battery Calculator",
  description: "Solar PV battery sizing decision-support interface",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
