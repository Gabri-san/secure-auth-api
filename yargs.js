const yargs = require('yargs');
const bcrypt = require('bcryptjs');
const db = require('./dbConnector');

const database = db.dbConnect;
database.model();
const sequelize = database.sequelizeInstance;

yargs.command({
    command: 'adduser',
    describe: 'Enregistrer un nouvel utilisateur',
    builder: {
        email: {
            describe: "adresse e-mail de l'utilisateur",
            demandOption: true,
            type: 'string'     
        },
        password: {  
            describe: "mot de passe de l'utilisateur",
            demandOption: true,
            type: 'string'
        }
    },
    handler(argv) {
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
})
   
yargs.parse();