// index.js
// Required modules
const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const bcrypt = require('bcrypt');

// Initialize Express application
const app = express();

// Define paths
const clientPath = path.join(__dirname, '..', 'client/src');
const dataPath = path.join(__dirname, 'data', 'users.json');
const flightDataPath = path.join(__dirname, 'data', 'flights.json');
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

app.get('/sign-up', (req, res) => {
    res.sendFile('pages/sign-up.html', { root: serverPublic })
})
app.get('/flights-display', (req, res) => {
    res.sendFile('pages/flights-display.html', { root: serverPublic })
})
app.get('/admin', (req, res) => {
    res.sendFile('pages/admin.html', { root: serverPublic })
})

app.get('/flights', async (req, res) => {
    try {
        const data = await fs.readFile(flightDataPath, 'utf8');

        const flights = JSON.parse(data);
        if (!flights) {
            throw new Error("Error no flights available");
        }
        res.status(200).json(flights);
    } catch (error) {
        console.error("Problem getting flights" + error.message);
        res.status(500).json({ error: "Problem reading flights" });
    }
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

// don't need this whole thing
// let users = require(dataPath);

// function getNextUserId() {
//     if (users.length === 0) {
//         return 1;  // First user gets ID 1
//     }
    
//     // Find the highest current user ID
//     const lastUserId = users[users.length - 1].id;
//     return lastUserId + 1;
// }

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

            const user = users.some(user => user.email === email || user.username === username);
           
            if (user) {
                console.log("Existing username or email, retry");
                res.redirect('sign-up');
                return res.status(400);
            }
        } catch (error) {
            console.error('Error reading user data:', error)
            users = []
        }

        const hashedPassword = await bcrypt.hash(password, 10).then(hash => {
            return hash;
        }).catch(error => console.error(error.message));

        let userId = users.length + 1;
        
        user = { userId, admin: false, username, email, password: hashedPassword, bookedFlights: [] };
        users.push(user);

        await fs.writeFile(dataPath, JSON.stringify(users, null, 2))
        res.redirect('sign-up');
    } catch (error) {
        console.error('error processing form:', error)
    }
});

app.get('/sign-in', (req, res) => {
    res.sendFile('pages/sign-in.html', { root: serverPublic })
});

app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        let users = []

        const data = await fs.readFile(dataPath, 'utf8');
        users = JSON.parse(data);
        
        let user = users.find(u => u.username === username);

        if (user) {
            // compare submitted password to stored hashed password
            const validatedLogin = await bcrypt.compare(password, user.password).then(res => {
                return res;
            }).catch(error => console.error(error.message));

            if (validatedLogin) {
                console.log("Valid login credentials");

                // delete data the client should not store
                delete user.password;
                delete user.userId;

                // send user object to client for storing in localstorage
                res.status(200).send(user);
            }
        } else {
            res.status(400);
            res.redirect('sign-in')
        }
    
    } catch (error) {
        console.error(error.message)
    }
});

app.post('/addFlight',async  (req, res) => {
    const { userId, flightId } = req.body;
    let users = []
    let flights = [];
    let flightsData = await fs.readFile(flightDataPath, 'utf8')
    const userData = await fs.readFile(dataPath, 'utf8');
    flights = JSON.parse(flightsData)
    users = JSON.parse(userData);   
    const user = users.find(u => u.userId === userId);
    if (!user) {
        return res.status(400).json({ message: 'User not found' });
    }

    const flight = flights.find(f => f.flightId === flightId);
    

})
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

