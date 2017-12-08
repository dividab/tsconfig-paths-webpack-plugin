import * as path from "path";
import chalk from "chalk";
import { MapLike } from "typescript";
import { readConfigFile } from "./read-config-file";
import * as Options from "./options";
import * as logger from "./logger";
// tslint:disable-next-line:variable-name
const TsconfigPaths = require("tsconfig-paths");

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
      this.baseUrl || "."
    );

    // Fill this.mappings
    this.mappings = createMappings(paths);
  }

  apply(resolver: Resolver): void {
    const { baseUrl, mappings } = this;

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

    resolver.plugin(
      this.source,
      createPlugin(resolver, this.absoluteBaseUrl, mappings, this.target)
    );

    // mappings.forEach(mapping => {
    //   // skip "phantom" type references
    //   if (!isTyping(mapping.target)) {
    //     resolver.plugin(
    //       this.source,
    //       createPlugin(resolver, mapping, this.absoluteBaseUrl, this.target)
    //     );
    //   }
    // });
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
    const withStarCapturing = escapedAlias.replace("\\*", "(.*)");
    aliasPattern = new RegExp(`^${withStarCapturing}`);
  }
  return aliasPattern;
}

// function isTyping(target: string): boolean {
//   return target.indexOf("@types") !== -1 || target.indexOf(".d.ts") !== -1;
// }

function createPlugin(
  resolver: Resolver,
  absoluteBaseUrl: string,
  mappings: Array<Mapping>,
  target: string
): ResolverCallback {
  return (request, callback) => {
    const innerRequest = getInnerRequest(resolver, request);

    if (!innerRequest) {
      return callback();
    }

    if (innerRequest.startsWith(".") || innerRequest.startsWith("..")) {
      return callback();
    }

    // const matchPath = TsconfigPaths.createMatchPath("/root/", {
    //   "lib/*": ["foo1/*", "foo2/*", "location/*", "foo3/*"]
    // });
    // const result = matchPath(
    //   "/root/test.ts",
    //   "lib/mylib",
    //   (_: string): string => undefined,
    //   (name: string) => {
    //     console.log("name", name);
    //     return name === "\\root\\location\\mylib\\index.ts";
    //   },
    //   [".ts"]
    // );
    // console.log(result, "/root/location/mylib");

    console.log(mappings);

    const matchPath = TsconfigPaths.createMatchPath(absoluteBaseUrl, {
      foo: ["./src/mapped/foo"],
      "bar/*": ["./src/mapped/bar/*"]
    });

    const foundMatch = matchPath(
      request.context.issuer,
      innerRequest,
      undefined,
      undefined,
      [".ts", ".tsx"]
    );
    console.log("request.context.issuer", request.context.issuer);
    console.log("innerRequest", innerRequest);
    console.log("OLLE---->");

    if (!foundMatch) {
      return callback();
    }

    // const match = innerRequest.match(mapping.aliasPattern);
    // if (!match) {
    //   return callback();
    // }

    // let newRequestStr = mapping.target;
    // if (!mapping.onlyModule) {
    //   newRequestStr = newRequestStr.replace("*", match[1]);
    // }

    // if (newRequestStr[0] === ".") {
    //   newRequestStr = path.resolve(absoluteBaseUrl, newRequestStr);
    // }

    // const newRequestStr = path.resolve("./", innerRequest);

    // let foundMapping;
    // for (const mapping of mappings) {
    //   const match = innerRequest.match(mapping.aliasPattern);
    //   if (match) {
    //     foundMapping = mapping;
    //     break;
    //   }
    // }

    // if (!foundMapping) {
    //   return callback();
    // }

    // console.log("filePath", (request as any).filePath);
    // tslint:disable-next-line:no-any
    // console.log("------------------> request", (request as any).path);

    // const fullTargetPath = path.join(absoluteBaseUrl, foundMapping.target);
    // const fullPathToImporter = path.resolve(request.path);
    // const relativeTargetPath =
    //   "./" + path.relative(fullPathToImporter, fullTargetPath);

    // console.log("fullTargetPath    ", fullTargetPath);
    // console.log("fullPathToImporter", fullPathToImporter);
    // console.log("relativeTargetPath", relativeTargetPath);

    // const mapping = mappings[0];

    const newRequest = {
      ...request,
      // request: "./mapped/foo"
      request: foundMatch,
      path: absoluteBaseUrl
      // relativePath: foundMatch
    };

    return resolver.doResolve(
      target,
      newRequest,
      // `aliased with mapping '${innerRequest}': '${foundMapping.alias}' to '${
      //   relativeTargetPath
      // }'`,
      "sdfadf",
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
