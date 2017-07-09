const path = require('path');

module.exports = {
  context: path.resolve(__dirname, 'src'),
  devtool: 'sourcemap',
  entry: './index',
  output: {
    path: path.join(__dirname, 'temp'),
    filename: 'bundle.js',
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /^node_modules/,
        loader: "ts-loader",
        options: {
          configFileName: "./example/tsconfig.json",
        }
      },
    ]
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js"],
    // plugins: [
    //   new atl.TsConfigPathsPlugin({ configFileName: "./src/client/tsconfig.json" })
    // ]
  },
};
