import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'X Personal Assistant',
  description: 'AI-powered personal assistant for Twitter/X analysis and content optimization',
  keywords: ['twitter', 'ai', 'assistant', 'gemini', 'social-media'],
  authors: [{ name: 'X Personal Assistant' }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
} 