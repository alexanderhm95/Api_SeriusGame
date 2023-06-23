const mongoose = require("mongoose");

const dbConnection = async () => {
    try {
        mongoose.set("strictQuery", false);
        await mongoose.connect( (process.env.DATABASE), {
            useUnifiedTopology: true,
            useNewUrlParser: true,
            autoIndex: true

        }).then(() => {
            console.log("Database connected");
        })
    } catch (error) {
        console.log(error);
    }
}

//Conexion  de la base de datos secundaria 
const dbConnection2 = async () => {
    try {
        mongoose.set("strictQuery", false);
        await mongoose.createConnection( 
            (process.env.DATABASE2), {
            useUnifiedTopology: true,
            useNewUrlParser: true,
            autoIndex: true
            }).then(() => {
            console.log("Database secundary connected");
        })
    } catch (error) {
        console.log(error);
    }
}

module.exports = { dbConnection, dbConnection2 };