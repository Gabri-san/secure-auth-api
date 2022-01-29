var express = require("express");
var app = express();
var cookieParser = require("cookie-parser");
require("dotenv").config();
const port = 3005;
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const bodyParser = require("body-parser");
const db = require("./db");
const { stat } = require("fs");

const secret = process.env.TOKEN_SECRET;
console.log(secret);

app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const database = db.DbConnect;
console.log(db.DbConnect);
database.model();
const sequelize = database.sequelizeInstance;
const databaseReq = sequelize.models.User;

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

app.get("/me", (req, res) => {
  const token = req.cookies.access_token;
  if (!token) {
    res.status(401).send("UNAUTHORIZED");
  } else {
    jwt.verify(token, secret, (r, decode) => {
      res.status(200).send(decode);
    });
  }
});

//open session
app.post("/session", (req, res) => {
  let reqdata = req.body;

  // verif requete vide
  if (req.body.constructor === Object && Object.keys(req.body).length === 0) {
    res.status(204).send("NO CONTENT");
  } else {
    //execute req
    databaseReq
      .findOne({
        where: {
          userName: reqdata.username,
        },
      })
      .then((user) => {
        if (user) {
          if (checkPassword(user.password, reqdata.password, user.salt)) {
            sqlUpdateSalt(reqdata.username, reqdata.password);
            console.log("on passe a la derniere etape ");
            const accessToken = jwt.sign(
              { username: reqdata.username },
              secret
            );
            return res
              .cookie("access_token", accessToken, {
                httpOnly: true,
                secure: true,
              })
              .status(201)
              .json({
                accessToken,
              });
          } else {
            res.status(401).send("UNAUTHORIZED");
          }
        } else {
          res.status(401).send("UNAUTHORIZED");
        }
      });
  }
});

app.delete("/session", (req, res) => {
  const token = req.cookies.access_token;
  if (!token) {
    res.status(401).send("UNAUTHORIZED");
  } else {
    return res
      .clearCookie("access_token")
      .status(204)
      .json({ message: "Successfully logged out 😏 🍀" });
  }
});

function checkPassword(passDb, passReq, salt) {
  var hash = bcrypt.hashSync(passReq, salt);
  return bcrypt.compare(passDb, hash);
}

function sqlUpdateSalt(userName, pw) {
  var salt = bcrypt.genSaltSync(10);
  var hash = bcrypt.hashSync(pw, salt);
  var state = false;
  console.log(userName);
  databaseReq
    .update(
      { password: hash, salt: salt },
      {
        where: {
          userName: userName,
        },
      }
    )
    .then((result) => {
      console.log(result);
      return true;
    });
  console.log(state);
}
