module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  transform: {
    "^.+\\.[tj]sx?$": "ts-jest",
  },
  moduleFileExtensions: ["ts", "tsx", "js", "jsx"],
  globals: { "ts-jest": { tsConfig: "<rootDir>/src/tsconfig.spec.json" } },
};
