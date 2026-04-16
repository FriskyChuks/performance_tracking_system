# accounts/views.py
from rest_framework import status, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from rest_framework.response import Response
from django.contrib.auth.models import Group
from django.utils import timezone
from main.models import Department, Agency
from .models import User, ActivityLog
from .serializers import (
    UserSerializer, UserCreateSerializer, UserUpdateSerializer, 
    UserListSerializer, GroupSerializer, ActivityLogSerializer
)
from .middleware import log_activity

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me(request):
    """Get current authenticated user with full details"""
    serializer = UserSerializer(request.user)
    return Response(serializer.data)

@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def update_profile(request):
    """Update current user profile"""
    serializer = UserSerializer(request.user, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        log_activity(request.user, 'update_profile', 'Updated profile information', request)
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# accounts/views.py

@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    """Register a new user (defaults to public user)"""
    try:
        email = request.data.get('email')
        password = request.data.get('password')
        first_name = request.data.get('first_name', '')
        last_name = request.data.get('last_name', '')
        location = request.data.get('location', '')
        department_id = request.data.get('department_id')
        agency_id = request.data.get('agency_id')
        
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
            location=location,
            is_public_only=True,
            can_access_dashboard=False,
            is_staff=False
        )
        
        # Assign department or agency if provided
        if department_id:
            try:
                from main.models import Department
                user.assigned_department = Department.objects.get(id=department_id)
                user.save()
            except:
                pass
        elif agency_id:
            try:
                from main.models import Agency
                user.assigned_agency = Agency.objects.get(id=agency_id)
                user.save()
            except:
                pass
        
        serializer = UserSerializer(user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    """Change user password"""
    user = request.user
    current_password = request.data.get('current_password')
    new_password = request.data.get('new_password')
    
    if not current_password or not new_password:
        return Response({'error': 'Current password and new password are required'}, status=400)
    
    if not user.check_password(current_password):
        return Response({'error': 'Current password is incorrect'}, status=400)
    
    if len(new_password) < 6:
        return Response({'error': 'Password must be at least 6 characters'}, status=400)
    
    user.set_password(new_password)
    user.save()
    
    log_activity(user, 'change_password', 'Changed account password', request)
    return Response({'message': 'Password changed successfully'})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_status(request):
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
        'assigned_entity': user.assigned_entity
    })

# ==================== Admin User Management Views ====================

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def get_all_users(request):
    """Get all users for admin management"""
    users = User.objects.all().select_related('assigned_department', 'assigned_agency')
    serializer = UserListSerializer(users, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def get_pending_users(request):
    """Get users pending dashboard access"""
    users = User.objects.filter(is_public_only=True, is_staff=False)
    serializer = UserListSerializer(users, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def get_user_detail(request, user_id):
    """Get detailed user information"""
    try:
        user = User.objects.get(id=user_id)
        serializer = UserSerializer(user)
        return Response(serializer.data)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=404)

@api_view(['PUT'])
@permission_classes([IsAuthenticated, IsAdminUser])
def upgrade_user(request, user_id):
    """Upgrade a public user to dashboard user with role assignment"""
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=404)
    
    data = request.data
    group_id = data.get('group_id')
    department_id = data.get('department_id')
    agency_id = data.get('agency_id')
    
    # Update user fields
    user.is_public_only = False
    user.can_access_dashboard = True
    user.is_staff = True
    user.upgraded_by = request.user
    user.upgraded_at = timezone.now()
    
    # Assign department or agency
    if department_id:
        try:
            user.assigned_department = Department.objects.get(id=department_id)
            user.assigned_agency = None
        except Department.DoesNotExist:
            pass
    elif agency_id:
        try:
            user.assigned_agency = Agency.objects.get(id=agency_id)
            user.assigned_department = None
        except Agency.DoesNotExist:
            pass
    
    user.save()
    
    # Assign group
    if group_id:
        try:
            group = Group.objects.get(id=group_id)
            user.groups.add(group)
        except Group.DoesNotExist:
            pass
    
    log_activity(request.user, 'user_upgraded', f'Upgraded user {user.email} to dashboard access', request)
    
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
        
        user.groups.clear()
        user.groups.add(group)
        
        if group.name != 'Viewer':
            user.is_staff = True
            user.can_access_dashboard = True
            user.is_public_only = False
        else:
            user.is_staff = False
            user.can_access_dashboard = True
            user.is_public_only = False
        
        user.save()
        
        log_activity(request.user, 'role_assigned', f'Assigned {user.email} to {group.name} group', request)
        
        return Response({'message': f'User assigned to {group.name} group'})
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=404)
    except Group.DoesNotExist:
        return Response({'error': 'Group not found'}, status=404)

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def get_available_groups(request):
    """Get all available groups for assignment"""
    groups = Group.objects.exclude(name='Super Admin')
    return Response([{'id': g.id, 'name': g.name} for g in groups])

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
@permission_classes([IsAuthenticated, IsAdminUser])
def get_all_activities(request):
    """Get all activities (admin only)"""
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
def log_custom_activity(request):
    """Log a custom activity"""
    action = request.data.get('action')
    description = request.data.get('description')
    
    if not action or not description:
        return Response({'error': 'Action and description are required'}, status=400)
    
    log_activity(request.user, action, description, request)
    return Response({'message': 'Activity logged successfully'})