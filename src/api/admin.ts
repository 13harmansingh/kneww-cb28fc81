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
