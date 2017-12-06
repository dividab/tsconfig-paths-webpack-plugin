import { readConfigFile } from "./read-config-file";
import * as path from "path";

interface LoaderConfig {
  compiler?: string;
  configFileName?: string;
}

interface PathPluginOptions {
  context?: string;
}

interface ResolverPlugin {
  apply(resolver: Resolver): void;
}

interface Resolver {
  apply(plugin: ResolverPlugin): void;
  plugin(source: string, cb: ResolverCallback): any;
  doResolve(target: string, req: Request, desc: string, callback: any): any;
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
  request?: Request;
  relativePath: string;
}

interface Callback {
  (err?: Error, result?: any): void;
  log?: any;
  stack?: any;
  missing?: any;
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

  constructor(config: LoaderConfig & PathPluginOptions = {}) {
    this.source = "described-resolve";
    this.target = "resolve";

    const context = config.context || process.cwd();
    const { configFilePath, baseUrl, paths } = readConfigFile(
      context,
      config.compiler,
      config.configFileName
    );

    console.log(`tsconfig-paths-webpack-plugin: Using ${configFilePath}`);

    this.baseUrl = baseUrl;
    this.absoluteBaseUrl = path.resolve(
      path.dirname(configFilePath),
      this.baseUrl || "."
    );

    this.mappings = [];
    const paths2 = paths || {};
    Object.keys(paths2).forEach(alias => {
      let onlyModule = alias.indexOf("*") === -1;
      let excapedAlias = escapeRegExp(alias);
      let targets = paths2[alias];
      targets.forEach(target => {
        let aliasPattern: RegExp;
        if (onlyModule) {
          aliasPattern = new RegExp(`^${excapedAlias}$`);
        } else {
          let withStarCapturing = excapedAlias.replace("\\*", "(.*)");
          aliasPattern = new RegExp(`^${withStarCapturing}`);
        }

        this.mappings.push({
          onlyModule,
          alias,
          aliasPattern,
          target: target
        });
      });
    });
  }

  apply(resolver: Resolver): void {
    const { baseUrl, mappings } = this;

    if (baseUrl) {
      resolver.apply(
        new modulesInRootPlugin("module", this.absoluteBaseUrl, "resolve")
      );
    }

    mappings.forEach(mapping => {
      // skip "phantom" type references
      if (!this.isTyping(mapping.target)) {
        resolver.plugin(this.source, this.createPlugin(resolver, mapping));
      }
    });
  }

  private isTyping(target: string): boolean {
    return target.indexOf("@types") !== -1 || target.indexOf(".d.ts") !== -1;
  }

  private createPlugin(resolver: Resolver, mapping: Mapping): any {
    return (request, callback) => {
      const innerRequest = getInnerRequest(resolver, request);
      if (!innerRequest) {
        return callback();
      }

      const match = innerRequest.match(mapping.aliasPattern);
      if (!match) {
        return callback();
      }

      let newRequestStr = mapping.target;
      if (!mapping.onlyModule) {
        newRequestStr = newRequestStr.replace("*", match[1]);
      }

      if (newRequestStr[0] === ".") {
        newRequestStr = path.resolve(this.absoluteBaseUrl, newRequestStr);
      }

      // const newRequest = _.extend({}, request, {
      //   request: newRequestStr
      // });

      const newRequest = {
        ...request,
        request: newRequestStr
      };

      return resolver.doResolve(
        this.target,
        newRequest,
        "aliased with mapping '" +
          innerRequest +
          "': '" +
          mapping.alias +
          "' to '" +
          newRequestStr +
          "'",
        createInnerCallback(function(err: any, result: any): any {
          if (arguments.length > 0) {
            return callback(err, result);
          }

          // don't allow other aliasing or raw request
          callback(null, null);
        }, callback)
      );
    };
  }
}
