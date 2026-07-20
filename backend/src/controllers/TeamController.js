const ApiError = require("../helper/ApiError");
const ApiResponse = require("../helper/ApiResponse");
const TeamModel = require("../Model/TeamsModel");
const UserModel = require("../Model/UserModel")


// ✅ createTeam
// ✅ getAllTeams
// ✅ getTeamById
// ✅ updateTeam
// ✅ deleteTeam
//  addMemberToTeam
// removeMemberFromTeam

const createTeam = async (req, res) => {
    const { teamName, description } = req.body;
    try {
        const user = req.user;
        if (!user) {
            return
            res.status(401).json(ApiError("user is UnAuth", 401))
        }

        if (!teamName || !description) {
            return
            res.status(400).json(new ApiError("All fields are require!", 400)
            )
        }
        const createdTeam = await TeamModel.create({
            teamName,
            description
        })
        if (!createdTeam) {
            return res.status(500).json(new ApiError("somthing happend while creating a team", 500))
        }

        res.status(201).json(new ApiResponse(" team create successfully", createdTeam, 201))
    } catch (error) {
        console.log(error)
        throw new ApiError("somthing happend while create a team", 500)
    }

}

const updateTeamInfo = async (req, res) => {
    const { newTeamName, newDescription } = req.body;
    const { id } = req.params;
    try {
        const user = req.user;
        if (!user) {
            res.status(401).json(ApiError("user is UnAuth", 401))
        }
        const existTeam = await TeamModel.findById(id);

        if (!existTeam) {
            res.status(404).json(new ApiError("team not found !", 404)
            )
        }

        if (!newTeamName || !newDescription) {
            res.status(400).json(new ApiError("All fields are require!", 400)
            )
        }
        existTeam.description = newDescription;
        existTeam.teamName = newTeamName;
        await existTeam.save()

        res.status(200).json(new ApiResponse("team update successfully", existTeam, 200))
    } catch (error) {
        console.log(error)
        throw new ApiError("server error", 500)
    }
}

const deleteTeam = async (req, res) => {
    const { _id } = req.params;
    const user = req.user;
    if (!user) {
        return res.status(401).json(new ApiError("UnAuth User", 401))
    }
    const existTeam = await TeamModel.findByIdAndDelete(_id)
    if (!existTeam) {
        return res.status(500).json(new ApiError("team deletion failed", 500))
    }
    return res.status(200).json(new ApiResponse("team delete successfully", existTeam, 200))
}

const getAllTeams = async (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            return
            res.status(401).json(new ApiError(401, "UnAuthorize user!"))
        }
        const allTeams = await TeamModel.find();
        if (!allTeams) {
            return res.
                status(500).
                json(new ApiError(500, "somthing happend while fetching all teams"))
        }
        res.status(200).json(new ApiResponse("all teams fetched successfully", allTeams, 200))
    } catch (error) {
        console.log(error);
        throw new ApiError(500, "somthing happend while exicute this,server error")
    }
}

const getTeamById = async (req, res) => {
    const { _id } = req.params;
    const user = req.user;
    try {
        if (!user) {
            return res.status(401).json(new ApiError(401, "user is Unauthorized"))
        }
        if (!_id) {
            return res.status(400).json(new ApiError(400, "id is required"))
        }

        const gettingTeamById = await TeamModel.findById(_id);
        if (!gettingTeamById) {
            return res.status(404).json(new ApiError(404, "this team is not found or exist"))
        }
        res.status(200).json(new ApiResponse("team fetch successfully", gettingTeamById, 200))

    } catch (error) {
        console.log(error)
        throw new ApiError(500, "somthing happend while exicute this ")
    }
}

const addMemberToTeam = async (req, res) => {
    const { member, teamName } = req.body;
    const user = req.user;
    try {
        if (!user) {
            return res.status(401).json(new ApiError(401, "unAuthorized user !"))
        }
        if (!member) {
            return res.status(400).json(new ApiError(400, "members required"))
        }
        if (!teamName) {
            return res.status(400).json(new ApiError(400, "teamName required"))
        }
        const existMember = await UserModel.findOne({ email: member });
        if (!existMember) {
            return res.status(404).json(new ApiError(404, "member is not found"))
        }
        const existTeam = await TeamModel.findOne({ teamName });
        if (!existTeam) {
            return res.status(404).json(new ApiError(404, "team is not found"))
        }
        const memberInTeamAlready = existTeam.members.some((id) => id.toString() === member._id.toString());
        if (memberInTeamAlready) {
            return res.
                status(400).json(new ApiError(400, "member is already in team"))
        }
        existTeam.members.push(existMember._id)
        await existTeam.save()

        return res.status(200).json(new ApiResponse("member add successfully", existTeam, 200))
    } catch (error) {
        console.log(error)
        throw new ApiError(500, "somthing happend while add members in the team ")
    }
}

const removeMemberFromTeam = async (req, res) => {
    const { member, teamName } = req.body;
    const user = req.user;
    try {
        if (!user) {
            return res.status(401).json(new ApiError(401, "unAuthorized user !"))
        }
        if (!member) {
            return res.status(400).json(new ApiError(400, "members required"))
        }
        if (!teamName) {
            return res.status(400).json(new ApiError(400, "teamName required"))
        }
        const existTeam = await TeamModel.findOne({ teamName });
        if (!existTeam) {
            return res.status(404).json(new ApiError(404, "team is not found"))
        }
        const memberInTeamAlready = existTeam.members.some((m) => m === member || m.email === member);
        if (!memberInTeamAlready) {
            return res.
                status(404).json(new ApiError(404, "member not found in team"))
        }
        const updatedTeam = await TeamModel.findOneAndUpdate(
            { teamName: teamName },
            { $pull: { members: member } },
            { new: true, runValidators: true }
        )
        if (!updatedTeam) {
            return res.status(404).json(new ApiError(404, "somthing happend while remove remove from team"))
        }
        return res.status(200).json(new ApiResponse("member remove successfully from the team", updatedTeam, 200))
    } catch (error) {
        console.log(error)
        throw new ApiError(500, "somthing happend while remove members in the team ")
    }


}




module.exports = {
    createTeam,
    updateTeamInfo,
    deleteTeam,
    getAllTeams,
    getTeamById,
    addMemberToTeam,
    removeMemberFromTeam
}