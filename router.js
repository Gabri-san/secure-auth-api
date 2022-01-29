const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./dbConnector');

var app = express();
const router = express.Router();
var cookieParser = require("cookie-parser");

const secret = "toto";

app.use(cookieParser());

const database = db.dbConnector;
console.log(database);
database.model();
const sequelize = database.sequelizeInstance;

router.post('/session', (req, res) => {
    let data = req.body;
    if (data.constructor === Object && Object.keys(data).length === 0) {
        res.status(204).send("no data");
    } else {
        sequelize.models.User.findOne({
            where: { email: data.email }
        }).then((user) => {
            if (user) {
                // password validation
                let hash = bcrypt.hashSync(data.password, user.salt);
                let checking = bcrypt.compare(user.password, hash)
                if (checking) {
                    // updating salt
                    var newSalt = bcrypt.genSaltSync(10);
                    var newHash = bcrypt.hashSync(data.password, newSalt);
                    sequelize.models.User.update(
                        { password: newHash, salt: newSalt },
                        { where: { email: data.email } }
                    ).then((result) => {
                        console.log(result);
                        return true;
                    });
                    const token = jwt.sign({ email: data.email }, secret);
                    // set http only cookie
                    return res.cookie('access_token', token, {
                        httpOnly: true,
                        secure: true
                    }).status(201).json({ token });
                } else {
                    res.status(401).send("accès refusé");
                }
            } else {
                res.status(401).send("accès refusé");
            }
        });
    }
});

router.delete('/session', (req, res) => {
    const token = req.cookies.access_token;
    if (!token) {
        res.status(401).send("accès refusé");
    } else {
        return res.clearCookie('access_token').status(204).json({ message: "logged out" });
    }
});

app.get("/me", (req, res) => {
    const token = req.cookies.access_token;
    if (!token) {
        res.status(401).send("accès refusé");
    } else {
        jwt.verify(token, secret, (err, decoded) => {
            res.status(200).send(decoded);
        });
    }
});

module.exports = router;