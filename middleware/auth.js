const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

module.exports = function auth(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]

    if (!token) {
        return res.status(401).json({error: 'missing token'});
    }

    try {
        //token verification
        const payload = jwt.verify(token, JWT_SECRET);

        req.user = payload;

        next();
    } catch (err) {
        return res.status(401).json({ error: 'expired or invalid token' });
    }
};