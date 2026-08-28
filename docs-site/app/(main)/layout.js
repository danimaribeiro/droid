"use client";

import { AuthProvider } from "../components/AuthContext";
import { ThemeProvider } from "../components/ThemeContext";
import "../tailwind-variants.css";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <title>droid — Database Internals Tutorial</title>
        <meta name="description" content="Build a database engine from scratch. A step-by-step tutorial covering REPL, SQL parsing, B-trees, transactions, WAL, query optimization, and more." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap"
        />
      </head>
      <body>
        <AuthProvider>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
