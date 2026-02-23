// Example babel.config.js for a React Native app
// Place this in your React Native app's root directory

module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    // Only active in dev mode
    ...(process.env.NODE_ENV !== 'production'
      ? ['babel-plugin-rn-debug-mcp']
      : []),
  ],
};
