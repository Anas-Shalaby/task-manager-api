import type { Request, Response } from 'express';
import * as teamService from '../services/teamService.js';

export const getTeams = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string;

    const result = await teamService.getTeams({ search }, page, limit, (req as any).user);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(error.code === 'FORBIDDEN' ? 403 : 500).json({ success: false, error: { message: error.message } });
  }
};

export const getTeamById = async (req: Request, res: Response) => {
  try {
    const team = await teamService.getTeamById(req.params.id as string, (req as any).user);
    if (!team) {
      return res.status(404).json({ success: false, error: { message: 'الفريق غير موجود' } });
    }
    res.json({ success: true, data: team });
  } catch (error: any) {
    res.status(error.code === 'FORBIDDEN' ? 403 : 500).json({ success: false, error: { message: error.message } });
  }
};

export const createTeam = async (req: Request, res: Response) => {
  try {
    const team = await teamService.createTeam(req.body, (req as any).user);
    res.status(201).json({ success: true, data: team });
  } catch (error: any) {
    res.status(error.code === 'FORBIDDEN' ? 403 : 400).json({ success: false, error: { message: error.message } });
  }
};

export const updateTeam = async (req: Request, res: Response) => {
  try {
    const team = await teamService.updateTeam(req.params.id as string, req.body, (req as any).user);
    res.json({ success: true, data: team });
  } catch (error: any) {
    res.status(error.code === 'FORBIDDEN' ? 403 : 400).json({ success: false, error: { message: error.message } });
  }
};

export const deleteTeam = async (req: Request, res: Response) => {
  try {
    const result = await teamService.deleteTeam(req.params.id as string, (req as any).user);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(error.code === 'FORBIDDEN' ? 403 : (error.code === 'NOT_FOUND' ? 404 : 500)).json({ success: false, error: { message: error.message } });
  }
};
