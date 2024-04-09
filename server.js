require('dotenv').config();
const express = require('express');
const cors = require('cors');
const auth = require('./components/auth');
const todo = require('./components/todo');

// Create an express app.
//      We are using cors to allow cross-origin requests. We are using app.use() to add the cors middleware to the Express application.
//      To parse the incoming requests with JSON payloads we are using express.json() which is a built-in middleware function in Express.
const app = express();
app.use(cors());
app.use(express.json());


// Test Auth
// // const password = "testpass@123";
// // const hash = "$2b$10$2yfs.Z9vdZ7cZqKcVDpROO6sXR7bSoYD2kdKH7GDIAWnNaoK295py";

// // /******* Auth *******/
// // function authTesting (){
// //     auth.hashPass(password);
// //     auth.validateUser(password, hash);    
// // }

app.post('/login', async (req, res) => {
    const {username, password} = req.body;

    const result = await auth.login(username, password);
    const status = result[0];

    if (status == 200) {
        const user_id = result[1];
        const accessToken = auth.assignToken(user_id);
        res
            .status(status)
            .json({ success: status,
                    token: accessToken });
    } else {
        const message = result[1];
        res
            .status(status)
            .json({ success: status, 
                    message: message });
    }
});

// Password hashing should be done at the backend, 
// Https should be used for sensitive info. 
// transportation from front to back
app.post('/signup', async (req, res) => {
    const {username, email, password} = req.body;

    let [status, message] = await auth.signup(username, email, password);

    res
        .status(status)
        .json({ success: status, 
                message: message });

// TODO: 
    // if (status == 200) {
    //     const user_id = result[1];
    //     const accessToken = auth.assignToken(user_id);
    //     res
    //         .status(status)
    //         .json({ success: status,
    //                 token: accessToken });
    // } else {
    //     const message = result[1];
    //     res
    //         .status(status)
    //         .json({ success: status, 
    //                 message: message });
    // }
});


app.post('/getNotes', auth.authenticateToken, async (req, res) => {
    console.log("/getNotes");

    let [status, notes] = await todo.getNotes(req.user_id);

    res
        .status(status)
        .json({ success: status, 
                notes: notes });
});

app.post('/getMessage', auth.authenticateToken, async (req, res) => {
    console.log("/getMessage");
    const user_id = req.user_id;
    const { note_id } = req.body; // get the note_id of the list

    let [status, message] = await todo.getMessage(user_id, note_id);
    
    res
        .status(status)
        .json({ success: status, 
                message: message });
});

app.post('/getTasks', auth.authenticateToken, async (req, res) => {
    console.log("/getTasks");
    const user_id = req.user_id;
    const { note_id } = req.body; // get the note_id of the list

    let [status, tasks] = await todo.getTasks(user_id, note_id);
    
    res
        .status(status)
        .json({ success: status, 
                tasks: tasks });
});

app.post('/updateTitle', auth.authenticateToken, async (req, res) => {
    console.log('/updateTitle');
    const user_id = req.user_id;
    const {note_id, title} = req.body;

    let [status] = await todo.updateTitle(user_id, note_id, title);

    res
        .status(status)
        .json({
            status: status 
        });
});

app.post('/updateMessage', auth.authenticateToken, async (req, res) => {
    console.log('/updateMessage');
    const user_id = req.user_id;
    const {note_id, message} = req.body;

    let [status] = await todo.updateMessage(user_id, note_id, message);

    res
        .status(status)
        .json({
            status: status 
        });
});

app.post('/createNote', auth.authenticateToken, async (req, res) => {
    console.log('/createNote');
    const user_id = req.user_id;
    const { title, message } = req.body;

    let [status, note_id] = await todo.createNote(user_id, title, message);

    res
        .status(status)
        .json({ status: status,
                note_id: note_id });
});

app.post('/createList', auth.authenticateToken, async (req, res) => {
    console.log('/createList');
    const user_id = req.user_id;
    const { title, tasks } = req.body;

    let [status, note_id] = await todo.createList(user_id, title, tasks);

    res
        .status(status)
        .json({ success: status,
                note_id: note_id });
});

app.delete('/deleteTask', auth.authenticateToken, async (req, res) => {
    console.log("/deleteTask");
    const user_id = req.user_id;
    const { task_id } = req.body;

    let [status] = await todo.deleteTask(user_id, task_id);

    res
        .status(status)
        .json({ success: status });
})

app.delete('/deleteNote', auth.authenticateToken, async (req, res) => {
    console.log("/deleteNote: ");
    const user_id = req.user_id;
    const { note_id } = req.body;

    let [status, msg] = await todo.deleteNote(user_id, note_id);

    res
        .status(status)
        .json({message: msg});
});



// TODO: Finish these functions

app.post('/updateList', auth.authenticateToken, async (req, res) => {
    console.log("/list");
    
    const user_id = req.user_id;
    const { task_id } = req.body;

    let [status] = await todo.updateList(user_id, task_id);

    res
        .status(status)
});



const PORT = 8009;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});