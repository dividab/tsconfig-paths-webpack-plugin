import chalk from "chalk";
import * as TsconfigPaths from "tsconfig-paths";
import * as path from "path";
import * as Options from "./options";
import * as Logger from "./logger";

interface ResolverPlugin {
  apply(resolver: Resolver): void;
}

interface Resolver {
  apply(plugin: ResolverPlugin): void;
  plugin(source: string, cb: ResolverCallback): void;
  doResolve(
    target: string,
    req: Request,
    desc: string,
    callback: Callback
  ): void;
  join(relativePath: string, innerRequest: Request): Request;
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
  request?: Request | string;
  relativePath: string;
  path: string;
  context: {
    issuer: string;
  };
}

interface Callback {
  (err?: Error, result?: string): void;
  log?: string;
  stack?: string;
  missing?: string;
}

const modulesInRootPlugin: new (
  a: string,
  b: string,
  c: string
) => ResolverPlugin = require("enhanced-resolve/lib/ModulesInRootPlugin");

const createInnerCallback: CreateInnerCallback = require("enhanced-resolve/lib/createInnerCallback");
const getInnerRequest: getInnerRequest = require("enhanced-resolve/lib/getInnerRequest");

export class TsconfigPathsPlugin implements ResolverPlugin {
  source: string;
  target: string;

  log: Logger.Logger;
  baseUrl: string;
  absoluteBaseUrl: string;
  extensions: ReadonlyArray<string>;

  matchPath: TsconfigPaths.MatchPath;

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
      this.matchPath = TsconfigPaths.createMatchPath(
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

    // This is for the baseUrl
    resolver.apply(
      new modulesInRootPlugin("module", this.absoluteBaseUrl, "resolve")
    );

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
  matchPath: TsconfigPaths.MatchPath,
  resolver: Resolver,
  absoluteBaseUrl: string,
  target: string,
  extensions: ReadonlyArray<string>
): ResolverCallback {
  return (request, callback) => {
    const innerRequest = getInnerRequest(resolver, request);

    if (
      !innerRequest ||
      (innerRequest.startsWith(".") || innerRequest.startsWith(".."))
    ) {
      return callback();
    }

    const foundMatch = matchPath(
      request.context.issuer,
      innerRequest,
      undefined,
      undefined,
      extensions
    );

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
      `Resolved request '${innerRequest}' to '${
        foundMatch
      }' using tsconfig.json paths mapping`,
      createInnerCallback((err: Error, result2: string): void => {
        if (arguments.length > 0) {
          return callback(err, result2);
        }
        // don't allow other aliasing or raw request
        callback(null, null);
      }, callback)
    );
  };
}
