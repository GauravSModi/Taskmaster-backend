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


app.post('/getLists', auth.authenticateToken, async (req, res) => {
    console.log("/getLists");
    console.log("user_id: ", req.user_id);

    let [status, lists] = await todo.getLists(req.user_id);

    res
        .status(status)
        .json({ success: status, 
                lists: lists });
});

app.post('/getList', auth.authenticateToken, async (req, res) => {
    console.log("/list");
    const user_id = req.user_id;
    const { list_id } = req.body;

    let [status, tasks] = await todo.getTasks(user_id, list_id);
    
    res
        .status(status)
        .json({ success: status, 
                tasks: tasks });
});


// TODO: Finish these functions

app.post('/updateTitle', auth.authenticateToken, async (req, res) => {
    console.log('updateTitle');
    const user_id = req.user_id;
    const {list_id, title} = req.body;

    let [status] = await todo.updateTitle(user_id, list_id, title);

    res
        .status(status)
});

app.post('/createList', auth.authenticateToken, async (req, res) => {
    console.log('/createList');
    const user_id = req.user_id;
    const { title, tasks } = req.body;

    let [status] = await todo.createList(user_id, title, tasks);

    res
        .status(status)
        .json({ success: status,
                list_id: list_id });
});

app.post('/updateList', auth.authenticateToken, async (req, res) => {
    console.log("/list");
    
    const user_id = req.user_id;
    const { task_id } = req.body;

    let [status] = await todo.updateList(user_id, task_id);

    res
        .status(status)
});

app.delete('/deleteTask', auth.authenticateToken, async (req, res) => {
    console.log("/deleteTask");
    const user_id = req.user_id;
    // const { task_id } = req.body;

    // let [status] = await todo.deleteTask(user_id, );

    // res
    //     .status(status)
    //     .json({ success: status });
})







const PORT = 8009;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});








/****** Auth using passport ******

const passport = require('./passport-config'); // Adjust the path as needed
app.use(express.urlencoded({ extended: false }));
app.use(session({ secret: 'your-secret-key', resave: true, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

app.post('/login', passport.authenticate('local', {
    successRedirect: '/dashboard',
    failureRedirect: '/login',
    failureFlash: true,
}));
  
app.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/');
});

**********************************/