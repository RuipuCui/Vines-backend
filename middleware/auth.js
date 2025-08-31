// const admin = require('../config/firebaseAdmin')

// async function auth(req, res, next) {
//     console.log("--- start auth check ---")
//     try{
//         const authHeader = req.headers['authorization'];

//         console.log('Received Authorization header:', req.headers['authorization']);


//         if(!authHeader || !authHeader.startsWith('Bearer')){
//             return res.status(401).json({error: 'Authorization header missing'});
//         };

//         const token = authHeader.split(' ')[1];
//         const decoded = await admin.auth().verifyIdToken(token);
//         req.user = {
//             userId: decoded.uid,
//         };
//         return next();
//     }catch (err){
//         console.error('verifyIdToken failed:', err.code, err.message);
//         return res.status(403).json({error: 'Invalid or expired token'})
//     };
// };

// module.exports = auth;

const admin = require('../config/firebaseAdmin')

async function auth(req, res, next) {
    console.log("--- start auth check ---")
    try{
        req.user = {
            userId: 1,
        };
        return next();
    }catch (err){
        console.error('verifyIdToken failed:', err.code, err.message);
        return res.status(403).json({error: 'Invalid or expired token'})
    };
};

module.exports = auth;