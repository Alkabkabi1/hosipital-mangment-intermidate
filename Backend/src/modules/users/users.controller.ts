import type { RequestHandler } from 'express';

import { getUserProfile, listUsers, getUserByEmail, getDepartmentsList, getJobTitlesList } from './users.service';
import { getUserPermissionsDetailed } from '../permissions/permission.service';
import { AppError } from '../../core/errors';
import { sendSuccess } from '../../shared/utils/response';

export const listUsersController: RequestHandler = async (_req, res, next) => {
  try {
    const users = await listUsers();
    res.json(users);
  } catch (error) {
    next(error);
  }
};

export const getProfileController: RequestHandler = async (req, res, next) => {
  try {
    if (!req.auth) {
      throw new AppError({ statusCode: 401, message: 'Authentication required', code: 'UNAUTHORIZED' });
    }
    const profile = await getUserProfile(req.auth.sub);
    if (!profile) {
      throw new AppError({ statusCode: 404, message: 'User not found', code: 'NOT_FOUND' });
    }
    res.json(profile);
  } catch (error) {
    next(error);
  }
};

export const getCurrentUserPermissionsController: RequestHandler = async (req, res, next) => {
  try {
    if (!req.auth) {
      throw new AppError({ statusCode: 401, message: 'Authentication required', code: 'UNAUTHORIZED' });
    }
    const data = await getUserPermissionsDetailed(req.auth.sub);
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

export const getUserByEmailController: RequestHandler = async (req, res, next) => {
  try {
    const email = req.params.email;
    if (!email) {
      throw new AppError({ statusCode: 400, message: 'Email required', code: 'BAD_REQUEST' });
    }

    const user = await getUserByEmail(email);
    if (!user) {
      throw new AppError({ statusCode: 404, message: 'User not found', code: 'NOT_FOUND' });
    }

    sendSuccess(res, user);
  } catch (error) {
    next(error);
  }
};

/**
 * Get list of departments from App_Users table
 * Accessible to all authenticated users (not just admins)
 * Uses department_name column from App_Users
 */
export const getDepartmentsController: RequestHandler = async (_req, res, next) => {
  try {
    const departments = await getDepartmentsList();
    sendSuccess(res, departments);
  } catch (error) {
    next(error);
  }
};

/**
 * Get list of job titles from App_Users table
 * Accessible to all authenticated users (not just admins)
 * Uses job_title column from App_Users
 */
export const getJobTitlesController: RequestHandler = async (_req, res, next) => {
  try {
    const jobTitles = await getJobTitlesList();
    sendSuccess(res, jobTitles);
  } catch (error) {
    next(error);
  }
};
