/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  env: {
    NEXT_PUBLIC_CLOUD_RUN_SERVICE: process.env.K_SERVICE || 'local',
    NEXT_PUBLIC_CLOUD_RUN_REVISION: process.env.K_REVISION || 'local',
    NEXT_PUBLIC_CLOUD_RUN_CONFIGURATION: process.env.K_CONFIGURATION || 'local',
  },
}

module.exports = nextConfig