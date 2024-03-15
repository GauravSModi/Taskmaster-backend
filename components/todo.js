const db = require('./database');


// Get all the lists associated with a user
function getLists(user_id) {
    return new Promise(resolve => {
        const sql_query = "SELECT * FROM List WHERE user_id = ?";

        // Probably don't need to escape user_id here because 
        // the value is coming from token authorization
        db.conn.query(sql_query, [user_id], async (err, result) => {
            if (err) {
                resolve([500, 'Database Error']);
            } else {
                if (result.length === 0) {
                    resolve([200, 'No Lists Found']);
                } else {
                    const lists = result.map(list => ({
                        list_id: list.list_id,
                        title: list.title
                    }));
                    resolve([200, lists]);
                }
            }
        });
    });
};

// Get all the tasks and their details associated with a list
function getTasks(user_id, list_id) {
    return new Promise(resolve => {
        const sql_query = "SELECT * FROM Task WHERE list_id = ? AND user_id = ?";
        
        db.conn.query(sql_query, [parseInt(db.conn.escape(list_id)), user_id], async (err, result) => {
            if (err) {
                resolve([500, 'Database Error']);
            } else {
                if (result.length === 0) {
                    resolve([200, 'No Tasks Found']);
                } else {
                    const list = result.map(task => ({
                        task_id: task.task_id,
                        description: task.description,
                        is_completed: task.is_completed
                    }));
                    resolve([200, list]);
                }
            }
        });
    });
};

function createList(user_id, title, tasks) {
    return new Promise(resolve => {
        const sql_query = "INSERT INTO List (user_id, title) VALUES (?, ?)";
        let list_id = null;

        db.conn.query(sql_query, [user_id, title], async (err, result) => {
            if (err) {
                console.log('Error: ', err);
                resolve([500, 'Database error']);
            } else {
                // console.log('result: ', result);
                list_id = result.insertId;

                for (const task in tasks) {
                    // console.log('task: ', tasks[task]);
                    if (list_id !== null && task !== null) {
                        const sql_query = "INSERT INTO Task (list_id, description, user_id) VALUES (?, ?, ?)";
        
        
                        db.conn.query(sql_query, [list_id, tasks[task], user_id], async (err, result) => {
                            if (err) {
                                console.log('Error: ', err);
                                resolve([500, 'Database error']);
                            } else {
                                console.log('result: ', result);
                            }
                        });
                    }
                }
            }
        });

        console.log("List_id: ", list_id);

    });
};

function updateTitle(user_id, list_id, title) {
    return new Promise(resolve => {
        const sql_query = "UPDATE List SET title = ? WHERE user_id = ? and list_id = ?";

        db.conn.query(sql_query, [title, user_id, list_id], async (err, result) => {
        if(err) {
            console.log('Error: ', err);
            resolve([500, 'Database error']);
        } else {
            console.log('result: ', result);
            if (result.affectedRows === 1){
                resolve([200]);
            }
        }
        });
    });
};

function updateList(user_id, ) {

};

function deleteTask(user_id, task_id) {

};

module.exports = {
    getLists,
    getTasks,
    createList,
    updateTitle,
    updateList,
    deleteTask,
};