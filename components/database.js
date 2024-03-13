const mysql = require('mysql');

/////////////// Local Database Connection ///////////////
const conn = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "Eldest1396",
    database: "todolist",
});

conn.connect(function(err) {
    if (err) throw err;
    console.log("Connected to database!");
});
/////////////////////////////////////////////////////////

module.exports = {
    conn
}