/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  webpack: (config) => {
    // pdfjs-dist uses canvas optionally — exclude from client bundle
    config.resolve.alias.canvas = false;
    return config;
  },
}

export default nextConfig
