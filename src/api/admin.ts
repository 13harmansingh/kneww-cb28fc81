/**
 * Admin-related API calls
 */

import { invokeEdgeFunction } from './client';
import { EDGE_FUNCTIONS } from '@/config/constants';
import { ApiRequestOptions } from '@/config/types';

interface AdminUser {
  id: string;
  email: string;
  display_name: string | null;
  role: 'admin' | 'user' | 'editor';
  banned: boolean;
  created_at: string;
}

interface AdminUsersResponse {
  users: AdminUser[];
}

export async function getAdminUsers(
  options: ApiRequestOptions = {}
) {
  return invokeEdgeFunction<AdminUsersResponse>({
    functionName: EDGE_FUNCTIONS.ADMIN_GET_USERS,
    body: {},
    ...options,
  });
}

interface AccessRequest {
  id: string;
  full_name: string;
  email: string;
  reason: string | null;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}

interface AccessRequestsResponse {
  requests: AccessRequest[];
}

export async function getAccessRequests(
  options: ApiRequestOptions = {}
) {
  return invokeEdgeFunction<AccessRequestsResponse>({
    functionName: EDGE_FUNCTIONS.ADMIN_GET_ACCESS_REQUESTS,
    body: {},
    ...options,
  });
}

interface CreateUserRequest {
  email: string;
  password: string;
  full_name: string;
  role?: 'admin' | 'user' | 'editor';
  request_id?: string;
}

interface CreateUserResponse {
  success: boolean;
  user_id: string;
  email: string;
}

export async function createUser(
  data: CreateUserRequest,
  options: ApiRequestOptions = {}
) {
  return invokeEdgeFunction<CreateUserResponse>({
    functionName: EDGE_FUNCTIONS.ADMIN_CREATE_USER,
    body: data,
    ...options,
  });
}

export async function rejectAccessRequest(
  requestId: string,
  options: ApiRequestOptions = {}
) {
  return invokeEdgeFunction<{ success: boolean }>({
    functionName: EDGE_FUNCTIONS.ADMIN_REJECT_REQUEST,
    body: { request_id: requestId },
    ...options,
  });
}
