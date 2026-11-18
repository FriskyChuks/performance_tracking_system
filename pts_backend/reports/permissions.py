from rest_framework import permissions

STAFF_ROLES = {'super_admin', 'project_admin', 'director', 'delivery_officer'}

class CanViewReports(permissions.BasePermission):
    """Any dashboard staff role can view reports. Scope enforced in views."""
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return (
            request.user.is_superuser
            or getattr(request.user, 'role', None) in STAFF_ROLES
        )

class CanViewExpertReports(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return (
            request.user.is_superuser
            or getattr(request.user, 'role', None) in {'super_admin', 'project_admin', 'sector_expert', 'director'}
        )