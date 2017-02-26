"use strict";

const admin = require("firebase-admin"),
    express = require("express"),
    app = express(),
    bodyParser = require("body-parser"),
    multer = require("multer"),
    upload = multer(),
    mongoose = require("mongoose"),
    url = "mongodb://localhost:27017/bookshelf",
    Schema = mongoose.Schema;

const serviceAccount = require("./privates/ng2-bookshelf-firebase-adminsdk-v0vhf-7316f78648.json");

mongoose.connect(url);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://ng2-bookshelf.firebaseio.com"
});

let BookSchema = new Schema({
  title: {
    type: String,
    required: true
  },
  author: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  addedBy: {
    type: String,
    required: true
  },
  rating: {
    type: Number,
    default: 0
  },
  industryIdentifiers: [
    {
      type: String,         // "ISBN_10"    || "ISBN_13"
      identifier: String    // "0716604892" || "9780716604891"
    }
  ],
  pageCount: Number
});

const Book = mongoose.model("Books", BookSchema);

const validateToken = (req, res, next) => {
  let token = req.headers.authorization;

  if(!token) res.sendStatus(401);
  else admin.auth().verifyIdToken(token).
      then(decodedToken => {
        req.uid = decodedToken.uid;
        next();
      }).
      catch(e => {
        res.status(400).send(e);
      });
};

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "http://localhost:4200");
  res.header("Access-Control-Allow-Headers", "Authorization, Content-Type");
  res.header('Access-Control-Allow-Methods', 'POST, PUT, DELETE, PATCH');

  if (req.method === 'OPTIONS') {
      res.sendStatus(200);
      return;
  }
  
  next();
});
app.use(validateToken);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.post("/book", (req, res) => {
  const book = req.body,
      uid = req.uid;

  if(!book) {
    res.status(400).send({ error: "Invalid book data", data: null });
    return;
  }

  book.addedBy = req.uid;
  Book.create(book, (err, data) => {
    if(err) {
      res.status(400).send({ error: "Unable to create a new book", data: null });
      return;
    }

    res.send({ error: null, data });
  });
});

app.get("/books", (req, res) => {
  Book.find({}, (err, data) => {
    console.log(data);
    res.send({ data });
  });
});

app.get("/book/:id", (req, res) => {
  const id = req.params.id;
  if(!id) {
    res.status(400).send({ error: "Missed book id", data: null });
    return;
  }

  Book.findById(id, (err, data) => {
    if(err) {
      res.status(404).send({ error: `Book with id "${id}" was not found`, data: null });
      return;
    }

    res.send({ error: null, data });
  });
});

app.listen(5000);
