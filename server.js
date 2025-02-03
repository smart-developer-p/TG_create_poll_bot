const express = require("express");
const fs = require('fs');
const path = require('path');
const bot = require('./bot.js');
const dotenv = require('dotenv');

dotenv.config();  // Load environment variables from a .env file

const app = express();
const PORT = process.env.PORT;

// Middleware to parse JSON request bodies
app.use(express.json());

// Path to the polls.json file
const pollsFilePath = path.join(process.cwd(), 'polls.json');  // Changed to process.cwd() for better handling


// Endpoint to add a new poll/quiz
app.post('/addPoll', (req, res) => {
    const newPoll = req.body;

    // Validate that the poll has necessary fields (question and options)
    if (!newPoll.question || !newPoll.options || !Array.isArray(newPoll.options)) {
        return res.status(400).json({ message: 'Invalid poll data. Ensure it has question and options.' });
    }

    // Read the existing polls from the file
    fs.readFile(pollsFilePath, 'utf-8', (err, data) => {
        if (err) {
            return res.status(500).json({ message: 'Error reading the polls file.' });
        }

        // Parse the current polls data
        let polls = [];
        if (data) {
            polls = JSON.parse(data);
        }

        // Add the new poll to the polls array
        polls.push(newPoll);

        // Write the updated polls back to the JSON file
        fs.writeFile(pollsFilePath, JSON.stringify(polls, null, 2), (err) => {
            if (err) {
                return res.status(500).json({ message: 'Error saving the polls data.' });
            }
            res.status(200).json({ message: 'Poll added successfully!' });
        });
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
