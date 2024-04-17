const mysql = require('mysql');

/////////////// Local Database Connection ///////////////

// const conn = mysql.createPool({
//     host: "localhost",
//     user: "root",
//     password: "Eldest1396",
//     database: "todolist",
//     waitForConnections: true,
//     connectionLimit: 10,
// });

/////////////////////////////////////////////////////////


//////////// AWS RDS Database Connection //////////////

const conn =  mysql.createPool({
    host: "db-taskmaster.c1iwammg4frg.us-east-1.rds.amazonaws.com",
    user: "gaurav",
    password: "Brisingr1396",
    database: "dbtaskmaster",
    connectionLimit: 10,
    waitForConnections: true,
})

///////////////////////////////////////////////////////



// conn.connect(function(err) {
//     if (err) throw err;
//     console.log("Connected to database!");
// });

conn.getConnection(function(err, connection) {
    if (err) throw err;

    if (connection) {
        console.log("Connected to database!");
        connection.release();
    }
});

module.exports = {
    conn
}
