export { TsconfigPathsPlugin } from "./plugin";
import { TsconfigPathsPlugin } from "./plugin";
export default TsconfigPathsPlugin;

// This is to make it importable in all these ways
// const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
// import TsconfigPathsPlugin from "tsconfig-paths-webpack-plugin";
// import { TsconfigPathsPlugin } from "tsconfig-paths-webpack-plugin";
const theClass = require("./plugin").TsconfigPathsPlugin;
theClass.TsconfigPathsPlugin = TsconfigPathsPlugin;
theClass.default = TsconfigPathsPlugin;
module.exports = theClass;
