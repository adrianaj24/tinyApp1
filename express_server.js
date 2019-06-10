var cookieSession = require("cookie-session");
var express = require("express");
var app = express();
var PORT = 8080;
const bcrypt = require("bcrypt");

//using session for cookies
app.use(
  cookieSession({
    name: "session",
    keys: ["monkey", "star"]
  })
);

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));

app.set("view engine", "ejs"); //add ejs

//function allows the app to generate a random user id
function generateRandomString() {
  var text = "";
  var possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < 7; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

//function checks if user is in database
function lookUpUser(email) {
  for (userID in users) {
    if (email === users[userID].email) return userID;
  }
  return null;
}

//function to check password after is hashed
function createHashedPassword(password) {
  const hashedPassword = bcrypt.hashSync(password, 10);
  return hashedPassword;
}

//function checks for urls to individual user
function urlsForUser(user_id) {
  let urls = {};
  for (shortURL in urlDatabase) {
    if (user_id === urlDatabase[shortURL].userID) {
      urls[shortURL] = urlDatabase[shortURL];
    }
  }
  return urls;
}

//creates a database of urls with userID
const urlDatabase = {
  b6UTxQ: { longURL: "https://www.tsn.ca", userID: "userRandomID" },
  i3BoGr: { longURL: "https://www.google.ca", userID: "aJ48lW" }
};

//users database with hardcoded users
let users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: createHashedPassword("123")
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: createHashedPassword("dishwasher-funk")
  }
};

//--------------------------------- GET ---------------------------------------//

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.listen(PORT, () => {});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});
app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

//display urls created by logged in user
app.get("/urls", (req, res) => {
  let user_id = req.session["user_id"];
  let templateVars = { urls: urlsForUser(user_id), user: users[user_id] };
  res.render("urls_index", templateVars);
});

//creating new url page
app.get("/urls/new", (req, res) => {
  if (!req.session.user_id) {
    return res.redirect("/login");
  }
  let templateVars = { user: users[req.session["user_id"]] };
  res.render("urls_new", templateVars);
});

//page for each unique url
app.get("/urls/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL] === undefined) {
    res.redirect("/urls");
  }
  let templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL,
    user: users[req.session.user_id]
  };

  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL] === undefined) {
    res.status(400).send("Please Enter a Valid TinyUrl");
  }
  var longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

//Registration page
app.get("/register", (req, res) => {
  let templateVars = { user: req.session["user_id"] };
  res.render("registration", templateVars);
});

//login page
app.get("/login", (req, res) => {
  let templateVars = { user: users[req.session.user_id] };
  if (templateVars.user) {
    res.redirect("/urls");
    return;
  }
  res.render("login", templateVars);
});

//---------------------------------------POSTS-----------------------------------------//

app.post("/urls", (req, res) => {
  if (req.session.user_id) {
    var shortUrl = generateRandomString();
    var longURL = req.body.longURL;
    urlDatabase[shortUrl] = {
      longURL: longURL,
      userID: req.session.user_id
    };
    res.redirect("/urls");
  } else {
    res.status(400).send("Please Login");
  }
});

//post allows users to delete their urls
app.post("/urls/:shortURL/delete", (req, res) => {
  let shortURL = urlDatabase[req.params.shortURL];
  if (shortURL.userID === req.session.user_id) {
    delete urlDatabase[req.params.shortURL];
  }
  res.redirect("/urls");
});

//post updates long url
app.post("/urls/:shortURL", (req, res) => {
  let shortURL = urlDatabase[req.params.shortURL];
  if (shortURL.userID !== req.session.user_id) {
    res.status(404).send("Please login to your account to edit");
  } else {
    shortURL.longURL = req.body.longURL;
    res.redirect("/urls");
  }
});

//post checks if user is registered and will allow login or send an error message
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  for (let userID in users) {
    if (
      email === users[userID].email &&
      bcrypt.compareSync(password, users[userID].password)
    ) {
      req.session.user_id = userID;
      res.redirect("/urls");
      return;
    }
  }
  res.status(400).send("Please enter valid user");
});

//post for registration, checks if user has already been created sends an error or allows to create user
app.post("/register", (req, res) => {
  const userId = generateRandomString();
  const email = req.body.email;
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10);

  if (lookUpUser(email)) {
    res.status(400).send("User Has Already Been Created!");
  } else if (!email || !password) {
    res.status(400).send("Please Enter a Valid Email and Password");
  } else {
    users[userId] = {
      id: userId,
      email: email,
      password: hashedPassword
    };
    req.session.user_id = userId;
    res.redirect("/urls");
  }
});

//allows users to logout and end the session
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});
