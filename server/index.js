// index.js
// Required modules
const { Console } = require('console');
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

let users = require(dataPath);

function getNextUserId() {
    if (users.length === 0) {
        return 1;  // First user gets ID 1
    }
    
    // Find the highest current user ID
    const lastUserId = users[users.length - 1].id;
    return lastUserId + 1;
}

app.get('/sign-up', (req, res) => {
    res.sendFile('pages/sign-up.html', { root: serverPublic })
})



app.post('/signed', async (req, res) => {
    try {
        const { username, email, password } = req.body
        let users = []
        
        try {
            const data = await fs.readFile(dataPath, 'utf8');
            users = JSON.parse(data);

            const userExists = users.some(user => user.email === email || user.username === username);
           
            if (userExists) {
                console.log("User kinda exists my sigma")
                return res.status(400);
                res.redirect('sign-up');
                
            }
           
            }
        catch (error) {
            console.error('Error reading user data:', error)
            users = []
        }
        // function generateUserId() {
        //     if (users.length === 0) {
        //         return 1; // Start with ID 1 if no users exist
        //     }
        //     const lastUserId = users[users.length - 1].id;
        //     return lastUserId + 1;


        // }
        const userId = getNextUserId();

      


        // let user = users.find(u => u.username === username && u.email === email && u.password === password);
        // if (!user.password) {
        //     alert('FAKE');    
        // } 
        
        
            user = {id: userId, username, email, password, };
      

        users.push(user);
        console.log(users)
        await fs.writeFile(dataPath, JSON.stringify(users, null, 2))
        res.redirect('sign-up');
        console.log(users);
        console.log("Hello World")
        
    } catch (error) {
        console.error('error processing form:', error)
    }
})
app.get('/sign-in', (req, res) => {
    res.sendFile('pages/sign-in.html', { root: serverPublic })
})
app.post('/login', async (req, res) => {
    
    try {
    const { username, password } = req.body;
    let users = []
    const data = await fs.readFile(dataPath, 'utf8');
    users = JSON.parse(data);
    // res.redirect('sign-in');
    let user = users.find(u => u.username === username && u.password === password);
    if (user) {
        res.status(200).json({ message: 'success' })
        console.log("yeah")
        // res.redirect('sign-in');
        
    } else {
        res.status(400);
        res.redirect('sign-in')
    }
    
    }
    catch(error){}
})
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

