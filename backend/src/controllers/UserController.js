const express = require("express");
const mongoose = require("mongoose")
const bcrypt = require("bcrypt")
const data = require("./data.json")
const UserModel = require("../Model/UserModel");
const ApiError = require("../helper/ApiError")
const ApiResponse = require("../helper/ApiResponse");
const { transporter, sendingMail } = require("../helper/mailservice");
const ProjectModel = require("../Model/ProjectModel");
const TeamModel = require("../Model/TeamsModel");

const generateAccessTokenAndRefreshToken = async (userId) => {
    try {
        const user = await UserModel.findById(userId)
        if (!user) {
            throw new ApiError(401, "UnAuthorized User")
        }
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()
        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false })
        return { accessToken, refreshToken }
    } catch (error) {
        console.log("generating tokens while errors", error)
        throw new ApiError(500, "something went wrong while generating tokens")
    }
}

const userRegistration = async (req, res) => {
    let { email, password, role, name, } = req.body;
    try {
        if (!email || !role || !password || !name) {
            return res.status(400)
                .json(
                    new ApiError(
                        400,
                        "All fields are required !"
                    )
                )
        }
        const existingUser = await UserModel.findOne({ email });
        if (existingUser) {
            return res.status(409)
                .json(
                    new ApiError(
                        409,
                        "User already exists with this email"
                    )
                )
        }
        let createdUser = await UserModel.create({
            email,
            password,
            name,
            role
        })

        if (!createdUser) return null
        const userWithoutPassword = createdUser.toObject();
        delete userWithoutPassword.password;
        let option = {
            httpOnly: true,
            secure: true
        }
        let { refreshToken, accessToken } = await generateAccessTokenAndRefreshToken(createdUser._id)

        return res
            .status(201)
            .cookie("refreshToken", refreshToken, option)
            .cookie("accessToken", accessToken, option)
            .json(new ApiResponse(
                "User Registration successful",
                {
                    userWithoutPassword,
                },
                201,
            ))
    } catch (error) {
        console.log(error)
    }
}

const userLogin = async (req, res) => {
    let { email, password } = req.body;
    try {
        if (!email || !password) {
            return res.status(400) // Changed from 401 to 400 for missing fields
                .json(
                    new ApiError(
                        400,
                        "All fields are required !"
                    )
                )
        }
        let user = await UserModel.findOne({ email })
        if (!user) {
            return res.status(404)
                .json(
                    new ApiError(
                        404,
                        "User account not found !"
                    )
                )
        }

        const isMatch = await user.isPasswordCorrect(password);
        if (!isMatch) {
            return res.status(401)
                .json(
                    new ApiError(
                        401,
                        "User credentials are wrong !"
                    )
                )
        }

        let option = {
            httpOnly: true,
            secure: true
        }
        let { accessToken, refreshToken } = await generateAccessTokenAndRefreshToken(user._id)
        if (!accessToken || !refreshToken) {
            throw new ApiError(500, "failed to generate tokens") // Changed status to 500 for server error
        }
        const userWithoutPassword = user.toObject();
        delete userWithoutPassword.password;
        delete userWithoutPassword.refreshToken
        return res
            .status(200)
            .cookie("refreshToken", refreshToken, option)
            .cookie("accessToken", accessToken, option)
            .json(new ApiResponse(
                "User login successful",
                {
                    user: userWithoutPassword,
                },
                200,
            ))
    } catch (error) {
        console.log(error)
        throw new ApiError(500, "Something happened while login")
    }
}

const userLogout = async (req, res) => {
    let user = req.user;

    console.log("user data", user)
    try {
        if (!user) {
            throw new ApiError(401, "User not logged in!")
        }
        await UserModel.findByIdAndUpdate(user._id,
            {
                $set: {
                    refreshToken: undefined
                }
            },
            { new: true }
        )
        let option = {
            httpOnly: true,
            secure: true
        }
        return res
            .status(200)
            .clearCookie("refreshToken", option)
            .clearCookie("accessToken", option)
            .json(new ApiResponse("User loggedOut successfully", null, 200))
    } catch (error) {
        console.log(error)
        throw new ApiError(500, "Something happened while logging out the user")
    }
}

