/** @type {import('next').NextConfig} */

const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "media.shamna.shop"  // your R2 public domain
      },
      {
        protocol: "https",
        hostname: "pub-55de6def6b564829a1b582ca1460bbbd.r2.dev" // fallback if using r2.dev URLs
      },
      {
        protocol: "https",
        hostname: "**.r2.cloudflarestorage.com" // fallback if using r2.dev URLs
      }
    ]
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL}/:path*`,
      }
    ]
  }
}

export default nextConfig