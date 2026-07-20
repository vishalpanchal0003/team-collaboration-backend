const mongoose = require("mongoose")

const teamSchema = new mongoose.Schema({
    teamName: {
        unique:true,
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true,
    },
    leaderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    members: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    ]
},
    {
        timestamps: true
    })

const TeamModel = mongoose.models.Team || mongoose.model("team", teamSchema)
module.exports = TeamModel;