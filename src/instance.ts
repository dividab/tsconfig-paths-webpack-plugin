import * as fs from "fs";
import * as path from "path";
import * as ts from "typescript";
import { LoaderConfig } from "./interfaces";

export interface CompilerInfo {
  compilerPath: string;
  compilerVersion: string;
  tsImpl: typeof ts;
}

export interface Configs {
  configFilePath: string;
  compilerConfig: TsConfig;
  loaderConfig: LoaderConfig;
}

let colors = require("colors/safe");

type QueryOptions = LoaderConfig;
type TsConfig = ts.ParsedCommandLine;

const COMPILER_ERROR = colors.red(`\n\nTypescript compiler cannot be found, please add it to your package.json file:
    npm install --save-dev typescript
`);

function findTsImplPackage(inputPath: string): string {
  let pkgDir = path.dirname(inputPath);
  if (fs.readdirSync(pkgDir).find(value => value === "package.json")) {
    return path.join(pkgDir, "package.json");
  } else {
    return findTsImplPackage(pkgDir);
  }
}

export function setupTs(compiler: string): CompilerInfo {
  let compilerPath = compiler || "typescript";

  let tsImpl: typeof ts;
  let tsImplPath: string;
  try {
    tsImplPath = require.resolve(compilerPath);
    tsImpl = require(tsImplPath);
  } catch (e) {
    console.error(e);
    console.error(COMPILER_ERROR);
    process.exit(1);
  }

  const pkgPath = findTsImplPackage(tsImplPath);
  const compilerVersion = require(pkgPath).version;

  let compilerInfo: CompilerInfo = {
    compilerPath,
    compilerVersion,
    tsImpl
  };

  return compilerInfo;
}

function absolutize(fileName: string, context: string): string {
  if (path.isAbsolute(fileName)) {
    return fileName;
  } else {
    return path.join(context, fileName);
  }
}

export function readConfigFile(
  context: string,
  query: QueryOptions,
  tsImpl: typeof ts
): Configs {
  let configFilePath: string;
  if (query.configFileName && query.configFileName.match(/\.json$/)) {
    configFilePath = absolutize(query.configFileName, context);
  } else {
    configFilePath = tsImpl.findConfigFile(context, tsImpl.sys.fileExists);
  }

  const existingOptions = tsImpl.convertCompilerOptionsFromJson(
    query,
    context,
    "atl.query"
  );

  const jsonConfigFile = tsImpl.readConfigFile(
    configFilePath,
    tsImpl.sys.readFile
  );
  const compilerConfig = tsImpl.parseJsonConfigFileContent(
    jsonConfigFile.config,
    tsImpl.sys,
    path.dirname(configFilePath),
    existingOptions.options,
    configFilePath
  );

  return {
    configFilePath,
    compilerConfig,
    loaderConfig: query
  };
}
