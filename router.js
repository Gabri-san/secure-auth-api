const express = require('express');
const router = express.Router();
const db  = require('./dbConnection');
const { signupValidation, loginValidation } = require('./validation');
const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

router.post('/register', signupValidation, async (req, res, next) => {
    // génération du sel
    const salt = await bcrypt.genSalt(10);
    db.query(
        `SELECT * FROM users WHERE LOWER(email) = LOWER(${db.escape(req.body.email)});`,
        (err, result) => {
            if (result.length) {
                return res.status(409).send({
                    msg: 'Un compte existe déjà !'
                });
            } else {
                // username is available
                bcrypt.hash(req.body.password, salt, (err, hash) => {
                    if (err) {
                        return res.status(500).send({
                            msg: err
                        });
                    } else {
                        // has hashed pw => add to database
                        db.query(
                            `INSERT INTO users (email, password, salt) VALUES (
                                ${db.escape(req.body.email)},
                                ${db.escape(hash)},
                                ${db.escape(salt)}
                            )`,
                            (err, result) => {
                                if (err) {
                                    //throw err;
                                    return res.status(400).send({
                                        msg: err
                                    });
                                }
                                return res.status(201).send({
                                    msg: 'Compte crée avec succès.'
                                });
                            }
                        );
                    }
                });
            }
        }
    );
});

router.post('/session', loginValidation, async (req, res, next) => {
    const salt = await bcrypt.genSalt(10);
    db.query(
        `SELECT * FROM users WHERE email = ${db.escape(req.body.email)};`,
        (err, result) => {
            // user does not exists
            if (err) {
                throw err;
            }
            if (!result.length) {
                return res.status(401).send({
                    msg: 'Email or password is incorrect!'
                });
            }
            // check password
            bcrypt.compare(
                req.body.password,
                result[0]['password'],
                (bErr, bResult) => {
                    // wrong password
                    if (bErr) {
                        throw bErr;
                        return res.status(401).send({
                            msg: 'Email or password is incorrect!'
                        });
                    }
                    if (bResult) {
                        const token = jwt.sign({id:result[0].id},'the-super-strong-secrect',{ expiresIn: '1h' });
                        // update salt
                        db.query(
                            `UPDATE users SET salt = ${db.escape(salt)} WHERE email = ${db.escape(req.body.email)};`,
                            (err, result) => {
                                if (err) { throw err; }
                                bcrypt.hash(req.body.password, salt, (err, hash) => {
                                    if (err) {
                                        return res.status(500).send({ msg: err });
                                    } else {
                                        // has hashed pw => add to database
                                        db.query(
                                            `update users set password = ${db.escape(hash)} where email = ${db.escape(req.body.email)};`,
                                            (err, result) => {
                                                if (err) {
                                                    //return res.status(401).send({msg: 'Username or password is incorrect!'});
                                                    throw err;
                                                }
                                                res.set('Authorization', 'Bearer '+token);
                                                return res.status(200).send({
                                                    msg: 'Logged in!',
                                                    token,
                                                    user: result[0]
                                                });
                                            }
                                        );
                                    }
                                });
                            }
                        );
                    }
                }
            );
        }
    );
});

router.delete('/session', signupValidation, (req, res, next) => {
    if (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer') || !req.headers.authorization.split(' ')[1]) {
        return res.status(422).json({
            message: "Token invalide.",
        });
    }
    const theToken = req.headers.authorization.split(' ')[1];
    db.query(
        `INSERT INTO blacklist (token) VALUEs (${db.escape(theToken)});`,
        (err) => {
            if (err) { throw err; }
            return res.status(200).send({
                msg: 'Token blacklisted. Logged out.'
            });
        }
    );
    res.set('Authorization', 'none');
})

router.get('/me', signupValidation, (req, res, next) => {
    if(!req.headers.authorization || !req.headers.authorization.startsWith('Bearer') || !req.headers.authorization.split(' ')[1]) {
        return res.status(422).json({
            message: "Please provide the token",
        });
    }
    db.query('SELECT token FROM blacklist', function(err, result, fields) {
        if (err) throw err;
        const blacklist = [];
        Object.keys(result).forEach(function(key) {
            var row = result[key];
            blacklist.push(row.token);
        });
        console.log(blacklist);
        const theToken = req.headers.authorization.split(' ')[1];
        if(blacklist.includes(theToken)) {
            console.log("Token blacklisté");
            return res.status(422).json({
                message: "Token blacklisté !",
            });
        } else {
            console.log("Token OK");
            const decoded = jwt.verify(theToken, 'the-super-strong-secrect');
            db.query('SELECT * FROM users where id=?', decoded.id, function (error, results, fields) {
                if (error) throw error;
                return res.send({ error: false, data: results[0], message: 'Succes' });
        });
        }
    });
});

module.exports = router;