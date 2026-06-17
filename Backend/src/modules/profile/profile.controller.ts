
import type { RequestHandler } from 'express';
import { z } from 'zod';

import { fetchProfile, updateProfile, changePassword } from './profile.service';

const updateProfileSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(4).max(32).optional().nullable(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6),
});

const toIso = (value: Date | string | null | undefined): string | null => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

const mapProfileResponse = (profile: Awaited<ReturnType<typeof fetchProfile>>) => {
  if (!profile) {
    return null;
  }
  const primaryRole = profile.roles[0] ?? profile.role ?? 'employee';
  return {
    // App_Users fields
    id: profile.id,
    name: profile.name,
    email: profile.email,
    username: profile.username ?? null,
    role: primaryRole.toLowerCase(),
    roles: profile.roles,
    employee_id: profile.employeeId ?? null,
    created_at: toIso(profile.createdAt ?? null),
    updated_at: toIso(profile.updatedAt ?? null),
    last_login: toIso(profile.lastLogin ?? null),
    login_count: profile.loginCount ?? 0,
    is_active: profile.isActive,
    
    // Excel columns from App_Users (A-I)
    app_users_national_id: profile.app_users_national_id ?? null,
    app_users_employee_number: profile.app_users_employee_number ?? null,
    app_users_nationality: profile.app_users_nationality ?? null,
    app_users_department_name: profile.app_users_department_name ?? null,
    app_users_job_title: profile.app_users_job_title ?? null,
    app_users_phone: profile.app_users_phone ?? null,
    app_users_employment_type: profile.app_users_employment_type ?? null,
    
    // Employee personal information
    employee_number: profile.employeeNumber ?? null,
    full_name: profile.fullNameAr ?? profile.name,
    full_name_ar: profile.full_name_ar ?? profile.fullNameAr ?? null,
    full_name_en: profile.full_name_en ?? profile.fullNameEn ?? null,
    first_name: profile.first_name ?? profile.firstName ?? null,
    middle_name: profile.middle_name ?? profile.middleName ?? null,
    last_name: profile.last_name ?? profile.lastName ?? null,
    first_name_ar: profile.first_name_ar ?? null,
    second_name_ar: profile.second_name_ar ?? null,
    third_name_ar: profile.third_name_ar ?? null,
    family_name_ar: profile.family_name_ar ?? null,
    
    // Employee identification
    national_id: profile.national_id ?? profile.nationalId ?? null,
    identity_type: profile.identity_type ?? profile.identityType ?? null,
    nationality: profile.nationality ?? null,
    gender: profile.gender ?? null,
    birth_date: toIso(profile.birth_date ?? profile.birthDate ?? null),
    age: profile.age ?? null,
    
    // Employee contact
    phone: profile.phone ?? null,
    phone_primary: profile.phone_primary ?? profile.phone ?? null,
    phone_secondary: profile.phone_secondary ?? profile.phoneSecondary ?? null,
    email_work: profile.email_work ?? profile.emailWork ?? null,
    
    // Employee job information
    department_id: profile.department_id ?? profile.departmentId ?? null,
    department_name: profile.department_name ?? profile.departmentName ?? null,
    department_name_en: profile.department_name_en ?? profile.departmentNameEn ?? null,
    department_code: profile.department_code ?? profile.departmentCode ?? null,
    department_category: profile.department_category ?? profile.departmentCategory ?? null,
    position: profile.position ?? null,
    staff_positioning: profile.staff_positioning ?? profile.staffPositioning ?? null,
    job_title: profile.job_title ?? profile.jobTitle ?? null,
    job_title_id: profile.job_title_id ?? profile.jobTitleId ?? null,
    job_title_name_ar: profile.job_title_name_ar ?? profile.jobTitleNameAr ?? null,
    job_title_name_en: profile.job_title_name_en ?? profile.jobTitleNameEn ?? null,
    job_category: profile.job_category ?? profile.jobCategory ?? null,
    hire_date: toIso(profile.hire_date ?? profile.hireDate ?? null),
    contract_type: profile.contract_type ?? profile.contractType ?? null,
    employment_status: profile.employment_status ?? profile.employmentStatus ?? null,
    contract_start_date: toIso(profile.contract_start_date ?? profile.contractStartDate ?? null),
    job_category_detail: profile.job_category_detail ?? profile.jobCategoryDetail ?? null,
    worker_type: profile.worker_type ?? profile.workerType ?? null,
    worker_classification: profile.worker_classification ?? profile.workerClassification ?? null,
    manager_name: profile.manager_name ?? profile.managerName ?? null,
    manager_organization: profile.manager_organization ?? profile.managerOrganization ?? null,
    manager_national_id: profile.manager_national_id ?? profile.managerNationalId ?? null,
    manager_email: profile.manager_email ?? profile.managerEmail ?? null,
    manager_phone: profile.manager_phone ?? profile.managerPhone ?? null,
    employee_employee_id: profile.employee_employee_id ?? null,
    employee_created_at: toIso(profile.employee_created_at ?? null),
    employee_updated_at: toIso(profile.employee_updated_at ?? null),
  };
};

export const getProfileController: RequestHandler = async (req, res, next) => {
  try {
    const profile = await fetchProfile(req.auth!.sub);
    if (!profile) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(mapProfileResponse(profile));
  } catch (error) {
    next(error);
  }
};

export const updateProfileController: RequestHandler = async (req, res, next) => {
  try {
    const input = updateProfileSchema.parse(req.body);
    const profile = await updateProfile(req.auth!.sub, input);
    res.json(mapProfileResponse(profile));
  } catch (error) {
    next(error);
  }
};

export const changePasswordController: RequestHandler = async (req, res, next) => {
  try {
    const input = changePasswordSchema.parse(req.body);
    await changePassword(req.auth!.sub, input);
    res.json({ message: 'تم تحديث كلمة المرور' });
  } catch (error) {
    next(error);
  }
};
