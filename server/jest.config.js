const { createDefaultPreset } = require("ts-jest");

const tsJestTransformCfg = createDefaultPreset().transform;

/** @type {import("jest").Config} **/
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      // This tells ts-jest to skip type checking and just transpiles
      // This is often a lifesaver for complex Mongoose/Express tests
      isolatedModules: true, 
    }]
  },
};