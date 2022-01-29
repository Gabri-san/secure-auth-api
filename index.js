const bcrypt = require("bcrypt");

/*
const db = require("./db");
const database = db.DbConnect;
console.log(db.DbConnect);
*/

const database  = require('./dbConnection');
//database.model();
//const sequelize = database.sequelizeInstance;
//const databaseReq = sequelize.models.User;

require("yargs")
  .scriptName("pirate-parser")
  .usage("$0 <cmd> [args]")
  .command(
    "email [email], password [password]",
    "welcome ter yargs!",
    (yargs) => {
      yargs.positional(
        "email",
        {
          type: "string",
          describe: "adresse e-mail du nouvel utilisateur.",
        },
        "password",
        {
          type: "string",
          describe: "mot de passe du nouvel utilisateur.",
        }
      );
    },
    function (argv) {
      let email = argv.email;
      let password = argv.password;
      var salt = bcrypt.genSaltSync(10);
      var hash = bcrypt.hashSync(password, salt);
      let state = false;

      databaseReq.create({
          userName: userName,
          password: hash,
          salt: salt,
    })
        .then(() => {
          console.log("L'ajout de votre utilisateur a bien été effectué !");
        });
    }
  )
  .help().argv;