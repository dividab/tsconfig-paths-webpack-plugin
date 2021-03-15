import * as webpack from "webpack";
import { Configuration } from "webpack";
const path = require("path");
import { TsconfigPathsPlugin } from "../plugin";

describe(`TsconfigPathsPlugin`, () => {
  const SETTINGS: Configuration = {
    mode: "development",
    context: path.resolve(__dirname, "src"),
    entry: `${__dirname}/../../example/src/index.ts`,
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

    const testSettings: Configuration = {
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

  it(`Test to ensure Apply exists and is working`, async (done) => {
    const webpackSettings: Configuration = {
      entry: `${__dirname}/../../example/src/index.ts`,
      target: "web",
      output: {
        path: path.join(__dirname, "../../temp"),
        filename: "[name].js",
      },
      mode: "development",
      resolve: {
        extensions: [
          ".ts",
          ".tsx",
          ".js",
          ".jsx",
          "ttf",
          "eot",
          "otf",
          "svg",
          "png",
          "woff",
          "woff2",
        ],
        plugins: [
          new TsconfigPathsPlugin({
            configFile: `${__dirname}/../../example/tsconfig.json`,
          }),
        ],
      },
      module: {
        rules: [],
      },
    };
    // Build compiler
    const compiler = webpack(webpackSettings);
    const pluginInstance = compiler?.options?.resolve?.plugins?.find(
      (plugin) => plugin instanceof TsconfigPathsPlugin
    );
    if (!pluginInstance) {
      return done(`TsconfigPathsPlugin not loaded in webpack settings`);
    }
    expect(pluginInstance instanceof TsconfigPathsPlugin).toBeTruthy();
    expect((pluginInstance as TsconfigPathsPlugin).apply).toBeDefined();

    // Run compiler
    compiler.run((err, stats) => {
      if (err) {
        done(err);
        return;
      }
      expect(stats).toBeDefined();
      const details = stats?.toJson();
      expect(details?.errorsCount).toEqual(0);
      done();
    });
  });
});
