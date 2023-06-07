const express = require("express");
const app = express();
const bcrypt = require("bcrypt");
const mysql = require('mysql');
const multer = require('multer');
const session = require('express-session');

//---------------------------------------Register----------------------------------------------------------//
app.use(express.urlencoded({ extended: true }));

// Configure session middleware
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true
}));

// Multer configuration for file upload
let uploadedFileName;

// Multer configuration for file upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads'); //where the uploaded files will be stored
    },
    filename: function (req, file, cb) {
        uploadedFileName = file.originalname; // assign file original name to a separate variable
        cb(null, file.originalname); //making the file name to be unique by adding a timestamp
    }
});

// console.log(uploadedFileName)
const upload = multer({ storage: storage });

app.post('/store_data', upload.single('image'), (req, res) => {
    const { email, password, fname, lname, Mobile } = req.body;
    const image = req.file;
    console.log(uploadedFileName)

    if (!email) {
        return res.status(401).send('<script>alert("Enter All Data"); window.location.href = "/register";</script>');
    }
    if (!image || !image.path) {
        return res.status(401).send('<script>alert("Enter All Data"); window.location.href = "/register";</script>');
    }

    const sql = `INSERT INTO user_details (username, password, firstname, lastname, mobile, image) VALUES (?, ?, ?, ?, ?, ?)`;
    const values = [email, password, fname, lname, Mobile, image.path,];

    connection.query(sql, values, (err) => {
        if (err) {
            console.error('Error storing data:', err);
            return res.sendStatus(500);
        }

        res.redirect('/login'); // Redirect to the login page
    });
});


//-------------------------------------------------------login----------------------------------------//


app.post('/login', (req, res) => {
    const { username, password } = req.body;

    const sql = 'SELECT user_id,password FROM user_details WHERE username = ?';
    connection.query(sql, [username], (err, results) => {
        if (err) {
            console.error('Error retrieving user details:', err);
            return res.sendStatus(500);
        }

        if (results.length === 0) {
            // User not found
            return res.status(401).send('<script>alert("Invalid username or password"); window.location.href = "/login";</script>');
        }

        const user = results[0];
        const userId = user.user_id;
        const storedPassword = user.password.replace("password: ", "");

        // Store the user ID in the session
        req.session.userId = userId;

        if (password === storedPassword) {
            console.log('Password is correct');
            // Successful login
            // You can store user information in the session or generate a token for authentication
            // For simplicity, let's just redirect to a success page
            return res.redirect('/');
        } else {
            console.log('Password is incorrect');
            return res.status(401).send('<script>alert("Invalid username or password"); window.location.href = "/login";</script>');
        }


    });
});


//-------------------------------------------------------home page-------------------------------------------------------------//
app.get('/', (req, res) => {
    const userId = req.session.userId;

    if (!userId) {
        // User is not logged in
        return res.redirect('/login');
    }

    const sql = 'SELECT * FROM user_details WHERE user_id= ?';
    connection.query(sql, [userId], (err, results) => {
        if (err) {
            console.error('Error retrieving user details:', err);
            return res.sendStatus(500);
        }

        if (results.length === 0) {
            // User not found
            return res.status(404).send('User not found');
        }

        const user = results[0];

        // Assuming the image is stored as a Buffer, convert it to a Base64 encoded string
        const image = Buffer.from(user.image).toString('base64');
        const imageUrl = `data:image/jpeg;base64,${image}`;


        // Render the home page with the user's data
        res.render('index.ejs', { user, imageUrl, uploadedFileName });
    });
});


//--------------------------------------------------------logout--------------------------------------------------------------------------//







//-------------------------------------------------------Mysql Connection----------------------------------------------------------------//
//creating connection
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'loon_med',
});

connection.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL');
});

//Routes
app.get('/', (req, res) => {
    const userId = req.session.userId;
    if (!userId) {
        // User is not authenticated, redirect to login page
        return res.redirect('/login');
    }
    res.render("index.ejs");
});

app.get('/login', (req, res) => {
    res.render("login.ejs");
});


app.get('/register', (req, res) => {
    res.render("register.ejs");
});

app.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
            return res.sendStatus(500);
        }

        // Set response headers to prevent caching
        res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
        res.header('Expires', '-1');
        res.header('Pragma', 'no-cache');

        res.redirect('/login');
    });
});

app.listen(3000);


