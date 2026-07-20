const mongoose = require("mongoose")

const projectSchema = new mongoose.Schema({
    title: {
        require: true,
        type: String
    },
    description: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ["InProgress", "Completed"],
        required: true,
        default: "InProgress"
    },
    teamId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "team"
    }
}, { timestamps: true }
)
const ProjectModel = mongoose.models.Project || mongoose.model("project", projectSchema)
module.exports = ProjectModel