import * as webpack from "webpack";
import { Configuration } from "webpack";
const path = require("path");
import { TsconfigPathsPlugin } from "../plugin";

describe(`TsconfigPathsPlugin`, () => {
  const SETTINGS: Configuration = {
    mode: "development",
    context: path.resolve(__dirname, "src"),
    entry: `../../../example/src/index.ts`,
    output: {
      path: path.join(__dirname, "../../temp"),
      filename: "bundle.js",
    },
    module: {
      rules: [
        {
          test: /\\.tsx?$/,
          exclude: /^node_modules/,
          loader: "ts-loader",
          options: {
            configFile: "./example/tsconfig.json",
          },
        },
      ],
    },
    resolve: {
      extensions: [".ts", ".tsx", ".js"],
    },
  };

  it(`Can initialize the plugin`, async (done) => {
    const testPlugin = new TsconfigPathsPlugin({
      configFile: `${__dirname}/../../example/tsconfig.json`,
      logLevel: "INFO",
      extensions: [".ts", ".tsx"],
      mainFields: ["browser", "main"],
    });
    expect(testPlugin).toBeInstanceOf(TsconfigPathsPlugin);

    const testSettings: webpack.Configuration = {
      ...SETTINGS,
      resolve: {
        extensions: [".ts", ".tsx", ".js"],
        plugins: [testPlugin],
      },
    };

    const compiler = webpack(testSettings);

    compiler.run((err, stats) => {
      if (err) {
        done(err);
        return;
      }
      expect(stats).toBeDefined();
      const details = stats?.toJson();
      expect(details?.errorsCount).toEqual(0);
      // TODO There should probably be a test that verifies the stats match what is expected
      done();
    });
  });
});
