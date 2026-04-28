import type { Metadata } from "next";
import { IBM_Plex_Sans_Arabic } from "next/font/google"
import "@/app/globals.css"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"

const arabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-arabic",
})

export const metadata: Metadata = {
  title: "ماركت - الموقع السوري للإعلانات",
  description: "موقع الإعلانات المبوبة في سوريا",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${arabic.variable} font-sans antialiased`}
    >
      <body
        className={`${arabic.variable} font-sans antialiased min-h-screen flex flex-col`}
      >
        <Navbar />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
