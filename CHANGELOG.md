# Change Log

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/) and this
project adheres to [Semantic Versioning](http://semver.org/).

## [Unreleased]

## [2.0.0] - 2018-01-13

### Changed

* Performance enhancements:
  * Using async versions of tsconfig-paths package matchPath functions.
  * Using webpack's cached filesystem. Should give better performance.

## [1.4.0]

### Changed

* Only log startup message when `logLevel` is set to `info`. See [#6](https://github.com/dividab/tsconfig-paths-webpack-plugin/issues/6).

## [1.3.1]

### Added

* Upgraded to tsconfig-paths 2.7.2.

## [1.3.0]

### Added

* Upgraded to tsconfig-paths 2.7.1.

## [1.2.0]

### Added

* Added option for `baseUrl`.

## [1.1.0]

### Added

* Added option for `extensions`.

## [1.0.0]

### Changed

* Log path to tsconfig.json at warn log level so it is logged as default.

## [0.4.0]

### Changed

* Rename plugin class to TsconfigPathsPlugin (lower case s, breaking change)
* Load config using tsconfig-paths.

### Removed

* Remove compiler option (it was not used)

## [0.3.0]

### Changed

* Use package tsconfig-paths to resolve paths.

## [0.2.0]

### Changed

* Internal refactor

## [0.1.1]

### Added

* Include files.

## 0.1.0

### Added

* First release.

[unreleased]: https://github.com/dividab/tsconfig-paths-webpack-plugin/compare/1.4.0...master
[1.4.0]: https://github.com/dividab/tsconfig-paths-webpack-plugin/compare/1.3.1...1.4.0
[1.3.1]: https://github.com/dividab/tsconfig-paths-webpack-plugin/compare/1.3.0...1.3.1
[1.3.0]: https://github.com/dividab/tsconfig-paths-webpack-plugin/compare/1.2.0...1.3.0
[1.2.0]: https://github.com/dividab/tsconfig-paths-webpack-plugin/compare/1.1.0...1.2.0
[1.1.0]: https://github.com/dividab/tsconfig-paths-webpack-plugin/compare/1.0.0...1.1.0
[1.0.0]: https://github.com/dividab/tsconfig-paths-webpack-plugin/compare/0.4.0...1.0.0
[0.4.0]: https://github.com/dividab/tsconfig-paths-webpack-plugin/compare/0.3.0...0.4.0
[0.3.0]: https://github.com/dividab/tsconfig-paths-webpack-plugin/compare/0.2.0...0.3.0
[0.2.0]: https://github.com/dividab/tsconfig-paths-webpack-plugin/compare/0.1.1...0.2.0
[0.1.1]: https://github.com/dividab/tsconfig-paths-webpack-plugin/compare/0.1.0...0.1.1
