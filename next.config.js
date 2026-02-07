/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'export',
    // We need to allow loading WASM files
    webpack: (config, { isServer }) => {
        // Enable WASM
        config.experiments = { ...config.experiments, asyncWebAssembly: true, layers: true };
        
        // Fix for "Module not found: Can't resolve 'fs'" in some WASM packages
        if (!isServer) {
            config.resolve.fallback = {
                ...config.resolve.fallback,
                fs: false,
            };
        }

        return config;
    },
};

module.exports = nextConfig;