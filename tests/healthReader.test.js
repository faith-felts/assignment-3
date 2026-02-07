// Unit tests for `healthReader.js`.
// These tests cover normal cases, edge cases, and error branches.
// Keep tests deterministic by creating and removing temporary files in the test folder.

const path = require('path');
const fs = require('fs/promises');

// Predefined test file paths used by the suite. Each entry represents
// a different scenario exercised by the tests below.
const FILES = {
    single: path.join(__dirname, 'test-health.json'),
    multiple: path.join(__dirname, 'test-health-multiple.json'),
    empty: path.join(__dirname, 'test-health-empty.json'),
    noMetrics: path.join(__dirname, 'test-health-no-metrics.json'),
    metricsString: path.join(__dirname, 'test-health-metrics-string.json'),
    metricsObject: path.join(__dirname, 'test-health-metrics-object.json'),
    invalid: path.join(__dirname, 'test-health-invalid.json'),
    metricsNull: path.join(__dirname, 'test-health-null.json'),
    large: path.join(__dirname, 'test-health-large.json')
};

beforeAll(async () => {
    // Create a small, valid file with a single metric.
    await fs.writeFile(FILES.single, JSON.stringify({ user: 'Alex', metrics: [{ date: '2024-01-01', type: 'sleep', duration: '7.5' }] }));

    // Create a file with multiple (empty) metric objects to verify counting.
    await fs.writeFile(FILES.multiple, JSON.stringify({ user: 'Alex', metrics: [{}, {}, {}] }));

    // Create a file with an empty metrics array to check zero-length handling.
    await fs.writeFile(FILES.empty, JSON.stringify({ user: 'Alex', metrics: [] }));

    // Create a file that omits the `metrics` key entirely to exercise error handling.
    await fs.writeFile(FILES.noMetrics, JSON.stringify({ user: 'Alex' }));

    // Create a file where `metrics` is a string (should behave like a string's length).
    await fs.writeFile(FILES.metricsString, JSON.stringify({ user: 'Alex', metrics: 'abc' }));

    // Create a file where `metrics` is an object (no `.length` property expected).
    await fs.writeFile(FILES.metricsObject, JSON.stringify({ user: 'Alex', metrics: {} }));

    // Create a file with invalid JSON to trigger the SyntaxError branch.
    await fs.writeFile(FILES.invalid, '{ invalid json }');

    // Create a file where `metrics` is explicitly null to exercise unknown-error handling.
    await fs.writeFile(FILES.metricsNull, JSON.stringify({ user: 'Alex', metrics: null }));

    // Large file: verify the function handles large arrays and returns the correct count.
    const largeMetrics = new Array(10000).fill(0).map((_, i) => ({ id: i }));
    await fs.writeFile(FILES.large, JSON.stringify({ user: 'Alex', metrics: largeMetrics }));
});

// Clean up all files created by the test suite. Ignore errors during deletion.
afterAll(async () => {
    for (const p of Object.values(FILES)) {
        try { await fs.unlink(p); } catch {} // ignore missing file errors
    }
});

describe('healthMetricsCounter - file based cases', () => {
    // one metric should be counted as 1.
    test('reads a valid JSON file with one metric', async () => {
        const { healthMetricsCounter } = require('../healthReader');
        const result = await healthMetricsCounter(FILES.single);
        expect(result).toBe(1);
    });

    // Verify counting works for multiple entries.
    test('reads a valid JSON file with multiple metrics', async () => {
        const { healthMetricsCounter } = require('../healthReader');
        const result = await healthMetricsCounter(FILES.multiple);
        expect(result).toBe(3);
    });

    // Zero-length metrics array should yield 0.
    test('reads a valid JSON file with zero metrics', async () => {
        const { healthMetricsCounter } = require('../healthReader');
        const result = await healthMetricsCounter(FILES.empty);
        expect(result).toBe(0);
    });

    // Non-existent file should return null (handled in catch block).
    test('returns null when the file is missing', async () => {
        const { healthMetricsCounter } = require('../healthReader');
        const result = await healthMetricsCounter(path.join(__dirname, 'file-does-not-exist.json'));
        expect(result).toBeNull();
    });

    // Invalid JSON should trigger syntax error handling and return null.
    test('returns null for invalid JSON and logs the syntax error', async () => {
        const { healthMetricsCounter } = require('../healthReader');
        // Spy on console.log so we can assert the expected message is emitted.
        const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
        const result = await healthMetricsCounter(FILES.invalid);
        expect(result).toBeNull();
        expect(spy).toHaveBeenCalledWith('❌ Invalid JSON - check the file format');
        spy.mockRestore();
    });

    // When `metrics` key is missing the code or not an array, the function should log a clear message and return 0 (not null).
    test('returns 0 when metrics key is missing and logs a helpful message', async () => {
        const { healthMetricsCounter } = require('../healthReader');
        const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
        const result = await healthMetricsCounter(FILES.noMetrics);
        // missing metrics returns 0 (not null) and logs a clear message.
        expect(result).toBe(0);
        expect(spy).toHaveBeenCalledWith('No metrics found in the file');
        spy.mockRestore();
    });

    // If `metrics` is a string, `.length` still exists, so the function will return the string length.
    test('returns string length when metrics is a string', async () => {
        const { healthMetricsCounter } = require('../healthReader');
        const result = await healthMetricsCounter(FILES.metricsString);
        expect(result).toBe(3);
    });

    // If `metrics` is a plain object without a `length` property, accessing `obj.metrics.length`
    // yields `undefined` and that's the observed behavior we assert here.
    test('returns null when metrics is an object without length and logs a message', async () => {
        const { healthMetricsCounter } = require('../healthReader');
        const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
        const result = await healthMetricsCounter(FILES.metricsObject);
        expect(result).toBeNull();
        expect(spy).toHaveBeenCalledWith('Metrics is not an array or does not have a length property');
        spy.mockRestore();
    });

    // When `metrics` is explicitly null the parser will succeed but accessing `.length` will
    // throw; the implementation catches and logs an unknown error and returns null.
    test('returns 0 when metrics is null and logs a helpful message', async () => {
        const { healthMetricsCounter } = require('../healthReader');
        const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
        const result = await healthMetricsCounter(FILES.metricsNull);
        // explicit null metrics treated like missing metrics -> return 0
        expect(result).toBe(0);
        expect(spy).toHaveBeenCalledWith('No metrics found in the file');
        spy.mockRestore();
    });

    // Sanity check for large arrays: ensure the returned count matches the actual array size.
    test('handles large files efficiently (count matches)', async () => {
        const { healthMetricsCounter } = require('../healthReader');
        const result = await healthMetricsCounter(FILES.large);
        expect(result).toBe(10000);
    });
});
