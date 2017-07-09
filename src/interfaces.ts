import * as ts from 'typescript';

export interface CompilerInfo {
  compilerPath: string;
  compilerVersion: string;
  tsImpl: typeof ts;
}

export interface LoaderConfig {
  compiler?: string;
  configFileName?: string;
}

export type TsConfig = ts.ParsedCommandLine;
