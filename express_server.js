var cookieSession = require('cookie-session')
var express = require("express");
var app = express();
var PORT = 8080
const bcrypt = require('bcrypt');

app.use(cookieSession({
    name: 'session',
    keys: ["monkey", "star"]
}))


const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));

app.set("view engine", "ejs");  //add ejs

function generateRandomString() {                   //function allows the app to make a random user id
    var text = "";
    var possible =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (var i = 0; i < 7; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
};

function lookUpUser(email) {                    //function checks if user is in database
    for (userID in users) {
        if (email === users[userID].email)
        return userID 
    }
    return null
}

function createHashedPassword(password) {         //function to check password after is hashed
    const hashedPassword = bcrypt.hashSync(password, 10);
    return hashedPassword
}

function urlsForUser(user_id) {                 //function checks for urls to individual user
    let urls = {};
    for (shortURL in urlDatabase) {
        if (user_id === urlDatabase[shortURL].userID) {
            urls[shortURL] = urlDatabase[shortURL]
        }
    }
        return urls
}

const urlDatabase = {                               //creates a database of urls with userID
    b6UTxQ: { longURL: "https://www.tsn.ca", userID: "userRandomID" },
    i3BoGr: { longURL: "https://www.google.ca", userID: "aJ48lW" }
};

const users = {                                    //users database with hardcoded users 
    "userRandomID": {
        id: "userRandomID",
        email: "user@example.com",
        password: createHashedPassword("123") 
    },
    "user2RandomID": {
        id: "user2RandomID",
        email: "user2@example.com",
        password: createHashedPassword("dishwasher-funk")
    }
}

app.get("/", (req, res) => {
    res.send("Hello!");
});

app.listen(PORT, () => {
    console.log(`Example app listening on port ${PORT}!`);
});

app.get("/urls.json", (req, res) => {
    res.json(urlDatabase);
});
app.get("/hello", (req, res) => {
    res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
    let user_id = req.session["user_id"]
    let templateVars = { urls: urlsForUser(user_id), user: users[user_id] };
    res.render("urls_index", templateVars);
});
app.get("/urls/new", (req, res) => {
    let templateVars = { user: users[req.session["user_id"]] };
    res.render("urls_new", templateVars);
});
app.get("/urls/:shortURL", (req, res) => {
    let templateVars = {
        shortURL: req.params.shortURL,
        longURL: urlDatabase[req.params.shortURL].longURL, user: users[req.session.user_id] 
    };
    res.render("urls_show", templateVars);
});
app.post("/urls", (req, res) => {                       //
    var shortUrl = generateRandomString()
    var longURL = req.body.longURL
    if (req.session.user_id) {
        urlDatabase[shortUrl] = {
            longURL: longURL,
            userID: req.session.user_id
        }
    } else {
        res.status(400).send("Please Login");
    }   
    res.redirect("/urls");                         // Log the POST request body to the console        // Respond with 'Ok' (we will replace this)
});
app.get("/u/:shortURL", (req, res) => {
    var longURL = urlDatabase[req.params.shortURL].longURL             //post updates long url
    res.redirect(longURL);
});
app.post("/urls/:shortURL/delete", (req, res) => {
    let shortURL = urlDatabase[req.params.shortURL]
    if (shortURL.userID === req.session.user_id) {
        delete urlDatabase[req.params.shortURL];
    }
    res.redirect("/urls");
});
app.post("/urls/:shortURL", (req, res) => {
    var shortUrl = generateRandomString()
    var longURL = req.body.longURL               //post updates long url
    urlDatabase[shortUrl] = {
        longURL: longURL,
        userID: req.session.user_id,
    }
    res.redirect("/urls");
});
app.post("/login", (req, res) => {      //post checks if user is registered and will allow login or send an error message
    const email = req.body.email;
    const password = req.body.password;
    for (let userID in users) {
            if (email === users[userID].email && bcrypt.compareSync(password, users[userID].password)) {
                req.session.user_id = userID
                res.redirect("/urls")
            } else {
                res.status(400).send("Invalid User");
            }
        
        }
       
});
app.post("/register", (req, res) => {               //post for registration, checks if user has already been created sends an error or allows to create user
    const userId = generateRandomString()
    const email = req.body.email
    const password = req.body.password
    const hashedPassword = bcrypt.hashSync(password, 10);
    

    if (!email || lookUpUser(email)) {
        res.status(400).send()
    } else {

        users[userId] = {   
            id: userId,
            email: email,
            password: hashedPassword,
        }
    
        
        req.session.user_id = userId;
        res.redirect("/urls");
    }
});
app.get("/register", (req, res) => {
    let templateVars = { user: req.session["user_id"] };
    res.render("registration", templateVars);
});
app.get("/login", (req, res) => {
    let templateVars = { user: users[req.session.user_id] };
    if (templateVars.user) {
        res.redirect("/urls");
        return;
    }
    res.render("login", templateVars);
});
app.post("/logout", (req, res) => {                   //allows users to logout
    req.session = null;
    res.redirect("/login");
});