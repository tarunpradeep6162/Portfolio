/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
    tsconfigPath: './tsconfig.json',
  },
  webpack: (config, { isServer }) => {
    // Exclude mobile app from build
    config.module.rules.push({
      test: /mobile\//,
      loader: require.resolve('ignore-loader'),
    });
    return config;
  },
};

module.exports = nextConfig;
