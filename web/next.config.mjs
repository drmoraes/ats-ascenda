/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Erros de tipo/lint DEVEM quebrar o build (nada de deploy com código torto).
  typescript: { ignoreBuildErrors: false },
  eslint: { ignoreDuringBuilds: false },
};

export default nextConfig;
