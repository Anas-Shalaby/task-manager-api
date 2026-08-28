import * as userService from '../services/userService.js';
import { sendSuccess } from '../utils/response.js';
import { createUserSchema, updateUserSchema } from '../validators/userValidator.js';
export const getUsers = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const search = req.query.search;
        const teamId = req.query.teamId;
        const result = await userService.getUsers({ search, teamId }, page, limit, req.user);
        res.json({ success: true, data: result });
    }
    catch (error) {
        res.status(error.code === 'FORBIDDEN' ? 403 : 500).json({ success: false, error: { message: error.message } });
    }
};
export const getUserById = async (req, res, next) => {
    try {
        const user = await userService.getUserById(req.params.id, req.user);
        res.json({ success: true, data: user });
    }
    catch (error) {
        res.status(error.code === 'FORBIDDEN' ? 403 : (error.code === 'NOT_FOUND' ? 404 : 500)).json({ success: false, error: { message: error.message } });
    }
};
export const createUser = async (req, res, next) => {
    try {
        const validatedData = createUserSchema.parse(req.body);
        const user = await userService.createUser(validatedData, req.user);
        res.status(201).json({ success: true, data: user });
    }
    catch (error) {
        res.status(error.code === 'FORBIDDEN' ? 403 : 400).json({ success: false, error: { message: error.message } });
    }
};
export const updateUser = async (req, res, next) => {
    try {
        const validatedData = updateUserSchema.parse(req.body);
        const user = await userService.updateUser(req.params.id, validatedData, req.user);
        res.json({ success: true, data: user });
    }
    catch (error) {
        res.status(error.code === 'FORBIDDEN' ? 403 : 400).json({ success: false, error: { message: error.message } });
    }
};
export const deleteUser = async (req, res, next) => {
    try {
        const result = await userService.deleteUser(req.params.id, req.user);
        res.json({ success: true, data: result });
    }
    catch (error) {
        res.status(error.code === 'FORBIDDEN' ? 403 : (error.code === 'CONFLICT' ? 409 : 500)).json({ success: false, error: { message: error.message } });
    }
};
export const getAssignableUsers = async (req, res, next) => {
    try {
        const teamId = req.query.teamId;
        const users = await userService.getAssignableUsers(req.user, teamId);
        return sendSuccess(res, users);
    }
    catch (error) {
        res.status(error.code === 'FORBIDDEN' ? 403 : 500).json({ success: false, error: { message: error.message } });
    }
};
//# sourceMappingURL=userController.js.map