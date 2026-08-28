import * as taskService from '../services/taskService.js';
import { sendSuccess, sendError } from '../utils/response.js';
import * as timelineService from '../services/timelineService.js';
import { createTaskSchema, blockTaskSchema, reviewTaskSchema, addUpdateSchema, addCommentSchema } from '../validators/taskValidator.js';
export const listTasks = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const filters = {
            status: req.query.status,
            priority: req.query.priority,
            search: req.query.search,
            assigneeId: req.query.assigneeId,
            sort: req.query.sort
        };
        const result = await taskService.getTasks(filters, page, limit, req.user);
        return sendSuccess(res, result);
    }
    catch (error) {
        next(error);
    }
};
export const getMetrics = async (req, res, next) => {
    try {
        const metrics = await taskService.getTaskMetrics(req.user);
        return sendSuccess(res, metrics);
    }
    catch (error) {
        next(error);
    }
};
export const getMyTasks = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const filters = {
            status: req.query.status,
            priority: req.query.priority,
            search: req.query.search,
            isOwner: req.query.isOwner, // true/false string
            sort: req.query.sort
        };
        const result = await taskService.fetchMyTasks(req.user, filters, page, limit);
        return sendSuccess(res, result);
    }
    catch (error) {
        next(error);
    }
};
export const getMyMetrics = async (req, res, next) => {
    try {
        const metrics = await taskService.fetchMyTaskMetrics(req.user);
        return sendSuccess(res, metrics);
    }
    catch (error) {
        next(error);
    }
};
export const getTask = async (req, res, next) => {
    try {
        const task = await taskService.getTaskById(req.params.id, req.user);
        if (!task) {
            return sendError(res, 'TASK_NOT_FOUND', 'المهمة غير موجودة', 404);
        }
        return sendSuccess(res, task);
    }
    catch (error) {
        next(error);
    }
};
export const createTask = async (req, res, next) => {
    try {
        const data = createTaskSchema.parse(req.body);
        const task = await taskService.createTask(data, req.user);
        return sendSuccess(res, task, 'تم إنشاء المهمة بنجاح', 201);
    }
    catch (error) {
        next(error);
    }
};
export const updateTask = async (req, res, next) => {
    try {
        // We could add schema validation here (e.g., updateTaskSchema.parse)
        const task = await taskService.updateTask(req.params.id, req.body, req.user);
        return sendSuccess(res, task, 'تم تعديل المهمة بنجاح');
    }
    catch (error) {
        next(error);
    }
};
export const deleteTask = async (req, res, next) => {
    try {
        await taskService.deleteTask(req.params.id, req.user);
        return sendSuccess(res, null, 'تم مسح المهمة نهائياً');
    }
    catch (error) {
        next(error);
    }
};
export const startTask = async (req, res, next) => {
    try {
        const task = await taskService.startTask(req.params.id, req.user);
        return sendSuccess(res, task, 'تم البدء في التنفيذ');
    }
    catch (error) {
        if (error.code === 'CONFLICT')
            return sendError(res, error.code, error.message, 409);
        next(error);
    }
};
export const blockTask = async (req, res, next) => {
    try {
        const data = blockTaskSchema.parse(req.body);
        const task = await taskService.blockTask(req.params.id, data.reason, req.user);
        return sendSuccess(res, task, 'تم إيقاف المهمة');
    }
    catch (error) {
        if (error.code === 'CONFLICT')
            return sendError(res, error.code, error.message, 409);
        next(error);
    }
};
export const unblockTask = async (req, res, next) => {
    try {
        const task = await taskService.unblockTask(req.params.id, req.user);
        return sendSuccess(res, task, 'تم استئناف المهمة');
    }
    catch (error) {
        if (error.code === 'CONFLICT')
            return sendError(res, error.code, error.message, 409);
        next(error);
    }
};
export const submitForReview = async (req, res, next) => {
    try {
        const task = await taskService.submitForReview(req.params.id, req.user);
        return sendSuccess(res, task, 'تم إرسال المهمة للمراجعة');
    }
    catch (error) {
        if (error.code === 'CONFLICT')
            return sendError(res, error.code, error.message, 409);
        next(error);
    }
};
export const reviewTask = async (req, res, next) => {
    try {
        const data = reviewTaskSchema.parse(req.body);
        const task = await taskService.reviewTask(req.params.id, data.approved, data.feedback, req.user);
        return sendSuccess(res, task, data.approved ? 'تمت الموافقة وإنجاز المهمة' : 'تم رفض المهمة وإعادتها للتنفيذ');
    }
    catch (error) {
        if (error.code === 'CONFLICT')
            return sendError(res, error.code, error.message, 409);
        next(error);
    }
};
export const addUpdate = async (req, res, next) => {
    try {
        const data = addUpdateSchema.parse(req.body);
        const task = await taskService.addOperationalUpdate(req.params.id, data, req.user);
        return sendSuccess(res, task, 'تم إضافة التحديث بنجاح');
    }
    catch (error) {
        if (error.code === 'CONFLICT')
            return sendError(res, error.code, error.message, 409);
        next(error);
    }
};
export const addComment = async (req, res, next) => {
    try {
        const data = addCommentSchema.parse(req.body);
        const comment = await taskService.addComment(req.params.id, data.message, req.user);
        return sendSuccess(res, comment, 'تم إضافة التعليق بنجاح');
    }
    catch (error) {
        next(error);
    }
};
export const getTimeline = async (req, res, next) => {
    try {
        const limit = parseInt(req.query.limit) || 20;
        const cursor = req.query.cursor;
        const result = await timelineService.getTaskTimeline(req.params.id, limit, cursor, req.user);
        return sendSuccess(res, result);
    }
    catch (error) {
        next(error);
    }
};
//# sourceMappingURL=taskController.js.map