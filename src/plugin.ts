import * as path from "path";
import chalk from "chalk";
import { MapLike } from "typescript";
import { readConfigFile } from "./read-config-file";
import * as Options from "./options";
import * as logger from "./logger";

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
  join(relativePath: string, innerRequest: Request | string): string;
}

type ResolverCallback = (request: Request, callback: Callback) => void;

interface Mapping {
  onlyModule: boolean;
  alias: string;
  aliasPattern: RegExp;
  target: string;
}

type CreateInnerCallback = (
  callback: Callback,
  options: Callback,
  message?: string,
  messageOptional?: string
) => Callback;
type getInnerRequest = (resolver: Resolver, request: Request) => string;

interface Request {
  request?: Request | string;
  path: string;
  relativePath: string;
  module: boolean;
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

function escapeRegExp(str: string): string {
  return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}

export class TsConfigPathsPlugin implements ResolverPlugin {
  source: string;
  target: string;

  baseUrl: string;
  mappings: Array<Mapping>;
  absoluteBaseUrl: string;

  constructor(rawOptions: Partial<Options.Options> = {}) {
    this.source = "described-resolve";
    this.target = "resolve";

    const options = Options.getOptions(rawOptions);

    const colors = new chalk.constructor({ enabled: options.colors });
    const log = logger.makeLogger(options, colors);

    const context = options.context || process.cwd();
    const { configFilePath, baseUrl, paths = {} } = readConfigFile(
      context,
      options.compiler,
      options.configFile
    );

    log.logInfo(
      `tsconfig-paths-webpack-plugin: Using config file at ${configFilePath}`
    );

    this.baseUrl = baseUrl;
    this.absoluteBaseUrl = path.resolve(
      path.dirname(configFilePath),
      this.baseUrl || "./"
    );
    console.log(paths);
    // Fill this.mappings
    this.mappings = createMappings(paths);
  }

  apply(resolver: Resolver): void {
    const { baseUrl, mappings } = this;
    console.log("baseurl", baseUrl);
    if (mappings.length > 0 && !baseUrl) {
      throw new Error(
        "If you have paths in your tsconfig.json, you need to specify baseUrl."
      );
    }

    if (!baseUrl) {
      // Nothing to do if there is no baseUrl
      return;
    }

    // This is for the baseUrl
    resolver.apply(
      new modulesInRootPlugin("module", this.absoluteBaseUrl, "resolve")
    );

    mappings.forEach(mapping => {
      // skip "phantom" type references
      if (!isTyping(mapping.target)) {
        resolver.plugin(
          this.source,
          createPlugin(resolver, mapping, this.absoluteBaseUrl, this.target)
        );
      }
    });
  }
}

function createMappings(paths: MapLike<Array<string>>): Array<Mapping> {
  const mappings: Array<Mapping> = [];
  Object.keys(paths).forEach(alias => {
    const onlyModule = alias.indexOf("*") === -1;
    const escapedAlias = escapeRegExp(alias);
    const targets = paths[alias];
    targets.forEach(target => {
      const aliasPattern = createAliasPattern(onlyModule, escapedAlias);
      mappings.push({
        onlyModule,
        alias,
        aliasPattern,
        target: target
      });
    });
  });
  return mappings;
}

function createAliasPattern(onlyModule: boolean, escapedAlias: string): RegExp {
  let aliasPattern: RegExp;
  if (onlyModule) {
    aliasPattern = new RegExp(`^${escapedAlias}$`);
  } else {
    console.log("escapedAlias", escapedAlias);
    const withStarCapturing = escapedAlias.replace("\\*", "(.*)");
    console.log("withStarCapturing", withStarCapturing);
    aliasPattern = new RegExp(`^${withStarCapturing}`);
  }
  return aliasPattern;
}

function isTyping(target: string): boolean {
  return target.indexOf("@types") !== -1 || target.indexOf(".d.ts") !== -1;
}

function createPlugin(
  resolver: Resolver,
  mapping: Mapping,
  absoluteBaseUrl: string,
  target: string
): ResolverCallback {
  return (request, callback) => {
    const innerRequest = getInnerRequest(resolver, request);
    if (!innerRequest) {
      return callback();
    }

    const match = innerRequest.match(mapping.aliasPattern);
    if (!match) {
      return callback();
    }

    if (!request.module) {
      return callback();
    }
    console.log("relativepath", request.relativePath);
    let newRequestStr = mapping.target;
    if (!mapping.onlyModule) {
      console.log(newRequestStr);
      newRequestStr = newRequestStr.replace("*", match[1]);
      console.log(newRequestStr);
      // console.log(request);
      // process.exit(0);
    }

    const newRequest = {
      ...request,
      path: absoluteBaseUrl,
      request: newRequestStr
    };

    return resolver.doResolve(
      target,
      newRequest,
      "aliased with mapping '" +
        innerRequest +
        "': '" +
        mapping.alias +
        "' to '" +
        newRequestStr +
        "'",
      createInnerCallback((err: Error, result: string): void => {
        if (arguments.length > 0) {
          return callback(err, result);
        }

        // don't allow other aliasing or raw request
        callback(null, null);
      }, callback)
    );
  };
}
