// MUST BE AT THE VERY TOP - BEFORE ANYTHING ELSE
const dns = require('node:dns/promises');
dns.setServers(['1.1.1.1', '8.8.8.8']);

const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 15000,
            socketTimeoutMS: 45000,
        });

        console.log(`✅ MongoDB Connected Successfully!`);
        console.log(`   Host     : ${conn.connection.host}`);
        console.log(`   Database : ${conn.connection.name}`);
    } 
    catch (error) {
        console.error(`❌ MongoDB Connection Error: ${error.message}`);
        if (error.message.includes('querySrv') || error.message.includes('ECONNREFUSED')) {
            console.error("   → DNS issue still detected.");
        }
        process.exit(1);
    }
};

module.exports = connectDB;