module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Add polyfill fallbacks for Node.js modules
      webpackConfig.resolve.fallback = {
        ...webpackConfig.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
      
      return webpackConfig;
    },
  },
};
