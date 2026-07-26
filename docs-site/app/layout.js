"use client";

import { useState } from "react";
import Sidebar from "./components/Sidebar";
import "./globals.css";

export default function RootLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <html lang="en">
      <head>
        <title>droid — Database Internals Tutorial</title>
        <meta name="description" content="Build a database engine from scratch. A step-by-step tutorial covering REPL, SQL parsing, B-trees, transactions, WAL, query optimization, and more." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <button
          className="menu-toggle"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Toggle menu"
        >
          ☰
        </button>
        <div className="site-layout">
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          <main className="main-content">{children}</main>
        </div>
      </body>
    </html>
  );
}
