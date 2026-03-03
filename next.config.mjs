/** @type {import('next').NextConfig} */
const isTauri = process.env.BUILD_TARGET === 'tauri';
const cspHeader = `default-src 'self'; img-src 'self' data:; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; font-src 'self' data:; connect-src 'self' ws:; frame-src 'none';`;

const nextConfig = {
  output: isTauri ? 'export' : undefined,
  images: { unoptimized: true },
  trailingSlash: true,
  reactStrictMode: false,
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: cspHeader,
          },
        ],
      },
    ];
  },
};

export default nextConfig;
