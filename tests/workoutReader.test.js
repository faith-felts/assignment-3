const path = require('path');
const fs = require('fs/promises');
const { workoutCalculator } = require('../workoutReader');

// Predefined test file paths used by the suite. Each entry represents
// a different scenario exercised by the tests below.
const FILES = {
    normal: path.join(__dirname, 'test-workouts-normal.csv'),
    missingDuration: path.join(__dirname, 'test-workouts-missing-duration.csv'),
    invalidDuration: path.join(__dirname, 'test-workouts-invalid-duration.csv'),
    headerOnly: path.join(__dirname, 'test-workouts-header-only.csv'),
    malformed: path.join(__dirname, 'test-workouts-malformed.csv')
};

beforeAll(async () => {
    // Normal CSV: two rows with simple integer durations
    const normal = ['date,duration,type', '2024-01-01,30,run', '2024-01-02,45,cycle'].join('\n');
    await fs.writeFile(FILES.normal, normal);

    // Missing duration in the second row (should be treated as 0)
    const missingDuration = ['date,duration', '2024-01-01,30', '2024-01-02,', '2024-01-03,15'].join('\n');
    await fs.writeFile(FILES.missingDuration, missingDuration);

    // Invalid durations: 'abc' (invalid), '30min' (parseable), '"1,200"' (contains comma), '-15' (negative)
    const invalidDuration = [
        'date,duration',
        '2024-01-01,abc',
        '2024-01-02,30min',
        '2024-01-03,"1,200"',
        '2024-01-04,-15'
    ].join('\n');
    await fs.writeFile(FILES.invalidDuration, invalidDuration);

    // Header only -> zero rows
    await fs.writeFile(FILES.headerOnly, 'date,duration\n');

    // Malformed CSV (not in CSV format)
    await fs.writeFile(FILES.malformed, 'just some random text not in CSV format');
});

afterAll(async () => {
    for (const p of Object.values(FILES)) {
        try { await fs.unlink(p); } catch {} // ignore
    }
});

describe('workoutCalculator - file parsing and summation', () => {
    // One metric should be counted as 1.
    test('sums simple integer durations', async () => {
        const result = await workoutCalculator(FILES.normal);
        expect(result).toEqual({ totalWorkouts: 2, totalMinutes: 75 });
    });

    // When duration is missing, the code should log a warning and treat it as 0 for summation.
    test('treats missing durations as 0 and logs a warning', async () => {
        const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
        const result = await workoutCalculator(FILES.missingDuration);
        expect(result).toEqual({ totalWorkouts: 3, totalMinutes: 45 });

        const calls = spy.mock.calls.map(c => c.join(' '));
        // Expect a warning mentioning the missing duration at row 1 (0-based index)
        expect(calls.some(c => c.includes('missing duration at row 1'))).toBe(true);
        spy.mockRestore();
    });

    // When duration is invalid (non-numeric), the code should log a warning and treat it as 0 for summation. 
    // Valid parseable formats should be parsed correctly, and negative values should be logged but not included in the total.
    test('parses mixed/invalid durations correctly and logs appropriate warnings', async () => {
        const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
        const result = await workoutCalculator(FILES.invalidDuration);

        // Parsing behavior with parseFloat:
        // 'abc' -> NaN -> treated as 0
        // '30min' -> 30
        // '1,200' -> parseFloat stops at comma -> 1
        // '-15' -> -15
        // totalMinutes = 0 + 30 + 1 - 15 = 16
        expect(result).toEqual({ totalWorkouts: 4, totalMinutes: 16 });

        const calls = spy.mock.calls.map(c => c.join(' '));
        expect(calls.some(c => c.includes('invalid duration at row 0'))).toBe(true); // 'abc'
        expect(calls.some(c => c.includes('negative duration at row 3'))).toBe(true); // -15
        spy.mockRestore();
    });

    // When the CSV contains only a header and no data rows, the function should return 0 workouts and 0 minutes without error.
    test('returns zero for header-only CSV', async () => {
        const result = await workoutCalculator(FILES.headerOnly);
        expect(result).toEqual({ totalWorkouts: 0, totalMinutes: 0 });
    });

});

// Additional test for error handling 
describe('workoutCalculator - error and input handling', () => {
    // When the specified file does not exist, the function should log a file-not-found message and return null.
    test('returns null and logs file not found for missing file', async () => {
        const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
        const result = await workoutCalculator(path.join(__dirname, 'does-not-exist.csv'));
        expect(result).toBeNull();
        expect(spy.mock.calls.some(c => c.join(' ').includes('File not found - check the file path'))).toBe(true);
        spy.mockRestore();
    });

    // When the CSV file is malformed (e.g., missing headers, inconsistent columns), the function should log an error message and return null.
    test('returns null and logs error for malformed CSV', async () => {
        const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
        const result = await workoutCalculator(FILES.malformed);
        console.log(result);
        expect(result).toBeNull();
        expect(spy.mock.calls.some(c => c.join(' ').includes('CSV file is missing the "duration" column - check the headers'))).toBe(true);
        spy.mockRestore();
    });
});