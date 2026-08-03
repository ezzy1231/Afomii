/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@urbanexplore/shared", "@urbanexplore/database"],
  output: "standalone",
};

module.exports = nextConfig;
