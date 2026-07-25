/** @type {import('next').NextConfig} */
const config = {
  // Keep firebase-admin (and its CJS deps) outside the Next bundle so
  // jwks-rsa can resolve its jose dependency correctly on Vercel.
  experimental: {
    serverComponentsExternalPackages: ['firebase-admin'],
  },
}

export default config
