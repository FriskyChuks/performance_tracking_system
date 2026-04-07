# accounts/utils.py
from .models import ActivityLog
from .middleware import ActivityLogMiddleware
from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType
from .models import User

def log_activity(user, action, description, request=None):
    """Log user activity"""
    ActivityLogMiddleware.log_activity(user, action, description, request)

def get_user_activities(user, limit=50):
    """Get user's recent activities"""
    return ActivityLog.objects.filter(user=user)[:limit]

def get_all_activities(limit=100):
    """Get all recent activities"""
    return ActivityLog.objects.all()[:limit]


def create_default_groups():
    """Create default user groups with permissions"""
    
    # 1. Super Admin Group
    super_admin_group, created = Group.objects.get_or_create(name='Super Admin')
    if created:
        # Give all permissions
        all_permissions = Permission.objects.all()
        super_admin_group.permissions.set(all_permissions)
    
    # 2. Project Manager Group
    project_manager_group, created = Group.objects.get_or_create(name='Project Manager')
    if created:
        permissions = Permission.objects.filter(
            codename__in=[
                'view_dashboard',
                'manage_ministries',
                'manage_priority_areas',
                'manage_deliverables',
                'manage_all_projects',
                'view_all_reports',
                'export_data',
                'moderate_comments',
                'view_analytics',
            ]
        )
        project_manager_group.permissions.set(permissions)
    
    # 3. Ministry Officer Group
    ministry_officer_group, created = Group.objects.get_or_create(name='Ministry Officer')
    if created:
        permissions = Permission.objects.filter(
            codename__in=[
                'view_dashboard',
                'manage_priority_areas',
                'manage_deliverables',
                'manage_all_projects',
                'view_all_reports',
            ]
        )
        ministry_officer_group.permissions.set(permissions)
    
    # 4. Data Analyst Group
    data_analyst_group, created = Group.objects.get_or_create(name='Data Analyst')
    if created:
        permissions = Permission.objects.filter(
            codename__in=[
                'view_dashboard',
                'view_all_reports',
                'export_data',
                'view_analytics',
            ]
        )
        data_analyst_group.permissions.set(permissions)
    
    # 5. Public Engagement Moderator Group
    moderator_group, created = Group.objects.get_or_create(name='Engagement Moderator')
    if created:
        permissions = Permission.objects.filter(
            codename__in=[
                'moderate_comments',
                'delete_any_comment',
                'pin_comments',
                'view_analytics',
                'manage_public_users',
            ]
        )
        moderator_group.permissions.set(permissions)
    
    # 6. Viewer (Read-only) Group
    viewer_group, created = Group.objects.get_or_create(name='Viewer')
    if created:
        permissions = Permission.objects.filter(
            codename__in=[
                'view_dashboard',
                'view_all_reports',
            ]
        )
        viewer_group.permissions.set(permissions)
    
    print("Default groups created successfully!")
    return {
        'super_admin': super_admin_group,
        'project_manager': project_manager_group,
        'ministry_officer': ministry_officer_group,
        'data_analyst': data_analyst_group,
        'moderator': moderator_group,
        'viewer': viewer_group,
    }

def get_user_group_info(user):
    """Get user's group information"""
    groups = user.groups.all()
    return {
        'groups': [{'id': g.id, 'name': g.name} for g in groups],
        'permissions': list(user.get_all_permissions()),
        'is_superuser': user.is_superuser,
        'is_staff': user.is_staff,
    }