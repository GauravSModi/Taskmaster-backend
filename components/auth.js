require('dotenv').config();
const bcrypt = require('bcrypt');
const db = require('./database');
const jwt = require('jsonwebtoken');

const saltRounds = 10; // Higher = slower, but more secure

/*  
    - Sanitize input
    - Verify user and email uniqueness
    - Add password after hashing 
*/
function signup(username, email, password) {

    return new Promise (resolve => {

        // TODO: Sanitize input here

        // Inputting values using the '?' placeholder also escapes the values (I think?)
        const sql_query = 'INSERT INTO User (username, email, password) VALUES (?, ?, ?)';
        
        // Using .then() to handle the asynchronous result of hashPass

        hashPass(password)
        .then(hashedPassword => {
            db.conn.query(sql_query, [db.conn.escape(username), db.conn.escape(email), hashedPassword], async (err, result) => {
                if (err) {

                // Could not successfully create user
                console.log("Error creating user: " + err.message + "     result: " + result);


                // MySQL error code for duplicate entry (unique constraint violation)
                if (err.code === 'ER_DUP_ENTRY') {
                    let duplicateField;
                    if (err.message.includes('username')) {
                        duplicateField = 'username';
                    } else if (err.message.includes('email')) {
                        duplicateField = 'email';
                    }
                    resolve([409, `duplicate ${duplicateField}`]);
                }
                
                } else {

                    // Successfully created user
                    resolve([200, 'user creation successful']);

                }
            })
        })
        .catch(e => {
            console.error('Promise rejected:', e);
        });
    })
};

/*
    - Sanitize input
    - Look for user in DB
*/
function login(username, password) {
    return new Promise(resolve => {
        const sql_query = 'SELECT * FROM User WHERE username = ?';

        db.conn.query(sql_query, [db.conn.escape(username)], async (err, result) => {
            if (err) {
                resolve([500, 'Database Error']);
            } else {
                if (result.length === 0) {
                    resolve([401, 'Login unsuccessful: Incorrect username']);
                } else {
                    console.log("User: " + result[0].user_id + " user: " + result[0].username);
                    if (await validateUser(password, result[0].password)) {
                        resolve([200, result[0].user_id]);
                    } else {
                        resolve([401, 'Login unsuccessful: User found, incorrect password']);
                    }
                }
            }
        });

    }).catch(err => {
        console.error('Promise rejected: ', err);
        resolve([500, "Server Error"]);
        throw err; // Re-throw the error to propagate it further
    });
}

// Use Bcrypt to de-salt and compare a stored password to a given password
function validateUser(password, hash) {
    return new Promise((resolve, reject) => {
        bcrypt.compare(password, hash)
        .then(res => {
            resolve(res);
        })
        .catch(err => {
            console.error('Error comparing passwords:', err);
            reject(err); // Reject the promise with the error
        });
    });
}

// Use Bcrypt to salt and hash a given password
function hashPass(password) {
    return new Promise((resolve, reject) =>{
        bcrypt.hash(password, saltRounds)
        .then(hash => {
            resolve(hash);
        })
        .catch(err => {
            res.json({message:'Error creating user: ', err});
        });
    });
}

function assignToken(user_id) {
    return jwt.sign(user_id, process.env.ACCESS_TOKEN_SECRET);
}

function authenticateToken(req, res, next) {
    console.log("AuthenticateToken()");
    const authHeader = req.headers['authorization'];
    console.log("authHeader: " + authHeader);
    const token = authHeader && authHeader.split(' ')[1]; // This is essentially to make sure header != null

    console.log("Token: " + token);
    if (token  == null) {
        return res.sendStatus(401);
    }

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user_id) => {
        if (err) return res.sendStatus(403); // You have a token, but it's invalid so don't have access
        console.log("Authenticated successfully!");
        req.user_id = user_id;
        next(); // Move on from middleware
    });
}


module.exports = {
    login,
    signup,
    assignToken,
    authenticateToken,
};































/*
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const users = [
  {
    id: 1,
    username: 'john',
    password: 'password123',
  },
];

passport.use(
  new LocalStrategy({ usernameField: 'username' }, (username, password, done) => {
    const user = users.find((user) => user.username === username);

    if (!user || user.password !== password) {
      return done(null, false, { message: 'Incorrect username or password' });
    }

    return done(null, user);
  })
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  const user = users.find((user) => user.id === id);
  done(null, user);
});

module.exports = passport;
*/