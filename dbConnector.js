const { Sequelize, DataTypes } = require("sequelize");

class dbConnector {

    #sequelizeInstance = null;
    static #dbInstance = null;
    
    constructor() {
        this.#sequelizeInstance = new Sequelize("secure_auth", "root", "", {
            host: "localhost",
            dialect: "mysql"
        });
    }
    
    static get dbConnect() {
        if (!dbConnector.#dbInstance) {
            dbConnector.#dbInstance = new dbConnector();
        }
        return dbConnector.#dbInstance;
    }
    
    get sequelizeInstance() { return this.#sequelizeInstance; }
    
    test() {
        try {
            sequelize.authenticate();
            console.log("database OK");
        } catch (error) {
            console.error("database KO :", error);
        }
    }
    
    model() {
        this.#sequelizeInstance.define(
            "User",
            {
                email: {
                    type: DataTypes.TEXT,
                    primaryKey: true
                },
                password: DataTypes.TEXT,
                salt: DataTypes.TEXT
            },
            { timestamps: false }
        );
    }
}

module.exports = dbConnector;