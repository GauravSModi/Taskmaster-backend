const mysql = require('mysql');

/////////////// Local Database Connection ///////////////
// Change to createPool? To avoid: Error: Packets out of order. Got: 0 Expected: 13
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