import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Drug Safety Engine — Make AI Safe for Doctors",
  description: "Deterministic drug safety layer for clinical AI. Checks drug interactions, allergies, renal dosing, and clinical scores before AI responds.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
