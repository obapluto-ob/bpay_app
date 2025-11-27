/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: process.env.NODE_ENV === 'production' 
      ? 'https://your-backend-url.onrender.com/api'
      : 'http://localhost:3001/api'
  },
  images: {
    domains: ['res.cloudinary.com', 'your-backend-url.onrender.com', 'images.unsplash.com', 'cdn-icons-png.flaticon.com']
  },
  async rewrites() {
    return process.env.NODE_ENV === 'development' ? [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3001/api/:path*'
      }
    ] : []
  }
}

module.exports = nextConfig