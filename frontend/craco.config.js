module.exports = {
    webpack: {
      configure: (webpackConfig) => {
        webpackConfig.resolve.fallback = {
          http: require.resolve('stream-http'),
          https: require.resolve('https-browserify'),
        };
        return webpackConfig;
      },
    },
  };
  