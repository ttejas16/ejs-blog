const jwt = require('jsonwebtoken');




function verifyToken(req,res,next) {
    // console.log("here");
    // console.log("cookies" ,req.cookies);
    const token =  req.cookies?.token;
    let user;
    // console.log(token);
    if (token) {
        const payload = jwt.verify(token,process.env.SECRET_KEY);
        // console.log(payload);
        user = {
            isAuthenticated :true,
            profile:{
                ...payload
            }
        };
    }
    else{
        user = {
            isAuthenticated:false,
            profile:null
        }
    }
    req.user = user;
    next();


}

module.exports = { verifyToken }