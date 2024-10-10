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
        res.status(200).json(flights);
    } catch (error) {
        console.error("Problem getting flights: " + error.message);
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
        } catch (error) {
            console.error('Error reading user data:', error)
            users = []
        }

        let user = users.find(u => u.email === email || u.username === username);

        if (user) {
            return res.status(409).send();
        }

        const hashedPassword = await bcrypt.hash(password, 10).then(hash => {
            return hash;
        }).catch(error => console.error(error.message));

        let userId = users.length + 1;
        
        user = { userId, admin: false, username, email, password: hashedPassword, bookedFlights: [] };
        users.push(user);

        await fs.writeFile(dataPath, JSON.stringify(users, null, 2))
        return res.status(200).send();
    } catch (error) {
        console.error('error processing form:', error)
    }
})
app.post('/create-flight', async (req, res) => {
    try {
        const { origin, destination, date, time } = req.body;
        let flights = [];

        try {
            const data = await fs.readFile(flightDataPath, 'utf8');
            flights = JSON.parse(data); // Use 'flights' instead of 'users'
        } catch (error) {
            console.error('Error reading flight data:', error);
            flights = []; // Initialize as empty if there's an error
        }

        const flightId = flights.length > 0 ? flights[flights.length - 1].flightId + 1 : 1; // Correct ID assignment

        const flight = { flightId, origin, destination, date, time };

        flights.push(flight); // Use 'flights' here
        console.log(flights);

        await fs.writeFile(flightDataPath, JSON.stringify(flights, null, 2)); // Write to the correct file
        console.log("Flight created successfully:", flight);
        res.status(201).json({ message: "Flight created successfully", flight });
    } catch (error) {
        console.error('Error processing flight creation:', error);
        res.status(500).json({ error: "Failed to create flight" });
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
            // compare submitted password to stored hashed password, uses bcrypt built in function (I have no idea how it works)
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

    }
    catch (error) { }
})
app.put('/update-flight/:currentId', async (req, res) => {
    try {
        const { currentId } = req.params;
        const { newOrigin, newDestination, newDate, newTime } = req.body;

        const data = await fs.readFile(flightDataPath, 'utf8');
        const flights = JSON.parse(data);

        const flightIndex = flights.findIndex(flight =>
            flight.flightId === parseInt(currentId)
        );

        if (flightIndex === -1) {
            return res.status(404).json({ flightInfo: "Flight not found" });
        }

        flights[flightIndex] = {
            ...flights[flightIndex],
            origin: newOrigin,
            destination: newDestination,
            date: newDate,
            time: newTime
        };

        await fs.writeFile(flightDataPath, JSON.stringify(flights, null, 2));
        res.status(200).json({ flightInfo: `Updated flight to ${newOrigin} - ${newDestination}` });
    } catch (error) {
        console.error('Error updating flight:', error);
        res.status(500).send('An error occurred while updating the flight.');
    }
});

app.delete('/delete-flight/:flightId', async (req, res) => {
    try {
        const { flightId } = req.params;
        console.log("fid", flightId)
        console.log(typeof flightId)
        const data = await fs.readFile(flightDataPath, 'utf8');
        const flights = JSON.parse(data);
        console.log(flights)
        // Find the index of the flight to delete
        const flightIndex = flights.findIndex(flight =>
            flight.flightId === parseInt(flightId)
        );
        console.log("findex", flightIndex)
        if (flightIndex === -1) {
            return res.status(404).json({ message: "Flight not found" });
        }

        // Remove the flight from the array
        flights.splice(flightIndex, 1);

        // Write the updated flights back to the file
        await fs.writeFile(flightDataPath, JSON.stringify(flights, null, 2));

        res.status(200).json({ message: "Flight deleted successfully" });
    } catch (error) {
        console.error('Error deleting flight:', error);
        res.status(500).send('An error occurred while deleting the flight.');
    }
});


app.post('/update-flight', async (req, res) => {
    const { flightId } = req.body;
    
    if (!flightId) {
      return res.status(400).json({ message: 'Flight ID is required' });
    }
  
    console.log('Received flightId:', flightId);
    const data = await fs.readFile(dataPath, 'utf8')
    users = JSON.parse(data);
    console.log(users[0].bookedFlights)
     user = users[0].bookedFlights;
    user.push(flightId)

    await fs.writeFile(dataPath, JSON.stringify(users, null, 2))
    return res.status(200).send();
    // user.push(flightId);

    
    // Read the users.json file
    
  });
// const saveUsers = (updatedUsers) => {
//     fs.writeFileSync(dataPath, JSON.stringify(updatedUsers, null, 2));
// };


// app.post('/add-flight', async (req, res) => {
//     try {
//         const { username, flightId } = req.body;
//         let users = [];

//         try {
//             const data = await fs.readFile(dataPath, 'utf8')
//             users = JSON.parse(data);    
//         } catch (error) {
            
//         }

//         let user = users.find(u => u.userId === userId)

//         if (user) {
//             console.log(userId);
//         }
//     }catch(error){}
// })

// app.post('/addFlight',async  (req, res) => {
//     const { userId, flightId } = req.body;
//     let users = []
//     let flights = [];
//     let flightsData = await fs.readFile(flightDataPath, 'utf8')
//     const userData = await fs.readFile(dataPath, 'utf8');
//     flights = JSON.parse(flightsData)
//     users = JSON.parse(userData);   
//     const user = users.find(u => u.userId === userId);
//     if (!user) {
//         return res.status(400).json({ message: 'User not found' });
//     }

//     const flight = flights.find(f => f.flightId === flightId);
//     if (!flight) {
//         return res.status(404).json({ message: "Flight not found" });
//     }
//     if (!user.flightsId.includes(flightId)) {
//         user.flightsId.push(flightId)
//     }

//     saveUsers(users)

// })
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});