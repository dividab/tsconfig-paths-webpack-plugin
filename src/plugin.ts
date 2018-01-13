import chalk from "chalk";
import * as TsconfigPaths from "tsconfig-paths";
import * as path from "path";
import * as Options from "./options";
import * as Logger from "./logger";
import { Stats } from "fs";

interface ResolverPlugin {
  readonly apply: (resolver: Resolver) => void;
}

interface Resolver {
  readonly apply: (plugin: ResolverPlugin) => void;
  readonly plugin: (source: string, cb: ResolverCallback) => void;
  readonly doResolve: (
    target: string,
    req: Request,
    desc: string,
    callback: Callback
  ) => void;
  readonly join: (relativePath: string, innerRequest: Request) => Request;
  // readonly extensions: ReadonlyArray<string>;
  readonly fileSystem: ResolverFileSystem;
}

interface ResolverFileSystem {
  readonly stat: (
    path: string,
    callback: (err: Error, stats: Stats) => void
  ) => void;
  readonly readdir: (
    path: string,
    callback: (err: Error, files: ReadonlyArray<string>) => void
  ) => void;
  readonly readFile: (
    path: string,
    callback: (err: Error, data: {}) => void
  ) => void;
  readonly readlink: (
    path: string,
    callback: (err: Error, linkString: string) => void
  ) => void;
  readonly readJson: (
    path: string,
    callback: (err: Error, json: {}) => void
  ) => void;
  readonly statSync: (path: string) => Stats;
  readonly readdirSync: (path: string) => ReadonlyArray<string>;
  readonly readFileSync: (path: string) => {};
  readonly readlinkSync: (path: string) => string;
  readonly readJsonSync: (path: string) => {};
}

type ResolverCallback = (request: Request, callback: Callback) => void;

type CreateInnerCallback = (
  callback: Callback,
  options: Callback,
  message?: string,
  messageOptional?: string
) => Callback;
type getInnerRequest = (resolver: Resolver, request: Request) => string;

interface Request {
  readonly request?: Request | string;
  readonly relativePath: string;
  readonly path: string;
  readonly context: {
    readonly issuer: string;
  };
}

interface Callback {
  (err?: Error, result?: string): void;
  log?: string;
  stack?: string;
  missing?: string;
}

const createInnerCallback: CreateInnerCallback = require("enhanced-resolve/lib/createInnerCallback");
const getInnerRequest: getInnerRequest = require("enhanced-resolve/lib/getInnerRequest");

export class TsconfigPathsPlugin implements ResolverPlugin {
  source: string;
  target: string;

  log: Logger.Logger;
  baseUrl: string;
  absoluteBaseUrl: string;
  extensions: ReadonlyArray<string>;

  matchPath: TsconfigPaths.MatchPathAsync;

  constructor(rawOptions: Partial<Options.Options> = {}) {
    this.source = "described-resolve";
    this.target = "resolve";

    const options = Options.getOptions(rawOptions);

    this.extensions = options.extensions;

    const colors = new chalk.constructor({ enabled: options.colors });
    this.log = Logger.makeLogger(options, colors);

    const context = options.context || process.cwd();
    const loadFrom = options.configFile || context;

    const loadResult = TsconfigPaths.loadConfig(loadFrom);
    if (loadResult.resultType === "failed") {
      this.log.logError(`Failed to load tsconfig.json: ${loadResult.message}`);
    } else {
      this.log.logInfo(
        `tsconfig-paths-webpack-plugin: Using config file at ${
          loadResult.configFileAbsolutePath
        }`
      );
      this.baseUrl = options.baseUrl || loadResult.baseUrl;
      this.absoluteBaseUrl = options.baseUrl
        ? path.resolve(options.baseUrl)
        : loadResult.absoluteBaseUrl;
      this.matchPath = TsconfigPaths.createMatchPathAsync(
        this.absoluteBaseUrl,
        loadResult.paths
      );
    }
  }

  apply(resolver: Resolver): void {
    const { baseUrl } = this;

    if (!baseUrl) {
      // Nothing to do if there is no baseUrl
      this.log.logWarning(
        "Found no baseUrl in tsconfig.json, not applying tsconfig-paths-webpack-plugin"
      );
      return;
    }

    resolver.plugin(
      this.source,
      createPlugin(
        this.matchPath,
        resolver,
        this.absoluteBaseUrl,
        this.target,
        this.extensions
      )
    );
  }
}

function createPlugin(
  matchPath: TsconfigPaths.MatchPathAsync,
  resolver: Resolver,
  absoluteBaseUrl: string,
  target: string,
  extensions: ReadonlyArray<string>
): ResolverCallback {
  const fileExistAsync = createFileExistAsync(resolver.fileSystem);
  const readJsonAsync = createReadJsonAsync(resolver.fileSystem);
  return (request, callback) => {
    const innerRequest = getInnerRequest(resolver, request);

    if (
      !innerRequest ||
      (innerRequest.startsWith(".") || innerRequest.startsWith(".."))
    ) {
      return callback();
    }

    matchPath(
      innerRequest,
      readJsonAsync,
      fileExistAsync,
      extensions,
      (err, foundMatch) => {
        if (err) {
          callback(err);
        }

        if (!foundMatch) {
          return callback();
        }

        const newRequest = {
          ...request,
          request: foundMatch,
          path: absoluteBaseUrl
        };

        return resolver.doResolve(
          target,
          newRequest,
          `Resolved request '${innerRequest}' to '${foundMatch}' using tsconfig.json paths mapping`,
          createInnerCallback((err2: Error, result2: string): void => {
            if (arguments.length > 0) {
              return callback(err2, result2);
            }
            // don't allow other aliasing or raw request
            callback(null, null);
          }, callback)
        );
      }
    );
  };
}

function createReadJsonAsync(
  filesystem: ResolverFileSystem
): TsconfigPaths.ReadJsonAsync {
  // tslint:disable-next-line:no-any
  return (path2: string, callback2: (err?: Error, content?: any) => void) => {
    filesystem.readJson(path2, (err, json) => {
      // If error assume file does not exist
      if (err || !json) {
        callback2();
        return;
      }
      callback2(undefined, json);
    });
  };
}

function createFileExistAsync(
  filesystem: ResolverFileSystem
): TsconfigPaths.FileExistsAsync {
  return (
    path2: string,
    callback2: (err?: Error, exists?: boolean) => void
  ) => {
    filesystem.stat(path2, (err: Error, stats: Stats) => {
      // If error assume file does not exist
      if (err) {
        callback2(undefined, false);
        return;
      }
      callback2(undefined, stats ? stats.isFile() : false);
    });
  };
}
