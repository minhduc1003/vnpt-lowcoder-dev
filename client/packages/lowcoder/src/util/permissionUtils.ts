import { ADMIN_ROLE, SUPER_ADMIN_ROLE} from "constants/orgConstants";
import { ApplicationMeta } from "constants/applicationConstants";
import { User } from "constants/userConstants";


export function currentOrgAdmin(user: User) { 
  const role = user.orgRoleMap.get(user.currentOrgId); 
  return role === ADMIN_ROLE || role === SUPER_ADMIN_ROLE;
}

export function currentOrgAdminOrDev(user: User) {
  return user.orgDev || currentOrgAdmin(user);
}

export function isGroupAdmin(userGroupRole: string | undefined) {
  return userGroupRole === ADMIN_ROLE || userGroupRole === SUPER_ADMIN_ROLE;
}

export function canManageApp(user: User, application?: ApplicationMeta) {
  if (!application) {
    return false;
  }

  const orgRole = user.orgRoleMap.get(application.orgId);
  return application?.role === "owner" || orgRole === "admin";
}

export function canEditApp(user: User, application?: ApplicationMeta) {
  if (!application) {
    return false;
  }

  const orgRole = user.orgRoleMap.get(application.orgId);
  const appRole = application?.role;
  return appRole === "owner" || appRole === "editor" || orgRole === "admin";
}
