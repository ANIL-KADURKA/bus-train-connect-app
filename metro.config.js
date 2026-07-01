// const { getDefaultConfig } = require("expo/metro-config");

// const config = getDefaultConfig(__dirname);
// module.exports = config;

const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, { input: './global.css' });