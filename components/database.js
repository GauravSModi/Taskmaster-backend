const mysql = require('mysql2');
require('dotenv').config();

/////////////// Local Database Connection ///////////////

const conn = mysql.createPool({
    host: process.env.LOCAL_HOST,
    user: process.env.LOCAL_USER,
    password: process.env.LOCAL_PASSWORD,
    database: process.env.LOCAL_DATABASE,
    waitForConnections: true,
    connectionLimit: 10,
});

/////////////////////////////////////////////////////////

//////////// AWS RDS Database Connection //////////////

// const conn =  mysql.createPool({
//     host: process.env.AWS_HOST,
//     user: process.env.AWS_USER,
//     password: process.env.AWS_PASSWORD,
//     database: process.env.AWS_DATABASE,
//     connectionLimit: 10,
//     waitForConnections: true,
// })

///////////////////////////////////////////////////////

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
