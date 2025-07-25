// pages/_app.tsx
import "../packages/styles/globals.css"; // Убедитесь, что путь правильный
import type { AppProps } from "next/app";
import { Geist, Geist_Mono } from "next/font/google";

// Инициализируем шрифты, как у вас и было
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Это главный компонент вашего приложения
function MyApp({ Component, pageProps }: AppProps) {
  return (
    // Применяем классы шрифтов к обертке
    <main className={`${geistSans.variable} ${geistMono.variable} font-sans`}>
      <Component {...pageProps} />
    </main>
  );
}

export default MyApp;
