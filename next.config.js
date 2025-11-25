/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    '@heroui/theme',
    '@heroui/system',
    '@heroui/dom-animation',
    '@heroui/framer-utils',
    '@heroui/react-utils',
  ],
  turbopack: {
    root: __dirname,
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      process.removeAllListeners('warning');
    }
    return config;
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.API_URL}/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
