const JwtStrategy = require('passport-jwt').Strategy
const ExtractJwt = require('passport-jwt').ExtractJwt;
const fs = require('fs');
const path = require('path');
const logger = require('../../services/logger');
const { Database } = require('../../services/db');

const pathToKey = path.join(__dirname, 'id_rsa_pub.pem');
const PUB_KEY = fs.readFileSync(pathToKey, 'utf8');

// At a minimum, you must pass the `jwtFromRequest` and `secretOrKey` properties
const options = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: PUB_KEY,
    algorithms: ['RS256']
};

// app.js will pass the global passport object here, and this function will configure it
module.exports = async (passport) => {
    // The JWT payload is passed into the verify callback
    passport.use(new JwtStrategy(options, async function (jwt_payload, done) {

        // logger.debug(jwt_payload);

        // We will assign the `sub` property on the JWT to the database ID of user
        try {
            const DB = new Database();
            const getUser = await DB.query(`SELECT user_id, user_type FROM user_login WHERE user_id = "${jwt_payload.sub}"`);
            DB.close();
            if (getUser.length)
                return done(null, getUser[0]);
            else
                return done(null, false);
        } catch (err) {
            return done(err, false);
        }
    }));
}