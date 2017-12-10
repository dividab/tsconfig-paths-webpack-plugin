# tsconfig-paths-webpack-plugin

[![npm version][version-image]][version-url]
[![code style: prettier][prettier-image]][prettier-url]
[![MIT license][license-image]][license-url]

Use this to load modules whose location is specified in the `paths` section of
`tsconfig.json` when using webpack.

## How to install

```
yarn add --dev tsconfig-paths-webpack-plugin
```

or

```
npm install --save-dev tsconfig-paths-webpack-plugin
```

## How to use

In your webpack config add this:

```js
var TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');

module.exports = {
  ...
  resolve: {
    plugins: [new TsconfigPathsPlugin({ /*configFile: "./path/to/tsconfig.json" */ })]
  }
  ...
}
```

## Options

#### configFile _(string) (default='tsconfig.json')_

Allows you to specify where to find the TypeScript configuration file.

You may provide

* just a file name. The plugin will search for the filename using the built-in
  logic in the `tsconfig-paths` package. The search will start at `cwd`.
* a relative path to the configuration file. It will be resolved relative to
  `cwd`.
* an absolute path to the configuration file.

> The use of `cwd` as default above is not optimal but we've found no better
> solution yet. If you have a suggestion please file an issue.

#### silent _(boolean) (default=false)_

If true, no console.log messages will be emitted. Note that most error messages
are emitted via webpack which is not affected by this flag.

#### logLevel _(string) (default=warn)_

Can be `info`, `warn` or `error` which limits the log output to the specified
log level. Beware of the fact that errors are written to stderr and everything
else is written to stderr (or stdout if logInfoToStdOut is true).

#### colors _(boolean) (default=true)_

If `false`, disables built-in colors in logger messages.

#### logInfoToStdOut _(boolean) (default=false)_

This is important if you read from stdout or stderr and for proper error
handling. The default value ensures that you can read from stdout e.g. via pipes
or you use webpack -j to generate json output.

## How to test

To run the provided example:

```
yarn example
```

## Prior work

This project uses work done in the
[awesome-typescript-loader](https://github.com/s-panferov/awesome-typescript-loader).

[version-image]: https://img.shields.io/npm/v/tsconfig-paths-webpack-plugin.svg?style=flat
[version-url]: https://www.npmjs.com/package/tsconfig-paths-webpack-plugin
[prettier-image]: https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat
[prettier-url]: https://github.com/prettier/prettier
[license-image]: https://img.shields.io/github/license/jonaskello/tsconfig-paths-webpack-plugin.svg?style=flat
[license-url]: https://opensource.org/licenses/MIT
