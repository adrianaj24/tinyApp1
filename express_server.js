var express = require("express");
var app = express();
var PORT = 8080;
var cookieParser = require('cookie-parser')

app.use(cookieParser())

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

function lookUpUser(email) {
    for (userID in users) {
        if (email === users[userID].email)
        return userID 
    }
    return null
}

//creates a database of urls 
var urlDatabase = {
    "b2xVn2": "http://www.lighthouselabs.ca",
    "9sm5xK": "http://www.google.com"
};

const users = {
    "userRandomID": {
        id: "userRandomID",
        email: "user@example.com",
        password: "purple-monkey-dinosaur"
    },
    "user2RandomID": {
        id: "user2RandomID",
        email: "user2@example.com",
        password: "dishwasher-funk"
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
//route handler for urls
app.get("/urls", (req, res) => {
    console.log(users);
    let user_id = req.cookies["user_id"]
    console.log("users", [user_id]);
    let templateVars = { urls: urlDatabase, user: users[user_id] };
    res.render("urls_index", templateVars);
});
app.get("/urls/new", (req, res) => {
    let templateVars = { user: users[req.cookies["user_id"]] };
    console.log(templateVars)
    res.render("urls_new", templateVars);
});
app.get("/urls/:shortURL", (req, res) => {
    let templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], user: req.cookies["user_id"] };
    res.render("urls_show", templateVars);
});
app.post("/urls", (req, res) => {
    var shortUrl = generateRandomString()
    var longURL = req.body.longURL
    urlDatabase[shortUrl] = longURL
    console.log(urlDatabase);                  // Log the POST request body to the console
    res.redirect(`urls/${shortUrl}`);         // Respond with 'Ok' (we will replace this)
});
app.get("/u/:shortURL", (req, res) => {
    const longURL = urlDatabase[req.params.shortURL]
    res.redirect(longURL);
});
app.post("/urls/:shortURL/delete", (req, res) => {
    delete urlDatabase[req.params.shortURL];
    res.redirect("/urls");
});
app.post("/urls/:shortURL", (req, res) => {                 //post updates long url
    urlDatabase[req.params.shortURL] = req.body.longURL
    res.redirect(`/urls/${req.params.shortURL}`);
});
app.post("/login", (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
    for (let userID in users) {
            if (email === users[userID].email && password === users[userID].password) {
                // req.session.user_id = userID;
                console.log("user id", userID)
                res.cookie("user_id", userID);
                res.redirect("/urls");
                return;
            }
        }
        res.status(400).send("Invalid User");
});
app.post("/register", (req, res) => {
    const userId = generateRandomString()
    const email = req.body.email
    const password = req.body.password

    if (!email || lookUpUser(email)) {
        console.log("already registered")
        res.status(400).send()
    } else {

        users[userId] = {   
            id: userId,
            email: email,
            password: password,
        }
    
        console.log(users[userId]);
        res.cookie("user_id", userId)
        console.log(userId)
        res.redirect("/urls");
    }
});
app.get("/register", (req, res) => {
    let templateVars = { user: req.cookies["user_id"] };
    res.render("registration", templateVars);
});
app.get("/login", (req, res) => {
    let templateVars = { user: req.cookies["user_id"] };
    res.render("login", templateVars);
});
app.post("/logout", (req, res) => {                   //allows users to logout
    res.clearCookie("user_id");
    res.redirect("/urls");
});