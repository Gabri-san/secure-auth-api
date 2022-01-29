const bcrypt = require('bcryptjs');
const db = require('./dbConnector');

const database = db.dbConnect;
database.model();
const sequelize = database.sequelizeInstance;

require("yargs")
.scriptName("adduser")
.usage("$0 <cmd> [args]")
.command(
    "email [email], password [password]",
    "welcome ter yargs!",
    (yargs) => {
        yargs.positional(
            "email", { type: "string", describe: "adresse e-mail de l'utilisateur"},
            "password", { type: "string", describe: "mot de passe de l'utilisateur"}
        );
    },
    function (argv) {
        let email = argv.email;
        let password = argv.password;
        var salt = bcrypt.genSaltSync(10);
        var hash = bcrypt.hashSync(password, salt);
        sequelize.models.User.create({
            email: email,
            password: hash,
            salt: salt,
        }).then(() => {
            console.log("utilisateur enregistré");
        });
    }
)
.help().argv;