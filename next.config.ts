import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        port: "",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "covers.openlibrary.org",
      },
      {
        protocol: "https",
        hostname: "books.google.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "*.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "ui-avatars.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "m.media-amazon.com",
      },
      {
        protocol: "https",
        hostname: "ak-asset.jarir.com",
      },
      {
        protocol: "https",
        hostname: "upload.wikimedia.org",
      },
      {
        protocol: "https",
        hostname: "i.gr-assets.com",
      },
      {
        protocol: "https",
        hostname: "s.gr-assets.com",
      },
      {
        protocol: "https",
        hostname: "cc02fu17ufx0v59u.public.blob.vercel-storage.com",
      },
      {
        protocol: "https",
        hostname: "cdn.samawy.com",
      },
      {
        protocol: "https",
        hostname: "atirbooks.com",
      },
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  turbopack: {
    root: path.join(__dirname),
  },
  async redirects() {
    return [
      {
        source: '/communities/communities/:slug*',
        destination: '/communities/:slug*',
        permanent: false,
      },
    ]
  },
};

export default nextConfig;
