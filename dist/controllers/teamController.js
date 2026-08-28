import * as teamService from '../services/teamService.js';
export const getTeams = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const search = req.query.search;
        const result = await teamService.getTeams({ search }, page, limit, req.user);
        res.json({ success: true, data: result });
    }
    catch (error) {
        res.status(error.code === 'FORBIDDEN' ? 403 : 500).json({ success: false, error: { message: error.message } });
    }
};
export const getTeamById = async (req, res) => {
    try {
        const team = await teamService.getTeamById(req.params.id, req.user);
        if (!team) {
            return res.status(404).json({ success: false, error: { message: 'الفريق غير موجود' } });
        }
        res.json({ success: true, data: team });
    }
    catch (error) {
        res.status(error.code === 'FORBIDDEN' ? 403 : 500).json({ success: false, error: { message: error.message } });
    }
};
export const createTeam = async (req, res) => {
    try {
        const team = await teamService.createTeam(req.body, req.user);
        res.status(201).json({ success: true, data: team });
    }
    catch (error) {
        res.status(error.code === 'FORBIDDEN' ? 403 : 400).json({ success: false, error: { message: error.message } });
    }
};
export const updateTeam = async (req, res) => {
    try {
        const team = await teamService.updateTeam(req.params.id, req.body, req.user);
        res.json({ success: true, data: team });
    }
    catch (error) {
        res.status(error.code === 'FORBIDDEN' ? 403 : 400).json({ success: false, error: { message: error.message } });
    }
};
export const deleteTeam = async (req, res) => {
    try {
        const result = await teamService.deleteTeam(req.params.id, req.user);
        res.json({ success: true, data: result });
    }
    catch (error) {
        res.status(error.code === 'FORBIDDEN' ? 403 : (error.code === 'NOT_FOUND' ? 404 : 500)).json({ success: false, error: { message: error.message } });
    }
};
//# sourceMappingURL=teamController.js.map