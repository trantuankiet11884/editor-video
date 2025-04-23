/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https", // Chỉ chấp nhận HTTPS (bạn có thể thêm 'http' nếu cần)
        hostname: "**", // Wildcard để chấp nhận tất cả các hostname
      },
    ],
  },
};

export default nextConfig;
