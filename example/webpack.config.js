const path = require("path");
const TsConfigPathsPlugin = require("../index");

module.exports = {
  context: path.resolve(__dirname, "src"),
  entry: "./index",
  output: {
    path: path.join(__dirname, "temp"),
    filename: "bundle.js"
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /^node_modules/,
        loader: "ts-loader",
        options: {
          configFile: "./example/tsconfig.json"
        }
      }
    ]
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js"],
    plugins: [
      new TsConfigPathsPlugin({
        configFile: "./tsconfig.json",
        logLevel: "info"
      })
    ]
  }
};
