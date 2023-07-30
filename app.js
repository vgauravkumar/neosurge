const express = require('express');
require('dotenv').config('.env');
const { starterFiles } = require('./src/middleware/starter');
const logger = require('./src/services/logger');

/* ------------------------ Configuration middlewares ----------------------- */
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ---------------------- Declare global variables here --------------------- */
global["DBC"] = 0; // Database connection count

/* ---------------------------- User middlewares ---------------------------- */
app.use(starterFiles);
app.use(require('./src/routes/handler'));


// Server listens at this port
app.listen(process.env.PORT, () => {
    logger.info(`Server starting on port ${process.env.PORT}`);
});