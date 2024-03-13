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

function saveChangesList(user_id, ) {

};

function deleteTask(user_id, task_id) {

};

module.exports = {
    getLists,
    getTasks,
    saveChangesList,
    deleteTask,
};