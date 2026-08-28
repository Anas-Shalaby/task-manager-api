import type { Response, NextFunction } from 'express';
import type { AuthRequest } from '../middleware/auth.js';
import * as userService from '../services/userService.js';
import { sendSuccess } from '../utils/response.js';
import { createUserSchema, updateUserSchema } from '../validators/userValidator.js';

export const getUsers = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string;
    const teamId = req.query.teamId as string;

    const result = await userService.getUsers({ search, teamId }, page, limit, req.user);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(error.code === 'FORBIDDEN' ? 403 : 500).json({ success: false, error: { message: error.message } });
  }
};

export const getUserById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await userService.getUserById(req.params.id as string, req.user);
    res.json({ success: true, data: user });
  } catch (error: any) {
    res.status(error.code === 'FORBIDDEN' ? 403 : (error.code === 'NOT_FOUND' ? 404 : 500)).json({ success: false, error: { message: error.message } });
  }
};

export const createUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const validatedData = createUserSchema.parse(req.body);
    const user = await userService.createUser(validatedData, req.user);
    res.status(201).json({ success: true, data: user });
  } catch (error: any) {
    res.status(error.code === 'FORBIDDEN' ? 403 : 400).json({ success: false, error: { message: error.message } });
  }
};

export const updateUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const validatedData = updateUserSchema.parse(req.body);
    const user = await userService.updateUser(req.params.id as string, validatedData, req.user);
    res.json({ success: true, data: user });
  } catch (error: any) {
    res.status(error.code === 'FORBIDDEN' ? 403 : 400).json({ success: false, error: { message: error.message } });
  }
};

export const deleteUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await userService.deleteUser(req.params.id as string, req.user);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(error.code === 'FORBIDDEN' ? 403 : (error.code === 'CONFLICT' ? 409 : 500)).json({ success: false, error: { message: error.message } });
  }
};

export const getAssignableUsers = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const teamId = req.query.teamId as string;
    const users = await userService.getAssignableUsers(req.user, teamId);
    return sendSuccess(res, users);
  } catch (error: any) {
    res.status(error.code === 'FORBIDDEN' ? 403 : 500).json({ success: false, error: { message: error.message } });
  }
};
