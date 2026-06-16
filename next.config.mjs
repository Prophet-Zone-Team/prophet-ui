import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    webpackMemoryOptimizations: true,
    // Lower build parallelism to reduce peak memory on Cloudflare Workers Builds.
    cpus: 4
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**"
      }
    ]
  },
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
      },
      {
        source: "/landing",
        destination: "/referral",
        permanent: true
      },
      {
        source: "/landing/:path*",
        destination: "/referral/:path*",
        permanent: true
      }
    ];
  }
};

export default withNextIntl(nextConfig);
