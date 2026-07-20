const ApiError = require("../helper/ApiError");
const ApiResponse = require("../helper/ApiResponse");
const TaskModel = require("../Model/TaskModel");
const TeamModel = require("../Model/TeamsModel");

const createTask = async (req, res) => {
    const { taskTitle, description, priority, teamName, manager, deadline } = req.body;
    const user = req.user;
    try {
        if (!user) {
            return res.status(401).json(new ApiError(401, "user is unAuthorized !"))
        }
        if (!taskTitle || !description || !priority || !teamName || !manager || !deadline) {
            return res.status(400).json(new ApiError(400, "all fields are required !"))
        }
        const exitTeam = await TeamModel.findOne({ teamName });
        if (!exitTeam) {
            return res.status(404).json(new ApiError(404, "team not found !"))
        }

        const createdTask = await TaskModel.create({
            taskTitle,
            description,
            priority,
            deadline
        })
        createdTask.assignedBy = manager;
        createdTask.assignedTo = teamName;
        await createdTask.save({ runBeforValidate: true })

        return res.status(201).json(new ApiResponse("task create successfully", createdTask, 201))

    } catch (error) {
        console.log(error)
        throw new ApiError(500, "somthing happend while creating task")
    }
}