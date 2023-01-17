// making sure that enviromental variables are available to this file
require("dotenv").config();
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

const indexRouter = require("./routes/index");
const usersRouter = require("./routes/users");
const catalogRouter = require("./routes/catalog"); //Import routes for "catalog" area of site

// middleware to compress responses in prod environment
const compression = require("compression");

//sets headers for security reasons in production environment
const helmet = require("helmet");


var app = express();

// Set up database connection
const mongoose = require("mongoose");
const dev_mongoDB = process.env.DB_URI;

const mongoDB = process.env.MONGODB_URI || dev_mongoDB;

mongoose.connect(dev_mongoDB);
const connection = mongoose.connection;
connection.on("connected", function () {
  console.log("Mongoose connected to DB");
});
connection.on("error", function (err) {
  console.log("Mongoose connection error: " + err);
  // or 
  // console.error.bind(console, "MongoDB connection error:")
});
connection.on("disconnected", function () {
  console.log("Mongoose disconnected");
});
process.on("SIGINT", function () {
  connection.close(function () {
    console.log("Mongoose disconnected through app termination");
    process.exit(0);
  });
});


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// uncomment after placing your favicon in /public
app.use(compression());
app.use(helmet());
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use("/", indexRouter);
app.use("/users", usersRouter);
app.use("/catalog", catalogRouter); // Add catalog routes to middleware chain.


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {}

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
