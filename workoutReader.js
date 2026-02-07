const fs = require('fs');
const csv = require('csv-parser');

// Function to read CSV data and return it as an array of objects
async function readCSVData(filepath) {
    return new Promise((resolve, reject) => {
        const results = [];
        // Create the read stream and attach an error handler so ENOENT rejects the promise.
        const readStream = fs.createReadStream(filepath);
        readStream.on('error', (err) => reject(err));

        const parser = csv();
        parser.on('error', (err) => reject(err));
        parser.on('data', (row) => results.push(row));
        parser.on('end', () => resolve(results));

        // Pipe after listeners are attached to ensure upstream errors are caught.
        readStream.pipe(parser);
    });
}

// Function that processes the workout CSV file and calculates total workouts and total minutes
async function workoutCalculator(filepath) {
    try {
        const workoutData = await readCSVData(filepath);

        // Defensive: ensure workoutData is an array
        if (!Array.isArray(workoutData)) {
            console.log('CSV file was not parsed into an array - check the file format');
            return null;
        }

        const totalWorkouts = workoutData.length;
        let totalMinutes = 0;

        for (let i = 0; i < workoutData.length; i++) {
            const workout = workoutData[i];
            if (!workout || !workout.duration) {
                console.log(`Warning: missing duration at row ${i}, treating as 0`);
                continue;
            }

            // Parse the duration
            const parsed = parseFloat(workout.duration);

            // if parsing fails (NaN) or results in null, log a warning and treat as 0 for summation.
            if (parsed == null || isNaN(parsed)) {
                // Log a warning but treat the value as 0 for summation so a single bad
                // row doesn't fail the entire calculation.
                console.log(`Warning: invalid duration at row ${i} ('${workout.duration}'), treating as 0`);
                continue;
            }

            if (parsed < 0) {
                // if there is a negative duration, I don't know what to do with it so just log that a negative number was found and don't add it to the total. This way we don't fail the entire calculation but we also don't include negative minutes in the total.
                console.log(`Warning: negative duration at row ${i} (${parsed})`);
            }

            totalMinutes += parsed;
        }


        return { totalWorkouts, totalMinutes };
    } catch (error) {
        // Handle file not found error for consistency with other readers.
        if (error && error.code === 'ENOENT') {
            console.log('File not found - check the file path');
        } else if (error && error.name === 'Error') {
            console.log('❌ Error processing CSV file:', error.message);
        } else {
            console.log('❌ Error processing CSV file:', error && error.message ? error.message : String(error));
        }
        return null;
    }
}

// Export the function for use in other modules
module.exports = { workoutCalculator };