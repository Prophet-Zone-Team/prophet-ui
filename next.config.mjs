/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: "/trade/:slug/pro",
        destination: "/trade/team/:slug",
        permanent: true
      }
    ];
  }
};

export default nextConfig;
