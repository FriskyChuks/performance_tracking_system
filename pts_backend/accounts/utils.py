# accounts/utils.py
from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType
from django.contrib.auth.models import Group

def create_default_groups():
    """Create default user groups with permissions"""
    
    # 1. Super Admin Group
    super_admin_group, created = Group.objects.get_or_create(name='Super Admin')
    if created:
        all_permissions = Permission.objects.all()
        super_admin_group.permissions.set(all_permissions)
    
    # 2. Director Group
    director_group, created = Group.objects.get_or_create(name='Director')
    if created:
        permissions = Permission.objects.filter(
            codename__in=[
                'view_dashboard', 'manage_departments', 'manage_agencies',
                'manage_priority_areas', 'manage_deliverables', 'manage_all_initiatives',
                'view_all_reports', 'export_data', 'moderate_comments', 'view_analytics',
                'manage_users', 'manage_roles'
            ]
        )
        director_group.permissions.set(permissions)
    
    # 3. Staff Group
    staff_group, created = Group.objects.get_or_create(name='Staff')
    if created:
        permissions = Permission.objects.filter(
            codename__in=[
                'view_dashboard', 'manage_all_initiatives', 'view_all_reports',
                'export_data', 'moderate_comments'
            ]
        )
        staff_group.permissions.set(permissions)
    
    # 4. Project Admin Group
    project_admin_group, created = Group.objects.get_or_create(name='Project Admin')
    if created:
        permissions = Permission.objects.filter(
            codename__in=[
                'view_dashboard', 'manage_departments', 'manage_agencies',
                'manage_priority_areas', 'manage_deliverables', 'manage_all_initiatives',
                'view_all_reports', 'export_data'
            ]
        )
        project_admin_group.permissions.set(permissions)
    
    # 5. Sector Expert Group
    sector_expert_group, created = Group.objects.get_or_create(name='Sector Expert')
    if created:
        permissions = Permission.objects.filter(
            codename__in=[
                'view_dashboard', 'view_all_reports', 'view_analytics',
            ]
        )
        sector_expert_group.permissions.set(permissions)
    
    # 6. Data Analyst Group
    data_analyst_group, created = Group.objects.get_or_create(name='Data Analyst')
    if created:
        permissions = Permission.objects.filter(
            codename__in=[
                'view_dashboard', 'view_all_reports', 'export_data', 'view_analytics'
            ]
        )
        data_analyst_group.permissions.set(permissions)
    
    # 7. Engagement Moderator Group
    moderator_group, created = Group.objects.get_or_create(name='Engagement Moderator')
    if created:
        permissions = Permission.objects.filter(
            codename__in=[
                'moderate_comments', 'delete_any_comment', 'pin_comments',
                'view_analytics', 'manage_public_users'
            ]
        )
        moderator_group.permissions.set(permissions)
    
    # 8. Viewer Group
    viewer_group, created = Group.objects.get_or_create(name='Viewer')
    if created:
        permissions = Permission.objects.filter(
            codename__in=['view_dashboard', 'view_all_reports']
        )
        viewer_group.permissions.set(permissions)
    
    print("Default groups created successfully!")
    return {
        'super_admin': super_admin_group,
        'director': director_group,
        'staff': staff_group,
        'project_admin': project_admin_group,
        'sector_expert': sector_expert_group,
        'data_analyst': data_analyst_group,
        'moderator': moderator_group,
        'viewer': viewer_group,
    }

def get_user_role(user):
    """Get user's primary role based on groups"""
    if not user.is_authenticated:
        return 'anonymous'
    
    if user.is_superuser:
        return 'super_admin'
    
    # Order matters - check most specific first
    # Check for exact group names as they appear in your system
    if user.groups.filter(name='Sector Expert').exists():
        return 'sector_expert'
    elif user.groups.filter(name='Director').exists():
        return 'director'
    elif user.groups.filter(name='Staff').exists():
        return 'staff'
    elif user.groups.filter(name='Project Admin').exists():
        return 'project_admin'
    
    return 'public'

def user_has_role(user, role_name):
    """Check if user has a specific role"""
    # Map frontend role names to actual group names
    role_mapping = {
        'sector_expert': 'Sector Expert',
        'project_admin': 'Project Admin',
        'staff': 'Staff',
        'director': 'Director',
        'super_admin': 'Super Admin',
    }
    
    actual_role_name = role_mapping.get(role_name, role_name)
    return user.groups.filter(name=actual_role_name).exists()

def get_user_permissions(user):
    """Get user's permissions based on role"""
    role = get_user_role(user)
    
    permissions = {
        'can_create_initiative': False,
        'can_edit_initiative': False,
        'can_update_actual': False,
        'can_upload_images': False,
        'can_approve': False,
        'can_assess': False,
        'can_view_all': False,
    }
    
    if role == 'project_admin':
        permissions['can_create_initiative'] = True
        permissions['can_edit_initiative'] = True
    
    elif role == 'staff':
        permissions['can_edit_initiative'] = True
        permissions['can_update_actual'] = True
        permissions['can_upload_images'] = True
    
    elif role == 'director':
        permissions['can_approve'] = True
        permissions['can_view_all'] = True
    
    elif role == 'sector_expert':
        permissions['can_assess'] = True
        permissions['can_view_all'] = True
    
    elif role == 'super_admin':
        permissions['can_create_initiative'] = True
        permissions['can_edit_initiative'] = True
        permissions['can_update_actual'] = True
        permissions['can_upload_images'] = True
        permissions['can_approve'] = True
        permissions['can_assess'] = True
        permissions['can_view_all'] = True
    
    return permissions

def get_user_role_name(user):
    """Get the actual group name for display"""
    if user.is_superuser:
        return 'Super Admin'
    
    if user.groups.filter(name='Sector Expert').exists():
        return 'Sector Expert'
    elif user.groups.filter(name='Director').exists():
        return 'Director'
    elif user.groups.filter(name='Staff').exists():
        return 'Staff'
    elif user.groups.filter(name='Project Admin').exists():
        return 'Project Admin'
    
    return 'Public User'