const db = require('./database');


// Get all the notes associated with a user
function getNotes(user_id) {
    return new Promise(resolve => {
        const sql_query = "SELECT * FROM Note WHERE user_id = ?";

        // Probably don't need to escape user_id here because 
        // the value is coming from token authorization
        db.conn.query(sql_query, [user_id], async (err, result) => {
            if (err) {
                resolve([500, 'Database Error']);
            } else {
                if (result.length === 0) {
                    console.log("No notes found")
                    resolve([200, 'No notes Found']);
                } else {
                    const notes = result.map(note => ({
                        note_id: note.note_id,
                        title: note.title,
                        is_fav: note.is_favorite,
                        is_note: note.is_note
                    }));
                    resolve([200, notes]);
                }
            }
        });
    });
};

function getMessage(user_id, note_id) {
    return new Promise(resolve => {
        const sql_query = "SELECT * FROM Message WHERE note_id = ? AND user_id = ?";
        
        db.conn.query(sql_query, [note_id, user_id], async (err, result) => {
            if (err) {
                resolve([500, 'Database Error']);
            } else {
                if (result.length === 0) {
                    resolve([200, 'No message found']);
                } else {
                    // resolve([200, {message_id: result[0].message_id, message: result[0].message_content}]);
                    resolve([200, result[0].message_content]);
                }
            }
        });
    });
};


// Get all the tasks and their details associated with a list
function getTasks(user_id, note_id) {
    return new Promise(resolve => {
        const sql_query = "SELECT * FROM Task WHERE note_id = ? AND user_id = ?";
        
        db.conn.query(sql_query, [note_id, user_id], async (err, result) => {
            if (err) {
                resolve([500, 'Database Error']);
            } else {
                if (result.length === 0) {
                    resolve([200, 'No tasks found']);
                } else {
                    const tasks = result.map(task => ({
                        task_id: task.task_id,
                        description: task.description,
                        is_completed: task.is_completed
                    }));
                    resolve([200, tasks]);
                }
            }
        });
    });
};

function createNote(user_id, title, message) {
    return new Promise(resolve => {
        const sql_query = "INSERT INTO Note (user_id, title, is_note) VALUES (?, ?, 0)";
        let note_id = null;

        db.conn.query(sql_query, [user_id, title], async (err, result) => {
            if (err) {
                console.log('Error: ', err);
                resolve([500, 'Database error']);
            } else {
                // console.log('result: ', result);
                note_id = result.insertId;
                if (message == null) {
                    message = '';
                }

                if (note_id != null) {
                    const sql_query = "INSERT INTO Message (note_id, user_id, message_content) VALUES (?, ?, ?)";
        
                    db.conn.query(sql_query, [note_id, user_id, message], async (err, result) => {
                        if (err) {
                            console.log('Error: ', err);
                            resolve([500, 'Database error']);
                        } else {
                            console.log('result: ', result);
                            resolve([200, note_id])
                        }
                    });
                }
            }
        });

    });
};

function createList(user_id, title, tasks) {
    return new Promise(resolve => {
        const sql_query = "INSERT INTO Note (user_id, title, is_note) VALUES (?, ?, 1)";
        let note_id = null;

        db.conn.query(sql_query, [user_id, title], async (err, result) => {
            if (err) {
                console.log('Error: ', err);
                resolve([500, 'Database error']);
            } else {
                note_id = result.insertId;
                for (const task in tasks) {
                    if (note_id !== null && task !== null) {
                        const sql_query = "INSERT INTO Task (note_id, description, user_id) VALUES (?, ?, ?)";
                        db.conn.query(sql_query, [note_id, tasks[task], user_id], async (err, result) => {
                            if (err) {
                                console.log('Error: ', err);
                                resolve([500, 'Database error']);
                            } else {
                                // console.log('result: ', result);
                            }
                        });
                    }
                }
                resolve([200, note_id]);
            }
        });
    });
};

function updateTitle(user_id, note_id, title) {
    return new Promise(resolve => {
        const sql_query = "UPDATE Note SET title = ? WHERE user_id = ? and note_id = ?";

        db.conn.query(sql_query, [title, user_id, note_id], async (err, result) => {
            if(err) {
                console.log('Error: ', err);
                resolve([500, 'Database error']);
            } else {
                if (result.affectedRows === 1){
                    resolve([200]);
                }
            }
        });
    });
};

function updateMessage(user_id, note_id, message) {
    return new Promise(resolve => {
        const sql_query = `
            INSERT INTO Message (note_id, user_id, message_content) 
            VALUES (?, ?, ?) 
            ON DUPLICATE KEY UPDATE message_content = VALUES(message_content)
        `

        db.conn.query(sql_query, [note_id, user_id, message], async (err, result) => {
            if(err) {
                console.log('Error: ', err);
                resolve([500, 'Database error']);
            } else {
                if (result.affectedRows === 1){
                    resolve([200], "Created message");
                } else {
                    resolve([200], "Updated message");
                }
            }
        });
    });
};

function updateList(user_id, ) {

};

function deleteTask(user_id, task_id) {
    return new Promise(resolve => {
        const sql_query = 'DELETE FROM Task WHERE user_id = ? AND task_id = ?'

        db.conn.query(sql_query, [user_id, task_id], async (err, result) => {
            if (err) {
                console.log('Error: ', err);
                resolve([500, 'Database error']);
            } else {
                if (result.affectedRows === 1){
                    resolve([200, 'Successfully deleted']);
                } else {
                    resolve([200, "Doesn't exist"]);
                }
            }
        })
    });
};

function deleteNote(user_id, note_id) {
    return new Promise(resolve => {
        const sql_query = 'DELETE FROM Note WHERE user_id = ? AND note_id = ?'

        db.conn.query(sql_query, [user_id, note_id], async (err, result) => {
            if (err) {
                console.log('Error: ', err);
                resolve([500, 'Database error']);
            } else {
                if (result.affectedRows === 1){
                    resolve([200, 'Successfully deleted']);
                } else {
                    resolve([200, "Doesn't exist"]);
                }
            }
        })
    });
};

module.exports = {
    getNotes,
    getMessage,
    getTasks,
    createNote,
    createList,
    updateTitle,
    updateMessage,
    updateList,
    deleteTask,
    deleteNote,
};