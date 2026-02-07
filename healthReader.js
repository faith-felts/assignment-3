const fs = require('fs/promises');

// Function to read the total number of heath metrics from a JSON file
async function healthMetricsCounter(filePath) {
    try {
        const jsonStr = await fs.readFile(filePath, 'utf8');
        // Parse the JSON string and return the count of health metrics
        const obj = JSON.parse(jsonStr);

        // check if obj is not null or empty
        if (!obj || !obj.metrics) {
            console.log('No metrics found in the file');
            return 0;
        }

        // check if obj.metrics is an array and has length property
        if (!Array.isArray(obj.metrics) && typeof obj.metrics.length === 'undefined') {
            console.log('Metrics is not an array or does not have a length property');
            return null;
        }

        // Return the count of health metrics
        return obj.metrics.length;
        
    } catch (error) {
        // Handle file not found error
        if (error.code === 'ENOENT') { 
            console.log('File not found - check the file path');
        } // Handle invalid JSON format error
        else if (error.name === 'SyntaxError') { 
            console.log('❌ Invalid JSON - check the file format'); 
        } // Handle any other unexpected errors
        else { 
            console.log('❌ Unknown error:', error.message); 
        } 
        return null;
    }
}

// Export the function for use in other modules
module.exports = { healthMetricsCounter };