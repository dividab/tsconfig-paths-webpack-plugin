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

```
var TsConfigPathsPlugin = require('tsconfig-paths-webpack-plugin');

resolve: {
    plugins: [
        new TsConfigPathsPlugin(/* { configFileName: "path/to/tsconfig.json" } */)
    ]
}
```

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