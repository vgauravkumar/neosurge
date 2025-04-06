const express = require('express');
require('dotenv').config('.env');
const { starterFiles } = require('./src/middleware/starter');
const logger = require('./src/services/logger');
const passport = require('passport');
const nodeSchedule = require('node-schedule');

/* ------------------------ Configuration middlewares ----------------------- */
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Pass the global passport object into the configuration function
require('./src/middleware/auth/passport')(passport);

// This will initialize the passport object on every request
app.use(passport.initialize());

/* ---------------------- Declare global variables here --------------------- */
global["DBC"] = 0; // Database connection count

/* ---------------------------- User middlewares ---------------------------- */
app.use(starterFiles);
app.use(require('./src/routes/handler'));

module.exports = { nodeSchedule } ;
require('./src/services/processes').jobs();


// Server listens at this port
app.listen(process.env.PORT, () => {
    logger.info(`Server starting on port ${process.env.PORT}`);
});