const changeUserPassword = async (req, res) => {
    let user = req.user;
    console.log("user", user)
    try {
        if (!user) {
            throw new ApiError(401, "UnAuthorized User")
        }
        let { oldPassword, newPassword, confirmPassword } = req.body;


        if (!oldPassword || !newPassword || !confirmPassword) {
            return res.status(400)
                .json(
                    new ApiError(
                        400,
                        "All fields are required !"
                    )
                )
        }

        if (newPassword !== confirmPassword) {
            return res.status(400)
                .json(
                    new ApiError(
                        400,
                        "Your new password and confirm password are not same, please verify!"
                    )
                )
        }

        if (oldPassword.toLowerCase() === newPassword.toLowerCase()) {
            return res.status(400) // Changed from 401 to 400
                .json(
                    new ApiError(
                        400,
                        "Password and new password are same, please try a new one!"
                    )
                )
        }

        const userPassword = await UserModel.findById(user._id)
        const isMatch = await userPassword.isPasswordCorrect(oldPassword);

        if (!isMatch) {
            return res.status(401)
                .json(
                    new ApiError(
                        401,
                        "Current password is incorrect !"
                    )
                )
        }

        const userObj = userPassword.toObject();
        delete userObj.password;
        delete userObj.refreshToken;

        // FIXED: Changed oldPassword to password
        userPassword.password = newPassword
        await userPassword.save({ validateBeforeSave: true })

        return res.status(200).json(new ApiResponse("Password changed successfully", userObj, 200))
    } catch (error) {
        console.log(error)
        throw new ApiError(500, "Something happened while changing the password")
    }
}

const sendOtp = async (req, res) => {
    let { email } = req.body
    try {
        if (!email) {
            return res.status(400) // Changed from 401 to 400
                .json(
                    new ApiError(
                        400,
                        "Email is required !"
                    )
                )
        }
        let userEmail = await UserModel.findOne({ email })
        if (!userEmail) {
            return res.status(404)
                .json(
                    new ApiError(
                        404,
                        "User email not found !"
                    )
                )
        }
        let generateRandom = Math.floor(100000 + Math.random() * 900000).toString();
        userEmail.otp = generateRandom;
        userEmail.otpExpire = Date.now() + 5 * 60 * 1000;
        await userEmail.save()

        const sendmail = await transporter.sendMail(sendingMail(email, generateRandom))
        if (!sendmail) {
            return res.status(500) // Changed from 401 to 500 for server failure
                .json(
                    new ApiError(
                        500,
                        "Email OTP is not sending at the time !"
                    )
                )
        }
        return res.status(200).json(new ApiResponse("OTP sent successfully to user email", sendmail, 200))
    } catch (error) {
        console.log(error)
        throw new ApiError(500, "Something happened while OTP sending process")
    }
}

const resetPassword = async (req, res) => {
    const { email, otp, newPassword, confirmPassword } = req.body;
    try {
        if (!email || !otp || !newPassword || !confirmPassword) {
            return res.status(400)
                .json(
                    new ApiError(
                        400,
                        "All fields are required !"
                    )
                )
        }
        const exitUser = await UserModel.findOne({ email })
        if (!exitUser) {
            return res.status(404)
                .json(
                    new ApiError(
                        404,
                        "User not found !"
                    )
                )
        }

        if (otp !== exitUser.otp) {
            return res.status(401)
                .json(
                    new ApiError(
                        401,
                        "Invalid user OTP !"
                    )
                )
        }
        if (Date.now() > exitUser.otpExpire) {
            return res.status(401)
                .json(
                    new ApiError(
                        401,
                        "User OTP is expired !"
                    )
                )
        }

        if (newPassword.toLowerCase() !== confirmPassword.toLowerCase()) {
            return res.status(400)
                .json(
                    new ApiError(
                        400,
                        "User new password and confirm password is not match, please verify !"
                    )
                )
        }
        exitUser.password = newPassword;
        exitUser.otp = null;
        exitUser.otpExpire = null;
        await exitUser.save()

        return res.status(200).json(new ApiResponse("User password reset successfully", null, 200))
    } catch (error) {
        console.log("errors des", error)
        throw new ApiError(500, "Something happened while resetting password")
    }
}

