import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Smart Battery Calculator",
    template: "%s | Smart Battery Calculator",
  },
  description: "Solar PV battery sizing decision-support interface",
  applicationName: "Smart Battery Calculator",
  icons: { icon: "/icon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
