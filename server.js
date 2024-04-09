const express = require("express");
const app = express();
const session = require("express-session");
require("dotenv").config();
const mongoose = require("mongoose");
const path = require("path");
const { v4: uuidV4 } = require("uuid");
const passport = require("passport");
const cookieParser = require('cookie-parser');
const nocache = require("nocache")

//Port
const Port = process.env.PORT || 4000;

//DB connection
const db = mongoose.connect(process.env.DB_URI);
db.then(()=>{
    console.log("Database connected");
}).catch(()=>{
    console.log("Error in connecting to database");
})


//middelewares
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(nocache());

// Use cookie-parser middleware
app.use(cookieParser());

//setting view engine
app.set("view engine", "ejs");

//static files
app.use("/static", express.static(path.join(__dirname, "public")));
app.use("/temp", express.static(path.join(__dirname, "temp")));

//session
app.use(
  session({
    secret: uuidV4(),
    resave: false,
    saveUninitialized: false,
  })
);

//passport
app.use(passport.initialize());
app.use(passport.session());

//message
app.use((req,res,next)=>{
  res.locals.message = req.session.message;
  delete req.session.message;
    next();
  })

//route
app.use("/", require("./routes/adminRoutes"));
app.use("/", require("./routes/userRoutes"));

app.listen(Port, () => {
  console.log("Listerning to server http://localhost:4000");
});
