import * as fs from "fs";
import * as path from "path";
import * as ts from "typescript";
import * as colors from "colors/safe";
import { MapLike } from "typescript";

interface CompilerInfo {
  compilerPath: string;
  compilerVersion: string;
  tsImpl: typeof ts;
}

interface Configs {
  configFilePath: string;
  baseUrl?: string;
  paths?: MapLike<string[]>;
}

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

function setupTs(compiler: string): CompilerInfo {
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

  const compilerInfo: CompilerInfo = {
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
  compiler?: string,
  configFileName?: string
): Configs {
  const tsImpl: typeof ts = setupTs(compiler).tsImpl;

  let configFilePath: string;
  if (configFileName && configFileName.match(/\.json$/)) {
    configFilePath = absolutize(configFileName, context);
  } else {
    configFilePath = tsImpl.findConfigFile(context, tsImpl.sys.fileExists);
  }

  // const existingOptions = tsImpl.convertCompilerOptionsFromJson(
  //   config,
  //   context,
  //   "atl.query"
  // );

  const jsonConfigFile = tsImpl.readConfigFile(
    configFilePath,
    tsImpl.sys.readFile
  );
  const compilerConfig = tsImpl.parseJsonConfigFileContent(
    jsonConfigFile.config,
    tsImpl.sys,
    path.dirname(configFilePath),
    //existingOptions.options,
    {},
    configFilePath
  );

  return {
    configFilePath,
    baseUrl: compilerConfig.options.baseUrl,
    paths: compilerConfig.options.paths
  };
}