const getAllUser = async (req, res) => {
    const { page = 1 } = req.query

    try {
        let option = {
            page: parseInt(page),
            limit: 3
        }
        const allUser = await UserModel.paginate({}, option)

        return res.status(200).json(new ApiResponse("user get successfully", allUser, 200))
    } catch (error) {
        console.log(error)
    }
}

const practicePaginationWithDummyData = async (req, res) => {

    let limit = parseInt(req.query.limit) || 5;

    const cursor = req.query?.cursor ?? null;

    let filterd = cursor ? data.filter((item) => item.id > cursor) : data;

    const arrData = filterd.slice(0, limit)

    const nextCursor = arrData.length === limit ? arrData[arrData.length - 1].id : null;

    return res.status(200).json(new ApiResponse("data fetch successfully", {
        arrData, pagination: {
            limit,
            nextCursor,
            hasMore: cursor !== null
        }
    }, 200))
}

const practicePaginationWithDB = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 5;
        const cursor = req.query?.cursor;
        const search = req.query.search || "";

        let rolefilter = req.query.rolefilter || req.query.roleFilter || "";

        let filterd = {};
        if (cursor) {
            if (mongoose.Types.ObjectId.isValid(cursor)) {
                filterd = { _id: { $gt: cursor } };
            } else {
                filterd = {};
            }
        }

        let queryfilter = { ...filterd };

        if (search) {
            queryfilter.$or = [
                { name: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } }
            ];
        }

        if (rolefilter && rolefilter.length > 0) {
            queryfilter.role = { $in: rolefilter };
        }

        const records = await UserModel.find(queryfilter)
            .sort({ _id: 1 })
            .limit(limit + 1)
            .select("name email role");

        const hasMore = records.length > limit;
        if (hasMore) records.pop();

        const nextCursor = records.length > 0 ? records[records.length - 1]._id : null;

        return res.status(200).json(new ApiResponse("Data fetched successfully", {
            arrData: records,
            pagination: {
                limit,
                nextCursor,
                hasMore
            }
        }, 200));

    } catch (error) {
        console.error("Error:", error);
        return res.status(500).json({ message: error.message });
    }
};

