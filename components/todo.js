const db = require('./database');


// Get all the notes associated with a user
function getNotes(user_id) {
    return new Promise(resolve => {
        const sql_query = "SELECT * FROM note WHERE user_id = ?";

        db.conn.getConnection(function (err, connection) {
            if (err) {
                console.error('Database error: ', err);
                resolve([500, 'Database Error']);
            }

            connection.query(sql_query, [user_id], async (err, result) => {
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
            
            if (connection) connection.release();
        })
    });
};

function getMessage(user_id, note_id) {
    return new Promise(resolve => {
        const sql_query = "SELECT * FROM message WHERE note_id = ? AND user_id = ?";
        
        db.conn.getConnection(function (err, connection) {
            if (err) {
                console.error('Database error: ', err);
                resolve([500, 'Database Error']);
            }

            connection.query(sql_query, [note_id, user_id], async (err, result) => {
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

            if (connection) connection.release();
        })

    });
};


function createNote(user_id, title, message) {
    return new Promise(resolve => {
        const sql_query = "INSERT INTO note (user_id, title, is_note) VALUES (?, ?, 0)";
        let note_id = null;


        db.conn.getConnection(function (err, connection) {
            if (err) {
                console.error('Database error: ', err);
                resolve([500, 'Database Error']);
            }
          
            connection.query(sql_query, [user_id, title], async (err, result) => {
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
                        const sql_query = "INSERT INTO message (note_id, user_id, message_content) VALUES (?, ?, ?)";
            
                        connection.query(sql_query, [note_id, user_id, message], async (err, result) => {
                            if (err) {
                                console.log('Error: ', err);
                                resolve([500, 'Database error']);
                            } else {
                                resolve([200, {
                                    note_id: note_id,
                                    title: title,
                                    is_fav: 0,
                                    is_note: 0
                                }])
                            }
                        });
                    }
                }
            });
            
            if (connection) connection.release();
        })

    });
};


// Helper function to find a task by task_id
const findTaskById = (tasks, taskId) => {
    return tasks.find(task => task.task_id === taskId);
};


function updateList(user_id, note_id, new_list, delete_list) {
    return new Promise(resolve => {
        const sql_query_get_tasks = 'SELECT * FROM task WHERE note_id = ? AND user_id = ?';
        const sql_query_new_task = 'INSERT INTO task (note_id, description, is_completed, user_id) VALUES (?, ?, ?, ?)';
        const sql_query_existing_task = 'UPDATE task SET description = ?, is_completed = ? WHERE task_id = ? AND note_id = ? AND user_id = ?';
        const sql_delete_existing_task = 'DELETE FROM task WHERE user_id = ? AND task_id = ?';

        db.conn.getConnection(function (err, connection) {
            if (err) {
                console.error('Database error: ', err);
                resolve([500, 'Database Error']);
            }

            connection.query(sql_query_get_tasks, [note_id, user_id], async (err, result) => {
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

                        for (let i = 0; i < new_list.length; i++) {

                            const task_id = new_list[i][0];
                            const message = new_list[i][1];
                            const checked = new_list[i][2];
                            const existingTask = findTaskById(tasks, task_id);
                            
                            // If task does not yet exist (Task exists only in new list)
                            if (task_id.toString().includes('newTask')){
                                connection.query(sql_query_new_task, [note_id, message, checked, user_id], async (err, result) => {
                                    if (err) {
                                        console.log('Error: ', err);
                                        resolve([500, 'Database error']);
                                    } else {
                                        // console.log('result: ', result);
                                    }
                                });
                            } 


                            // If task already exists, but is changed (Task exists in both lists)
                            else if (existingTask){
                                if (existingTask.description !== message || existingTask.is_completed !== checked) {
                                    connection.query(sql_query_existing_task, [message, checked, existingTask.task_id, note_id, user_id], async (err, result) => {
                                        if (err) {
                                            console.log('Error: ', err);
                                            resolve([500, 'Database error']);
                                        }
                                    });
                                }
                            }
                        }

                        // Iterate through the list of tasks to be deleted, and delete them.
                        for (let i = 0; i < delete_list.length; i++) {
                            const task_id = delete_list[i];
                            // console.log('Deleting task', task_id);
                            connection.query(sql_delete_existing_task, [user_id, task_id], async (err, result) => {
                                if (err) {
                                    console.log('Error: ', err);
                                    resolve([500, 'Database error']);
                                } else {
                                    if (result.affectedRows === 1){
                                        // console.log('Successfully deleted task', task_id);
                                    } else {
                                        console.log('Error deleting task', task_id);
                                    }
                                }
                            });
                        }
                    }
                }
            })
            
            if (connection) connection.release();
        });
        
    });
};

