import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import '@mantine/core/styles.css';
import "./globals.css";

import { ColorSchemeScript, MantineProvider, createTheme, mantineHtmlProps } from '@mantine/core';
import AuthProvider from "./components/AuthProvider";

const jakartaSans = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Logger Dashboard",
  description: "Advanced Discord Server Logging & Moderation",
};

const theme = createTheme({
  fontFamily: 'var(--font-jakarta), sans-serif',
  primaryColor: 'violet',
  colors: {
    violet: [
      '#f5f3ff',
      '#ede9fe',
      '#ddd6fe',
      '#c4b5fd',
      '#a78bfa',
      '#8b5cf6',
      '#7c3aed', // Our accent color
      '#6d28d9',
      '#5b21b6',
      '#4c1d95',
    ],
  }
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${jakartaSans.variable} h-full antialiased`}
      {...mantineHtmlProps}
    >
      <head>
        <ColorSchemeScript defaultColorScheme="dark" />
      </head>
      <body className="min-h-full flex flex-col m-0 p-0">
        <AuthProvider>
          <MantineProvider defaultColorScheme="dark" theme={theme}>
            {children}
          </MantineProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