const aggregatePractice = async (req, res) => {
    //     let status = req.query.status || "InProgress";
    try {

        //         // let result = await ProjectModel.aggregate([
        //         //     { $match: { status: status } },
        //         //     { $sort: { title: 1 } },
        //         //     {
        //         //             $group: {
        //         //                     _id: "$status",
        //         //                     count: { $sum: 1 },
        //         //                     info:{$push:"$$ROOT"}
        //         //                 }
        //         //             }
        //         //             // { $project: { title: 1, status: 1 } },
        //         // ])


        //         //✔️ Total Users
        //         // ✔️Total Managers
        //         // ✔️Total Seniors
        //         // ✔️Total Interns
        //         // Total Teams
        //         // Total Projects

        //         // let totalCountOfDB = await UserModel.aggregate([
        //         //     {
        //         //         $facet: {

        //         //             totalUser: [
        //         //                 { $count: "count" }
        //         //             ],


        //         //             totalManagers: [
        //         //                 { $match: { role: "Manager" } },
        //         //                 { $count: "count" }
        //         //             ],
        //         //             totalSenior: [
        //         //                 { $match: { role: "Senior" } },
        //         //                 { $count: "count" }
        //         //             ],

        //         //             totalIntern: [
        //         //                 { $match: { role: "Intern" } },
        //         //                 { $count: "count" }
        //         //             ],
        //         //             totalTeams: [
        //         //                 {
        //         //                     $lookup: {
        //         //                         from: "teams",
        //         //                         localField: "_id",
        //         //                         foreignField: "members",
        //         //                         as: "teamData"
        //         //                     }
        //         //                 },

        //         //                 { $unwind: "$teamData" },
        //         //                 { $group: { _id: "$teamData._id" } },
        //         //                 { $count: "count" }
        //         //             ],
        //         //         },
        //         //     },
        //         // ])




        //         //     let result = await UserModel.aggregate([
        //         //         { $match: { role: "Intern" }},
        //         // { $sort: { name: 1 } },
        //         // // {
        //         // //    $group: { _id: "$role", countRole: { $sum: 1 } }
        //         // // },
        //         // { $project: { email: 1, name: 1, role: 1 } }
        //         //     ])



        //         // let result = await TeamModel.aggregate([
        //         //     { $match: { teamName: "Frontend Team" } },
        //         //     { $unwind: "$members" },
        //         //     {
        //         //         $group: {
        //         //             _id: "$teamName",
        //         //             info:{$push:"$$ROOT"},
        //         //             totalTeams: { $sum: 1 },


        //         //         }
        //         //     },
        //         //     // { $project: { teamName: 1, description: 1 } },
        //         // ])



        //         // const findAllTeamAndProjects = await TeamModel.aggregate([
        //         //     {
        //         //         $lookup: {
        //         //             from: "projects",
        //         //             localField: "_id",
        //         //             foreignField: "teamId",
        //         //             as: "projects"
        //         //         }
        //         //     },
        //         //     {
        //         //         $match: { "projects": { $ne: [] } }
        //         //     },
        //         //     {
        //         //         $project: {
        //         //             teamName: 1, title: 1, description: 1,
        //         //             projects: {
        //         //                 title: 1,
        //         //                 description: 1,
        //         //                 status: 1
        //         //             }
        //         //         }
        //         //     },


        //         // ])


        //         //     let countUserbyTeams = await TeamModel.aggregate([
        //         //         // Frontend → 12 Users
        //         //         // Backend → 8 Users
        //         //         // Testing → 4 Users
        //         //            { $unwind: "$members" },

        //         // // Step 2: Ab count karein
        //         // {
        //         //     $group: {
        //         //         _id: "$teamName",
        //         //         memberCount: { $sum: 1 } // Ab ye har member ko count karega
        //         //     }
        //         // }
        //         //     ])


        //         let managerWishTeamCount = await UserModel.aggregate([

        //             { $match: { role: "Manager" } },
        //             {
        //                 $lookup: {
        //                     from: "teams",
        //                     localField: "_id",
        //                     foreignField: "leaderId",
        //                     as: "ManagerTeams"
        //                 }
        //             },
        //             {
        //                 $project: {
        //                     name: 1,
        //                     teamName: 1,
        //                 },
        //             },

        //     ])


        //   const findleaderInTeam = await TeamModel.find().populate("leaderId","name email role");
        // const getProjectsWithTeam = await ProjectModel.find().populate("teamId","teamName description")
        let teamName = req.body.teamName;
        const getTeamsAndMembers = await TeamModel.find()
        .populate(["leaderId", "members"], ["name", "role", "email"])

        res.status(200).json(new ApiResponse("data fetched successfully", getTeamsAndMembers, 200))
    } catch (error) {
        console.log("error info ", error)
        throw new ApiError(500, "server internal error")
    }
}




module.exports = {
    aggregatePractice,
    practicePaginationWithDummyData,
    practicePaginationWithDB,
    userRegistration,
    userLogin,
    changeUserPassword,
    userLogout,
    sendOtp,
    resetPassword,
    getAllUser
}