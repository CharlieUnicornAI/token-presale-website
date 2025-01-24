const webpack = require("webpack");

module.exports = function override(config) {
  config.resolve.alias = {
    ...(config.resolve.alias || {}),
    process: "process/browser.js",
  };

  config.module.rules.push({
    test: /\.mjs$/,
    include: /node_modules/,
    type: "javascript/auto",
  });

  // Fallback configuration for Node.js modules
  config.resolve.fallback = {
    crypto: require.resolve("crypto-browserify"),
    stream: require.resolve("stream-browserify"),
    http: require.resolve("stream-http"),
    https: require.resolve("https-browserify"),
    zlib: require.resolve("browserify-zlib"),
    util: require.resolve("util"),
    buffer: require.resolve("buffer"),
    process: require.resolve("process/browser.js"),
  };

  config.resolve.extensions = [
    ...(config.resolve.extensions || []),
    ".mjs",
    ".js",
    ".json",
  ];

  config.plugins = (config.plugins || []).concat([
    new webpack.ProvidePlugin({
      process: "process/browser.js",
      Buffer: ["buffer", "Buffer"],
    }),
  ]);

  return config;
};
