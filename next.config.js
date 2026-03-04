/** @type {import('next').NextConfig} */
const nextConfig = {
	reactStrictMode: true,
	// Empty turbopack config for Next.js 16 (uses Turbopack by default)
	turbopack: {},
	eslint: {
		// Next.js 15 built-in ESLint integration passes legacy options (useEslintrc, extensions)
		// that are incompatible with flat config (eslint.config.mjs). Lint separately via `npm run lint`.
		ignoreDuringBuilds: true,
	},
};

export default nextConfig;
