require('dotenv').config();
// Importing functions from other modules
const {healthMetricsCounter} = require('./healthReader');
const {workoutCalculator} = require('./workoutReader');

// Main function to process both workout and health data and provide a summary of the data 
async function processFiles() {
    console.log('Processing data for:', process.env.USER_NAME);
    console.log('📁 Reading workout data...');
    const workoutData = await workoutCalculator('data/workouts.csv');
    console.log('Total workouts:', workoutData.totalWorkouts);
    console.log('Total minutes:', workoutData.totalMinutes);
    console.log('📁 Reading health data...');
    const healthMetricsCount = await healthMetricsCounter('data/health-metrics.json');
    console.log('Total health entries:', healthMetricsCount);

    // Provide a summary of the data and check if the user has met their weekly goal
    console.log('\n=== SUMMARY ===');
    console.log('Workouts found:', workoutData.totalWorkouts);
    console.log('Total workout minutes:', workoutData.totalMinutes);
    console.log('Health entries found:', healthMetricsCount);
    console.log('Weekly goal:', process.env.WEEKLY_GOAL, 'minutes');

    // If the user has met or exceeded their weekly goal, congratulate them
    if (workoutData.totalMinutes >= parseInt(process.env.WEEKLY_GOAL)) {
        console.log('🎉 Congratulations', process.env.USER_NAME + '!', 'You have exceeded your weekly goal!');
    }
    // If the user has not met their weekly goal, provide encouragement to keep going
    else {
        console.log('Keep going', process.env.USER_NAME + '!', 'You are on your way to reaching your weekly goal!');
    }

}

processFiles();