function createList(user_id, title, list) {
    return new Promise(resolve => {
        const sql_query = "INSERT INTO note (user_id, title, is_note) VALUES (?, ?, 1)";
        let note_id = null;
        // console.log("List:", list);

        db.conn.getConnection(function (err, connection) {
            if (err) {
                console.error('Database error: ', err);
                resolve([500, 'Database Error']);
            }

            connection.query(sql_query, [user_id, title], async (err, result) => {
                if (err) {
                    console.log('Error: ', err);
                    resolve([500, 'Database error']);
                } else {
                    note_id = result.insertId;
                    for (let task in list) {
                        // console.log('Task: ', list[task]);
                        if (note_id !== null && task !== null) {
                            const sql_query = "INSERT INTO task (note_id, description, is_completed, user_id) VALUES (?, ?, ?, ?)";
                            db.conn.query(sql_query, [note_id, list[task][1], list[task][2], user_id], async (err, result) => {
                                if (err) {
                                    console.log('Error: ', err);
                                    resolve([500, 'Database error']);
                                }
                            });
                        }
                    }
                    resolve([200, {
                        note_id: note_id,
                        title: title,
                        is_fav: 0,
                        is_note: 1
                    }])
                }
            });
            
            if (connection) connection.release();
        })

    });
};

function updateTitle(user_id, note_id, title) {
    return new Promise(resolve => {
        const sql_query = "UPDATE note SET title = ? WHERE user_id = ? AND note_id = ?";


        db.conn.getConnection(function (err, connection) {
            if (err) {
                console.error('Database error: ', err);
                resolve([500, 'Database Error']);
            }
            
            connection.query(sql_query, [title, user_id, note_id], async (err, result) => {
                if(err) {
                    console.log('Error: ', err);
                    resolve([500, 'Database error']);
                } else {
                    if (result.affectedRows === 1){
                        resolve([200]);
                    }
                }
            });
            
            if (connection) connection.release();
        })
    });
};

function updateMessage(user_id, note_id, message) {
    return new Promise(resolve => {
        const sql_query = `
            INSERT INTO message (note_id, user_id, message_content) 
            VALUES (?, ?, ?) 
            ON DUPLICATE KEY UPDATE message_content = VALUES(message_content)
        `

        db.conn.getConnection(function (err, connection) {
            if (err) {
                console.error('Database error: ', err);
                resolve([500, 'Database Error']);
            }

            connection.query(sql_query, [note_id, user_id, message], async (err, result) => {
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

            if (connection) connection.release();
        })

    });
};


// Get all the tasks and their details associated with a list
function getTasks(user_id, note_id) {
    return new Promise(resolve => {
        const sql_query = 'SELECT * FROM task WHERE note_id = ? AND user_id = ?';
        
        db.conn.getConnection(function (err, connection) {
            if (err) {
                console.error('Database error: ', err);
                resolve([500, 'Database Error']);
            }

            connection.query(sql_query, [note_id, user_id], async (err, result) => {
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
            })
            
            if (connection) connection.release();
        })

    });
};


function deleteTask(user_id, task_id) {
    return new Promise(resolve => {
        const sql_query = 'DELETE FROM task WHERE user_id = ? AND task_id = ?'

        db.conn.getConnection(function (err, connection) {
            if (err) {
                console.error('Database error: ', err);
                resolve([500, 'Database Error']);
            }

            connection.query(sql_query, [user_id, task_id], async (err, result) => {
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
            
            if (connection) connection.release();
        })
    });
};

function deleteNote(user_id, note_id) {
    return new Promise(resolve => {
        const sql_query = 'DELETE FROM note WHERE user_id = ? AND note_id = ?'

        db.conn.getConnection(function (err, connection) {
            if (err) {
                console.error('Database error: ', err);
                resolve([500, 'Database Error']);
            }

            connection.query(sql_query, [user_id, note_id], async (err, result) => {
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
            
            if (connection) connection.release();
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