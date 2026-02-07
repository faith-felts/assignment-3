# Assignment #3: Fitness Analytics System
This repository contains your starter code for the Fitness Analytics System assignment.

## Getting Started
1. Clone this repository to your local machine
2. Navigate to the project directory
3. Install dependencies:
   ```bash
   npm install
   ```

## Assignment Overview
You will build three main scripts:
- **healthReader.js** - Reads and processes JSON health data asynchronously
- **workoutReader.js** - Reads and processes CSV workout data using csv-parser
- **dataProcessor.js** - Main program that integrates both readers and uses environment variables

## Required Dependencies
Install the following packages as you work through the assignment:
```bash
npm install csv-parser
npm install dotenv
```

## Data Files
Your repository includes sample data files to work with:
- `data/health-metrics.json` - Health data in JSON format
- `data/workouts.csv` - Workout data in CSV format

## Environment Configuration
Create a `.env` file in your project root with:
```
USER_NAME=YourName
WEEKLY_GOAL=150
```

## Testing
Write Jest tests for your functions:
```bash
npm test
```

## File Structure
```
healthReader.js
workoutReader.js
dataProcessor.js
tests/
├── healthReader.test.js
└── workoutReader.test.js
data/
├── health-metrics.json
└── workouts.csv
.env
```

## Key Learning Objectives
- Read JSON files asynchronously with proper error handling
- Process CSV files using the csv-parser package
- Handle missing or corrupted files gracefully
- Use environment variables for configuration
- Write comprehensive unit tests for file processing functions