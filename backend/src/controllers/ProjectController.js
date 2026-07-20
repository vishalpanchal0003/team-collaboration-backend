// ProjectController
// ├── createProject  ✔️
// ├── getAllProjects ✔️
// ├── getProjectById ✔️
// ├── updateProject  ✔️
// ├── deleteProject  ✔️
// ├── assignTeam     ✔️

const ApiError = require("../helper/ApiError");
const ApiResponse = require("../helper/ApiResponse");
const ProjectModel = require("../Model/ProjectModel");
const TeamModel = require("../Model/TeamsModel");

const createProject = async (req, res) => {
    const { title, description, status } = req.body;
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json(new ApiError(401, "user is UnAuth"))
        }
        if (!title || !description || !status) {
            return res.status(400).json(new ApiError(400,
                "All fields are require !"
            ))
        }
        const createdProject = await ProjectModel.create({
            title,
            description,
            status,
        })
        if (!createdProject) {
            return res.status(500).json(new ApiError(500, "unable to create project server error"))
        }
        res.status(201).json(new ApiResponse("project create successfully", createdProject, 201))

    } catch (error) {
        console.log(error)
    }
}
const updateProject = async () => {
    const { newTitle, newDescription } = req.body;
    try {
        const user = req.user;
        const { id } = req.params;
        if (!user) {
            return res.status(401).json(new ApiError(401, "Unauth user!"))
        }
        if (!newTitle || !newDescription) {
            return res.status(400).json(new ApiError(400, "all fields are require!"))
        }
        const updatedProject = await ProjectModel.findByIdAndUpdate(id, {
            $set: {
                title: newTitle,
                description: newDescription
            }
        }, { new: true })
        if (!updatedProject) {
            return res.status(404).json(new ApiError(404, "Project not found"));
        }
        res.status(200).json(new ApiResponse("project updated successfully", updatedProject, 200))
    } catch (error) {
        console.log(error)
        throw new ApiError(500, "somting happend while exicute this")
    }
}

const deleteProject = async (req, res) => {

    const { id } = req.params;
    const user = req.user;
    try {
        if (!user) {
            return res.status(401).json(new ApiError(401, "user is Unauthorized"))
        }
        const projectDelete = await ProjectModel.findByIdAndDelete(id)
        if (!projectDelete) {
            return res.status(404).json(new ApiError(404, "somthing happend while delete this project"))
        }
        return res.status(200).json(new ApiResponse("project delete successfully ", projectDelete, 200))
    } catch (error) {
        console.log(error)
        throw new ApiError(500, "somthing happend while Execute this")
    }

}

const getAllProjects = async (req, res) => {
    const user = req.user;
    try {
        if (!user) {
            return
            res.status(401).json(new ApiError(401, "user is UnAuth !"))
        }
        const allProjects = await ProjectModel.find();
        if (!allProjects) {
            return res.status(404).json(new ApiError(404, "somthing happend  while fetching projects !"))
        }
        return res.status(200).json(new ApiResponse("projects fetched successfully", allProjects, 200))
    } catch (error) {
        console.log(error);
        throw new ApiError(500, "somthing happend while geting projects")
    }
}

const getProjectById = async (req, res) => {
    let user = req.user;
    let { _id } = req.params;
    try {
        if (!user) {
            return res.status(401).json(new ApiError(401, "user is UnAuthorized!"))
        }
        if (!_id) {
            return res.status(400).json(new ApiError(400, "id is required"))
        }
        const existProject = await ProjectModel.findById(_id);
        if (!existProject) {
            return res.status(404).json(new ApiError(404, "project not found !"))
        }

        res.status(200).json(new ApiResponse("project fetch successfully", existProject, 200))

    } catch (error) {
        console.log(error)
        throw new ApiError(500, "somthing happend while exicute this!")
    }
}
const assignTeam = async (req, res) => {
    let user = req.user;
    let { _id } = req.params;
    let { teamId } = req.body;
    try {
        if (!user) {
            return res.status(401).json(new ApiError(401, "user is UnAuthorized!"))
        }
        if (!teamId) {
            return res.status(400).json(new ApiError(400, "teamId is required"))
        }
        if (!_id) {
            return res.status(400).json(new ApiError(400, "id is required"))
        }
        const existProject = await ProjectModel.findById(_id);
        if (!existProject) {
            return res.status(404).json(new ApiError("project not found !", 404));
        }
        const teamExist = await TeamModel.findById(teamId);
        if (!teamExist) {
            return res.status(404).json(new ApiError(404, "team is not found!"))

        }

        if (existProject.teamId == null && existProject.teamId.toString() === teamId) {
            return res.status(400).json(new ApiError(400, "Team is already assigned!"));
        }
        existProject.teamId = teamId;
        await existProject.save()
        res.status(200).json(new ApiResponse("team assign successfully ", existProject, 200))
    }
    catch (error) {
        console.log(error)
        throw new ApiError(500, "somthing happend while exicte this !")
    }

}




module.exports = { 
    createProject,
    deleteProject,
    updateProject,
    assignTeam,
    getAllProjects,
    getProjectById

 }