import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Médico Amigo API",
  description: "Backend de l’app Médico Amigo",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-PT">
      <body>{children}</body>
    </html>
  );
}