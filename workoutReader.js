const fs = require('fs');
const csv = require('csv-parser');

// Function to read CSV data and return it as an array of objects
async function readCSVData(filepath) {
    return new Promise((resolve, reject) => {
        const results = [];
        // Read the CSV file and parse it
        fs.createReadStream(filepath)
            .pipe(csv())
            .on('data', (row) => {
                results.push(row);
            })
            .on('end', () => {
                resolve(results);
            })
            .on('error', (error) => {
                reject(error);
            });
    });
}

// Function that processes the workout CSV file and calculates total workouts and total minutes
async function workoutCalculator(filepath) {
   try {
        // parse the CSV data
        const workoutData = await readCSVData(filepath);
        let totalWorkouts = workoutData.length; 
        let totalMinutes = 0; 
        // loop through the workout data to sum duration
        for (let i = 0; i < workoutData.length; i++) { 
            const workout = workoutData[i]; 
            totalMinutes += parseFloat(workout.duration); 
        }
        
        // return object containing total workouts and total minutes
        return { totalWorkouts, totalMinutes };
    } 
    catch (error) {
        // Handle file not found error
        if (error.code === 'ENOENT') { 
            console.log('❌ CSV file not found check the file path'); 
        } // Handle any other unexpected errors
        else { 
            console.log('❌ Error processing CSVfile:', error.message); 
        } 
        return null;
    }
}


// Export the function for use in other modules
module.exports = { workoutCalculator };