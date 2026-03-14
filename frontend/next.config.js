/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    // Resolve from frontend so tailwindcss and other deps are found in frontend/node_modules
    root: __dirname,
  },
};

module.exports = nextConfig;
