# accounts/permissions.py
from rest_framework import permissions

class IsSuperAdmin(permissions.BasePermission):
    """Technical super admin (software owner) — full bypass"""
    def has_permission(self, request, view):
        return request.user.is_authenticated and (
            request.user.is_superuser or request.user.role == 'super_admin'
        )

class IsProjectAdmin(permissions.BasePermission):
    """Permission for Project Admins"""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'project_admin'
    
    def has_object_permission(self, request, view, obj):
        return request.user.is_authenticated and request.user.role == 'project_admin'

class IsAdminUser(permissions.BasePermission):
    """Ministry admin (project_admin) OR technical super admin OR Django superuser"""
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return (
            request.user.is_superuser
            or request.user.role in ('super_admin', 'project_admin')
        )

class IsDeliveryOfficer(permissions.BasePermission):
    """Permission for Delivery Officers"""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'delivery_officer'
    
    def has_object_permission(self, request, view, obj):
        return request.user.is_authenticated and request.user.role == 'delivery_officer'

class IsDirector(permissions.BasePermission):
    """Permission for Directors"""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'director'
    
    def has_object_permission(self, request, view, obj):
        return request.user.is_authenticated and request.user.role == 'director'

class IsSectorExpert(permissions.BasePermission):
    """Permission for Sector Experts"""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'sector_expert'
    
    def has_object_permission(self, request, view, obj):
        return request.user.is_authenticated and request.user.role == 'sector_expert'

class IsStaffOrReadOnly(permissions.BasePermission):
    """Staff can edit, others can only read"""
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.is_authenticated and (
            request.user.role == 'project_admin' or 
            request.user.is_superuser
        )

class IsReadOnly(permissions.BasePermission):
    """Allow read-only access to all authenticated users"""
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user.is_authenticated
        return False