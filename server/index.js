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


app.get('/users', async (req, res) => {
    try {
        const data = await fs.readFile(dataPath, 'utf8');

        const users = JSON.parse(data);
        if (!users) {
            throw new Error("Error no users available");
        }
        res.status(200).json(users);
    } catch (error) {
        console.error("Problem getting users" + error.message);
        res.status(500).json({ error: "Problem reading users" });
    }
});

app.get('/sign-up', (req, res) => {
    res.sendFile('pages/sign-up.html', {root: serverPublic})
})

app.post('/signed', async(req, res) => {
    try {
        const {username, email, password, } = req.body
        let users = []
        try {
            const data = await fs.readFile(dataPath, 'utf8');
            users = JSON.parse(data);
         }
        catch(error) { 
            console.error('Error reading user data:', error)
            users = []
        }
        let user = users.find(u => u.username === username && u.email === email && u.password === password);
        // if (!user.password) {
        //     alert('FAKE');    
        // } 
        
        user = { username, email, password};
        users.push(user);
        console.log(users)
        await fs.writeFile(dataPath, JSON.stringify(users, null, 2))
        res.redirect('sign-up');
        console.log(users);
    } catch (error) {
        console.error('error processing form:', error)
     }
})

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

