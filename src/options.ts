export type LogLevel = "INFO" | "WARN" | "ERROR";

export interface Options {
  silent: boolean;
  logLevel: LogLevel;
  logInfoToStdOut: boolean;
  compiler: string;
  configFile: string;
  context: string;
  colors: boolean;
}

type ValidOptions = keyof Options;
const validOptions: ReadonlyArray<ValidOptions> = [
  "silent",
  "logLevel",
  "logInfoToStdOut",
  "compiler",
  "configFile",
  "context"
];

/**
 * Takes raw options from the webpack config,
 * validates them and adds defaults for missing options
 */
export function getOptions(rawOptions: {}): Options {
  validateOptions(rawOptions);

  const options = makeOptions(rawOptions);

  return options;
}

/**
 * Validate the supplied loader options.
 * At present this validates the option names only; in future we may look at validating the values too
 * @param rawOptions
 */
function validateOptions(rawOptions: {}): void {
  const loaderOptionKeys = Object.keys(rawOptions);
  for (let i = 0; i < loaderOptionKeys.length; i++) {
    const option = loaderOptionKeys[i];
    const isUnexpectedOption =
      (validOptions as ReadonlyArray<string>).indexOf(option) === -1;
    if (isUnexpectedOption) {
      throw new Error(`tsconfig-paths-webpack-plugin was supplied with an unexpected loader option: ${option}
Please take a look at the options you are supplying; the following are valid options:
${validOptions.join(" / ")}
`);
    }
  }
}

function makeOptions(rawOptions: Partial<Options>): Options {
  const options = Object.assign(
    {},
    {
      silent: false,
      logLevel: "WARN",
      logInfoToStdOut: false,
      compiler: "typescript",
      configFile: "tsconfig.json",
      context: undefined,
      colors: true
    } as Options,
    rawOptions
  );

  options.logLevel = options.logLevel.toUpperCase() as LogLevel;

  return options;
}
