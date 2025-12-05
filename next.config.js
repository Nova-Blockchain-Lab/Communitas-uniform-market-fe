/** @type {import('next').NextConfig} */
const nextConfig = {
	reactStrictMode: true,
	webpack: (config) => {
		// Fix for @metamask/sdk async-storage issue
		config.resolve.fallback = {
			...config.resolve.fallback,
			'@react-native-async-storage/async-storage': false,
		};
		return config;
	},
};

module.exports = nextConfig;
