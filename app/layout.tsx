import type { Metadata, Viewport } from "next";
import "./globals.css";
import Shell from "@/components/Shell";

export const metadata: Metadata = {
  title: { default: "Versek", template: "%s · Versek" },
  description: "Versek, költők és olvasók egy helyen: napi versajánló, klasszikusok, közösségi versek, gyűjtemények és közös felolvasások.",
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" };

// Az évszak és a téma még festés előtt beáll, hogy ne villanjon.
const boot = `try{var s=JSON.parse(localStorage.getItem("versek")||"{}"),d=new Date(),m=d.getMonth()+1,n=d.getDate(),a=(m===12||m<=2||(m===11&&n>=20))?"tel":m<=5?"tavasz":m<=8?"nyar":"osz";document.documentElement.dataset.season=(s.season&&s.season!=="auto")?s.season:a;document.documentElement.dataset.theme=s.theme==="dark"?"dark":"light"}catch(e){document.documentElement.dataset.season="tel"}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="hu" data-season="tel" data-theme="light" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: boot }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&family=EB+Garamond:ital,wght@0,400;0,500;1,400&family=Jost:wght@400;500&display=swap" rel="stylesheet" />
      </head>
      <body><Shell>{children}</Shell></body>
    </html>
  );
}
