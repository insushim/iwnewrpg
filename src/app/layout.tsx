import type { Metadata } from "next";
import { MedievalSharp, Noto_Sans_KR } from "next/font/google";
import "./globals.css";

const fantasyFont = MedievalSharp({
  variable: "--font-fantasy",
  weight: "400",
  subsets: ["latin"],
});

const uiFont = Noto_Sans_KR({
  variable: "--font-ui",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "룬워드 크로니클",
  description: "고전 MMORPG 감성과 단어 퀴즈를 결합한 웹 게임 프로토타입",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${fantasyFont.variable} ${uiFont.variable} antialiased`}>{children}</body>
    </html>
  );
}
