/** @type {import('next').NextConfig} */
const isTauri = process.env.BUILD_TARGET === 'tauri';
const nextConfig = {
  output: isTauri ? 'export' : undefined,
  images: { unoptimized: true },
  trailingSlash: true,
  reactStrictMode: false
};

export default nextConfig;
