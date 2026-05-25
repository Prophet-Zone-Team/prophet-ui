/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: "/trade/:slug/pro",
        destination: "/trade/team?slug=:slug",
        permanent: true
      },
      {
        source: "/news/:slug",
        destination: "/news?slug=:slug",
        permanent: true
      },
      {
        source: "/team/:slug",
        destination: "/team?slug=:slug",
        permanent: true
      },
      {
        source: "/trade/team/:slug",
        destination: "/trade/team?slug=:slug",
        permanent: true
      },
      {
        source: "/trade/game/:slug",
        destination: "/trade/game?slug=:slug",
        permanent: true
      }
    ];
  }
};

export default nextConfig;
