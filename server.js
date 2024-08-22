require('dotenv').config();
const fs = require('fs');
const https = require('https');
const cors = require('cors');
const express = require('express');
const auth = require('./components/auth');
const todo = require('./components/todo');

// Create an express app.
//      We are using cors to allow cross-origin requests. We are using app.use() to add the cors middleware to the Express application.
//      To parse the incoming requests with JSON payloads we are using express.json() which is a built-in middleware function in Express.
const app = express();
app.use(cors());
app.use(express.json());

// const privateKey = fs.readFileSync('certs/localhost-key.pem', 'utf8');
// const certificate = fs.readFileSync('certs/localhost.pem', 'utf8');
const privateKey = fs.readFileSync('certs/10.0.0.157-key.pem', 'utf8');
const certificate = fs.readFileSync('certs/10.0.0.157.pem', 'utf8');

const credentials = { key: privateKey, cert: certificate };

app.post('/login', async (req, res) => {
    console.log('/login');
    const {username, password} = req.body;

    const [status, result] = await auth.login(username, password);

    if (status == 200) {
        const accessToken = auth.assignToken(result);
        res
            .status(status)
            .json({ success: status,
                    token: accessToken });
    } else {
        res
            .status(status)
            .json({ success: status, 
                    message: result });
    }
});

// Password hashing should be done at the backend, 
// Https should be used for sensitive info. 
// transportation from front to back
app.post('/signup', async (req, res) => {
    console.log('/signup');
    const {username, email, password} = req.body;

    let [status, result] = await auth.signup(username, email, password);

    if (status == 200) {
        const accessToken = auth.assignToken(result);
        res
            .status(status)
            .json({ success: status,
                    token: accessToken });
    } else {
        res
            .status(status)
            .json({ success: status, 
                    message: result });
    }
});


app.post('/getNotes', auth.authenticateToken, async (req, res) => {
    // console.log("/getNotes");

    console.time('/getNotes');
    let [status, notes] = await todo.getNotes(req.user_id);
    console.timeEnd('/getNotes');

    res
        .status(status)
        .json({ success: status, 
                notes: notes });
});

app.post('/getMessage', auth.authenticateToken, async (req, res) => {
    // console.log("/getMessage");
    const user_id = req.user_id;
    const { note_id } = req.body; // get the note_id of the list

    console.time('/getMessage');
    let [status, message] = await todo.getMessage(user_id, note_id);
    console.timeEnd('/getMessage');

    res
        .status(status)
        .json({ success: status, 
                message: message });
});

app.post('/getTasks', auth.authenticateToken, async (req, res) => {
    // console.log("/getTasks");
    const user_id = req.user_id;
    const { note_id } = req.body; // get the note_id of the list

    console.time('/getTasks');
    let [status, tasks] = await todo.getTasks(user_id, note_id);
    console.timeEnd('/getTasks');

    res
        .status(status)
        .json({ success: status, 
                tasks: tasks });
});

app.post('/updateTitle', auth.authenticateToken, async (req, res) => {
    // console.log('/updateTitle');
    const user_id = req.user_id;
    const {note_id, title} = req.body;

    console.time('/updateTitle');
    let [status] = await todo.updateTitle(user_id, note_id, title);
    console.timeEnd('/updateTitle');

    res
        .status(status)
        .json({
            status: status 
        });
});

app.post('/updateMessage', auth.authenticateToken, async (req, res) => {
    // console.log('/updateMessage');
    const user_id = req.user_id;
    const {note_id, message} = req.body;

    console.time('/updateMessage')
    let [status] = await todo.updateMessage(user_id, note_id, message);
    console.timeEnd('/updateMessage')

    res
        .status(status)
        .json({
            status: status 
        });
});

app.post('/createNote', auth.authenticateToken, async (req, res) => {
    // console.log('/createNote');
    const user_id = req.user_id;
    const { title, message } = req.body;

    console.time('/createNote')
    let [status, newNote] = await todo.createNote(user_id, title, message);
    console.timeEnd('/createNote')

    res
        .status(status)
        .json({ status: status,
                newNote: newNote });
});

app.post('/createList', auth.authenticateToken, async (req, res) => {
    // console.log('/createNote');
    const user_id = req.user_id;
    const { title, list } = req.body;

    console.time('/createList')
    let [status, newList] = await todo.createList(user_id, title, list);
    console.timeEnd('/createList')

    res
        .status(status)
        .json({ status: status,
                newList: newList });
});

app.post('/createList', auth.authenticateToken, async (req, res) => {
    // console.log('/createList');
    const user_id = req.user_id;
    const { title, tasks } = req.body;

    console.time('/createList');
    let [status, note_id] = await todo.createList(user_id, title, tasks);
    console.timeEnd('/createList');

    res
        .status(status)
        .json({ success: status,
                note_id: note_id });
});

app.delete('/deleteTask', auth.authenticateToken, async (req, res) => {
    // console.log("/deleteTask");
    const user_id = req.user_id;
    const { task_id } = req.body;

    console.time('/deleteTask');
    let [status] = await todo.deleteTask(user_id, task_id);
    console.timeEnd('/deleteTask');

    res
        .status(status)
        .json({ success: status });
})

app.delete('/deleteNote', auth.authenticateToken, async (req, res) => {
    // console.log("/deleteNote: ");
    const user_id = req.user_id;
    const { note_id } = req.body;

    console.time('/deleteNote');
    let [status, msg] = await todo.deleteNote(user_id, note_id);
    console.timeEnd('/deleteNote');

    res
        .status(status)
        .json({message: msg});
});


app.post('/updateList', auth.authenticateToken, async (req, res) => {
    console.log("/updateList");
    
    const user_id = req.user_id;
    const { note_id, new_list, delete_list } = req.body;
    console.log("New list: " + new_list);
    console.log("Delete list: " + delete_list);

    console.time('/updateList');
    let [status] = await todo.updateList(user_id, note_id, new_list, delete_list);
    console.timeEnd('/updateList');

    res
        .status(status)
});



// const port = 8001;
// app.listen(port, () => {
//     console.log(`Server is running on http://localhost:${PORT}`);
// });

const IP = '10.0.0.157';
const PORT = 8442;
const httpsServer = https.createServer(credentials, app);

httpsServer.listen(PORT, IP, () => {
    console.log(`HTTPS server is running on https://localhost:${PORT}`);
});

// const express = require('express');
// const app = express();
// const port = 3000;

// // In-memory data store (replace with a real database later)
// let data = [];

// app.use(express.json()); // To parse incoming JSON data

// // Create (POST)
// app.post('/api/items', (req, res) => {
//     const newItem = req.body;
//     data.push(newItem);
//     res.status(201).json(newItem);
// });

// // Read (GET)
// app.get('/api/items', (req, res) => {
//     res.json(data);
// });

// // Update (PUT)
// app.put('/api/items/:id', (req, res) => {
//     const itemId = parseInt(req.params.id);
//     const updatedItem = req.body;
//     const index = data.findIndex(item => item.id === itemId);
//     if (index !== -1) {
//         data[index] = updatedItem;
//         res.json(updatedItem);
//     } else {
//         res.status(404).send('Item not found');
//     }
// });

// // Delete (DELETE)
// app.delete('/api/items/:id', (req, res) => {
//     const itemId = parseInt(req.params.id);
//     data = data.filter(item => item.id !== itemId);
//     res.status(204).send(); // No content on successful deletion
// });

// app.listen(port, () => {
//     console.log(`Server listening at http://localhost:${port}`);
// });
                  