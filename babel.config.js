module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./src'],
        extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
        alias: {
          '@app': './src/app',
          '@core': './src/core',
          '@domain': './src/domain',
          '@data': './src/data',
          '@presentation': './src/presentation',
          '@store': './src/store',
        },
      },
    ],
  ],
};
