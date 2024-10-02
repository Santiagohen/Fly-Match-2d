// index.js
// Required modules
const express = require('express');
const path = require('path');
const fs = require('fs').promises;

// Initialize Express application
const app = express();

// Define paths
const clientPath = path.join(__dirname, '..', 'client/src');
const dataPath = path.join(__dirname, 'data', 'users.json');
const serverPublic = path.join(__dirname, 'public');
// Middleware setup
app.use(express.static(clientPath)); // Serve static files from client directory
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(express.json()); // Parse JSON bodies

// Routes

// Home route
app.get('/', (req, res) => {
    res.sendFile('index.html', { root: clientPath });
});

// app.get('/users', async (req, res) => {
//     try {
//         const data = await fs.readFile(dataPath, 'utf8')
//         const users = JSON.parse(data);
//         if (!users) {
//             throw new Error("Errir no users available");
//         }
//         res.status(200).json(users);
//     } catch {
//         console.error("Problem getting users" + error.message);
//         res.status(500).json({error: "Problem reading users"})
//     }
// })


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

