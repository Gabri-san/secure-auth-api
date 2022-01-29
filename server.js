var express = require('express');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('./dbConnector');

var app = express();
app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const database = db.dbConnect;
database.model();
const sequelize = database.sequelizeInstance;

const secret = "7t4Wn3VCLXGGEnvs";

app.use((err, req, res, next) => {
    console.log(err);
    err.statusCode = err.statusCode || 500;
    err.message = err.message || "Internal Server Error";
    res.status(err.statusCode).json({message: err.message,});
});

app.listen(3000,() => console.log("Server is running on port 3000"));

// --------------ROUTES----------------

app.post('/session', (req, res) => {
    let data = req.body;
    if (data.constructor === Object && Object.keys(data).length === 0) {
        res.status(204).send("NO CONTENT");
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
                        sameSite: true
                    }).status(201).send("CREATED");
                } else {
                    res.status(401).send("UNAUTHORIZED");
                }
            } else {
                res.status(401).send("UNAUTHORIZED");
            }
        });
    }
});

app.delete('/session', (req, res) => {
    const token = req.cookies.access_token;
    if (!token) {
        res.status(401).send("UNAUTHORIZED");
    } else {
        return res.clearCookie('access_token').status(204).json({ message: "NO CONTENT" });
    }
});

app.get('/me', (req, res) => {
    const token = req.cookies.access_token;
    if (!token) {
        res.status(401).send("UNAUTHORIZED");
    } else {
        jwt.verify(token, secret, (err, decoded) => {
            res.status(200).send(decoded);
        });
    }
});