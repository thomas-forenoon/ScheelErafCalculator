import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Scheel Eraf Calculator",
  description:
    "Verdeel een groepsrekening eerlijk op basis van aankomsttijd, vertrektijd en wat iedereen heeft genomen."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl">
      <body>{children}</body>
    </html>
  );
}
