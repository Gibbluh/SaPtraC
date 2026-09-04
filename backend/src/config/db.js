const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB connected successfully");
    } catch (error) {
        console.error("MongoDB connection error:", error);
        process.exit(1); // Exit the process with an error code
    }
};

module.exports = connectDB;

//mongodb+srv://jonathanrioveros2005_db_user:rP94fTzlqTbpxwP6@cluster0.zeygidj.mongodb.net/?appName=Cluster0