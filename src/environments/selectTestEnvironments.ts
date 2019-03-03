import { CftRequest, SupportedTestFramework } from "../types";

import { getJasmineEnvironment } from "./jasmine";
import { getJestEnvironment } from "./jest";
import { getMochaEnvironment } from "./mocha";
import { TestEnvironmentGetter } from "./testEnvironmentTypes";

const testEnvironmentsByName = new Map<SupportedTestFramework, TestEnvironmentGetter>([
    ["mocha", getMochaEnvironment],
    ["jest", getJestEnvironment],
    ["jasmine", getJasmineEnvironment],
]);

const detectableTestEnvironmentGetters: TestEnvironmentGetter[] = [
    // Jest should come before Jasmine because Jest includes a monkey-patched Jasmine
    getJestEnvironment,
    getJasmineEnvironment,

    // Mocha should be last because it's difficult to accurately detect
    // See https://github.com/RyzacInc/console-fail-test/issues/10
    getMochaEnvironment,
];

export const selectTestEnvironment = (request: CftRequest) => {
    // If a test environment is requested, it must exist
    if (request.testFramework !== undefined) {
        const getter = testEnvironmentsByName.get(request.testFramework);
        if (getter === undefined) {
            throw new Error(`Requested test framework '${request.testFramework}' not supported by console-fail-test.`);
        }

        const environment = getter();
        if (environment === undefined) {
            throw new Error(`Requested test framework '${request.testFramework}' does not seem to be active.`);
        }

        return environment;
    }

    // Otherwise, attempt to auto-detect an active one
    for (const testEnvironmentGetter of detectableTestEnvironmentGetters) {
        const environment = testEnvironmentGetter();

        if (environment !== undefined) {
            return environment;
        }
    }

    throw new Error("Could not auto-detect test environment; consider passing it directly to cft.");
};
