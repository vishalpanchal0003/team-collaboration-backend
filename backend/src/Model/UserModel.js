
const mongoose = require("mongoose")
const jwt = require('jsonwebtoken')
const mongoosePagination = require('mongoose-paginate-v2')
const bcrypt = require("bcrypt")

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        minLength: 3,
        maxLength: 12
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,

    },
    password: {
        type: String,
        required: true,
        minLength: 6,
    },
    role: {
        type: String,
        required: true,
        enum: ["Manager", "Senior", "Intern"]
    },
    avatar: {
        type: String,
        // required: true
    },
    refreshToken: {
        type: String
    },
    otp: {
        type: String,

    },
    otpExpire: {
        type: Date,
    }

}, {
    timestamps: true
}
)

userSchema.plugin(mongoosePagination)

userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            name: this.name,
            email: this.email,
        }
        , process.env.ACCESS_TOKEN
        ,
        { expiresIn: process.env.ACCESS_TOKEN_EXP }
    )

}
userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            id: this._id

        },
        process.env.REFRESH_TOKEN,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXP
        }
    )

}


userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password)
}

userSchema.pre("save", async function () {
    if (!this.isModified("password")) return;
    this.password = await bcrypt.hash(this.password, 10);
});

const UserModel = mongoose.models.UserModel || mongoose.model("User", userSchema)

module.exports = UserModel