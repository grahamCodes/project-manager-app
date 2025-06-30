// src/app/layout.js
import "./globals.css";
import Link from "next/link";

export const metadata = {
  title: "Project Manager App",
  description: "Manage your projects and tasks seamlessly",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <header
          style={{
            padding: "1rem 2rem",
            borderBottom: "1px solid var(--color-border)",
            marginBottom: "2rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h1 style={{ margin: 0 }}>
            <Link href="/">DueList</Link>
          </h1>
          <nav style={{ display: "flex", gap: "1rem" }}>
            <Link href="/projects">Projects</Link>
            <Link href="/settings">Settings</Link>
          </nav>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
