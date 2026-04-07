# accounts/views.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import get_user_model, authenticate
from .utils import log_activity
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from django.contrib.auth.models import Group, Permission

from .models import User, ActivityLog
from .serializers import UserSerializer, GroupSerializer,ActivityLogSerializer, UserUpdateSerializer


User = get_user_model()

def get_client_ip(request):
    """Get client IP address from request"""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me(request):
    """Get current authenticated user with full details"""
    serializer = UserSerializer(request.user)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    """Register a new user (defaults to public user)"""
    try:
        email = request.data.get('email')
        password = request.data.get('password')
        first_name = request.data.get('first_name', '')
        last_name = request.data.get('last_name', '')
        
        # Validate
        if not email:
            return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)
        if not password:
            return Response({'error': 'Password is required'}, status=status.HTTP_400_BAD_REQUEST)
        if len(password) < 6:
            return Response({'error': 'Password must be at least 6 characters'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if user already exists
        if User.objects.filter(email=email).exists():
            return Response(
                {'error': 'User with this email already exists'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create user - default to public user (no dashboard access)
        user = User.objects.create_user(
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
            is_public_only=True,  # New users are public only
            can_access_dashboard=False,  # No dashboard access by default
            is_staff=False  # Not staff by default
        )
        
        serializer = UserSerializer(user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )

@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_profile(request):
    """Update user profile"""
    user = request.user
    serializer = UserSerializer(user, data=request.data, partial=True)
    
    if serializer.is_valid():
        serializer.save()
        
        # Log the activity
        ActivityLog.objects.create(
            user=user,
            action='update_profile',
            description='Updated profile information',
            ip_address=get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', '')
        )
        
        return Response(serializer.data)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    """Change user password"""
    user = request.user
    current_password = request.data.get('current_password')
    new_password = request.data.get('new_password')
    
    if not current_password or not new_password:
        return Response(
            {'error': 'Current password and new password are required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Check current password
    if not user.check_password(current_password):
        return Response(
            {'error': 'Current password is incorrect'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Validate new password
    if len(new_password) < 6:
        return Response(
            {'error': 'Password must be at least 6 characters'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Set new password
    user.set_password(new_password)
    user.save()
    
    # Log the activity
    ActivityLog.objects.create(
        user=user,
        action='change_password',
        description='Changed account password',
        ip_address=get_client_ip(request),
        user_agent=request.META.get('HTTP_USER_AGENT', '')
    )
    
    return Response({'message': 'Password changed successfully'})


# Group management views would go here (e.g., assign roles, list groups, etc.)
@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def get_groups(request):
    """Get all groups (admin only)"""
    groups = Group.objects.all().prefetch_related('permissions')
    serializer = GroupSerializer(groups, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminUser])
def create_group(request):
    """Create a new group (admin only)"""
    name = request.data.get('name')
    permissions = request.data.get('permissions', [])
    
    if not name:
        return Response({'error': 'Group name required'}, status=400)
    
    group, created = Group.objects.get_or_create(name=name)
    
    if permissions:
        perms = Permission.objects.filter(id__in=permissions)
        group.permissions.set(perms)
    
    serializer = GroupSerializer(group)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminUser])
def assign_user_group(request):
    """Assign user to a group"""
    user_id = request.data.get('user_id')
    group_id = request.data.get('group_id')
    
    try:
        user = User.objects.get(id=user_id)
        group = Group.objects.get(id=group_id)
        user.groups.add(group)
        return Response({'message': f'User added to {group.name} group'})
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=404)
    except Group.DoesNotExist:
        return Response({'error': 'Group not found'}, status=404)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_current_user_permissions(request):
    """Get current user's permissions"""
    user = request.user
    permissions = user.get_all_permissions()
    groups = user.groups.all().values('id', 'name')
    
    return Response({
        'user_id': user.id,
        'email': user.email,
        'is_superuser': user.is_superuser,
        'is_staff': user.is_staff,
        'groups': list(groups),
        'permissions': list(permissions),
        'can_moderate': user.can_moderate_comments,
        'can_manage_projects': user.can_manage_projects,
        'can_view_reports': user.can_view_reports,
    })


# Activity log views
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_activities(request):
    """Get user's activity logs"""
    limit = request.query_params.get('limit', 50)
    try:
        limit = int(limit)
    except ValueError:
        limit = 50
    
    activities = ActivityLog.objects.filter(user=request.user)[:limit]
    serializer = ActivityLogSerializer(activities, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_all_activities(request):
    """Get all activities (admin only)"""
    if not request.user.is_staff:
        return Response(
            {'error': 'Permission denied'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    limit = request.query_params.get('limit', 100)
    try:
        limit = int(limit)
    except ValueError:
        limit = 100
    
    activities = ActivityLog.objects.all()[:limit]
    serializer = ActivityLogSerializer(activities, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def log_activity(request):
    """Log a custom activity"""
    action = request.data.get('action')
    description = request.data.get('description')
    
    if not action or not description:
        return Response(
            {'error': 'Action and description are required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    activity = ActivityLog.objects.create(
        user=request.user,
        action=action,
        description=description,
        ip_address=get_client_ip(request),
        user_agent=request.META.get('HTTP_USER_AGENT', '')
    )
    
    serializer = ActivityLogSerializer(activity)
    return Response(serializer.data, status=status.HTTP_201_CREATED)

@api_view(['GET'])
@permission_classes([AllowAny])
def api_test(request):
    """Test endpoint to verify API is working"""
    return Response({
        'status': 'success',
        'message': 'API is working',
        'endpoints': {
            'login': '/api/accounts/auth/jwt/create/',
            'register': '/api/accounts/register/',
            'me': '/api/accounts/me/',
            'profile': '/api/accounts/profile/',
            'change_password': '/api/accounts/change-password/',
            'activities': '/api/accounts/activities/',
        }
    })


# Admin user management views
@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def get_all_users(request):
    """Get all users for admin management"""
    users = User.objects.all().select_related('assigned_ministry')
    serializer = UserSerializer(users, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def get_pending_users(request):
    """Get users pending dashboard access (public-only users)"""
    users = User.objects.filter(is_public_only=True, is_staff=False)
    serializer = UserSerializer(users, many=True)
    return Response(serializer.data)

@api_view(['PUT'])
@permission_classes([IsAuthenticated, IsAdminUser])
def upgrade_user(request, user_id):
    """Upgrade a public user to dashboard user with role assignment"""
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=404)
    
    data = request.data
    group_name = data.get('group')
    ministry_id = data.get('ministry')
    
    # Update user fields
    user.is_public_only = False
    user.can_access_dashboard = True
    user.is_staff = True  # Give staff access
    user.upgraded_by = request.user
    user.upgraded_at = timezone.now()
    
    # Assign ministry if provided
    if ministry_id:
        from main.models import Ministry
        try:
            user.assigned_ministry = Ministry.objects.get(id=ministry_id)
        except Ministry.DoesNotExist:
            pass
    
    user.save()
    
    # Assign group
    if group_name:
        try:
            group = Group.objects.get(name=group_name)
            user.groups.add(group)
        except Group.DoesNotExist:
            pass
    
    # Grant all permissions for the assigned role
    if group_name == 'Super Admin':
        user.is_superuser = True
        user.save()
    
    serializer = UserSerializer(user)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminUser])
def assign_user_group(request):
    """Assign or update user's group"""
    user_id = request.data.get('user_id')
    group_id = request.data.get('group_id')
    
    try:
        user = User.objects.get(id=user_id)
        group = Group.objects.get(id=group_id)
        
        # Clear existing groups and add new one
        user.groups.clear()
        user.groups.add(group)
        
        # Update staff status based on group
        if group.name != 'Viewer':
            user.is_staff = True
            user.can_access_dashboard = True
            user.is_public_only = False
        else:
            user.is_staff = False
            user.can_access_dashboard = True
            user.is_public_only = False
        
        user.save()
        
        return Response({'message': f'User assigned to {group.name} group'})
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=404)
    except Group.DoesNotExist:
        return Response({'error': 'Group not found'}, status=404)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_current_user_status(request):
    """Get current user's access status and permissions"""
    user = request.user
    serializer = UserSerializer(user)
    
    return Response({
        'user': serializer.data,
        'can_access_dashboard': user.can_access_dashboard or user.is_staff or user.is_superuser,
        'is_public_only': user.is_public_only,
        'is_staff': user.is_staff,
        'is_superuser': user.is_superuser,
        'groups': [{'id': g.id, 'name': g.name} for g in user.groups.all()],
        'group_names': [g.name for g in user.groups.all()],
        'permissions': list(user.get_all_permissions()),
        'assigned_ministry': {
            'id': user.assigned_ministry.id if user.assigned_ministry else None,
            'name': user.assigned_ministry.title if user.assigned_ministry else None
        } if user.assigned_ministry else None
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def get_available_groups(request):
    """Get all available groups for assignment"""
    groups = Group.objects.exclude(name='Super Admin')  # Exclude super admin from regular assignment
    return Response([{'id': g.id, 'name': g.name} for g in groups])

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def get_user_detail(request, user_id):
    """Get detailed user information for admin"""
    try:
        user = User.objects.get(id=user_id)
        serializer = UserSerializer(user)
        return Response(serializer.data)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=404)