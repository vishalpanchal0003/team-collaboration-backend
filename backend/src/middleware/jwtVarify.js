const jwt = require('jsonwebtoken');
const UserModel = require('../Model/UserModel');
const ApiError = require('../helper/ApiError');

const jwtVerify = async(req,  res, next) => {
   let token = req.cookies?.accessToken || req?.header("Authorization")?.replace("Bearer ","")
    if (!token) {
        throw new ApiError(401, "token not provided unAuth")
    }
    let decodeToken = jwt.verify(token, process.env.ACCESS_TOKEN);
    if(!decodeToken){
        throw new ApiError(401,"invalide Access token")
    }
    const user = await UserModel.findById(decodeToken?._id).select("-password -refreshToken")
    req.user = user
    next()
}


module.exports = jwtVerify