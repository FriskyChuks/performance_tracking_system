# accounts/serializers.py
from rest_framework import serializers
from django.contrib.auth.models import Group, Permission
from main.models import Department, Agency
from .models import User, ActivityLog
from .utils import get_user_role, get_user_permissions, get_user_role_name

class GroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = Group
        fields = ['id', 'name']

class PermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Permission
        fields = ['id', 'name', 'codename']

class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    display_name = serializers.SerializerMethodField()
    groups = GroupSerializer(many=True, read_only=True)
    group_names = serializers.SerializerMethodField()
    assigned_entity = serializers.SerializerMethodField()
    role = serializers.SerializerMethodField()
    role_display = serializers.SerializerMethodField()
    permissions = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'full_name', 'display_name',
            'phone', 'location', 'is_staff', 'is_active', 'is_superuser',
            'is_public_only', 'can_access_dashboard', 'is_verified',
            'assigned_department', 'assigned_agency', 'assigned_entity',
            'groups', 'group_names', 'role', 'role_display', 'permissions',
            'comment_count', 'date_joined', 'last_login', 'last_public_activity'
        ]
        read_only_fields = ['id', 'date_joined', 'last_login', 'comment_count']
    
    def get_full_name(self, obj):
        return obj.full_name
    
    def get_display_name(self, obj):
        return obj.display_name
    
    def get_group_names(self, obj):
        return [group.name for group in obj.groups.all()]
    
    def get_assigned_entity(self, obj):
        return obj.assigned_entity
    
    def get_role(self, obj):
        return get_user_role(obj)
    
    def get_role_display(self, obj):
        return get_user_role_name(obj)
    
    def get_permissions(self, obj):
        return get_user_permissions(obj)

class UserCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'password', 'first_name', 'last_name', 'phone', 'location']
        extra_kwargs = {
            'password': {'write_only': True},
        }
    
    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user

class UserUpdateSerializer(serializers.ModelSerializer):
    """Serializer for admin user updates"""
    group_id = serializers.IntegerField(write_only=True, required=False)
    department_id = serializers.IntegerField(write_only=True, required=False)
    agency_id = serializers.IntegerField(write_only=True, required=False)
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'phone', 'location',
            'is_staff', 'is_active', 'is_public_only', 'can_access_dashboard',
            'assigned_department', 'assigned_agency', 'department_id', 'agency_id',
            'group_id', 'is_verified'
        ]
        read_only_fields = ['id', 'email']
    
    def update(self, instance, validated_data):
        # Handle department/agency assignment
        department_id = validated_data.pop('department_id', None)
        agency_id = validated_data.pop('agency_id', None)
        group_id = validated_data.pop('group_id', None)
        
        # Update department
        if department_id:
            try:
                instance.assigned_department = Department.objects.get(id=department_id)
                instance.assigned_agency = None
            except Department.DoesNotExist:
                pass
        elif agency_id:
            try:
                instance.assigned_agency = Agency.objects.get(id=agency_id)
                instance.assigned_department = None
            except Agency.DoesNotExist:
                pass
        
        # Update group
        if group_id:
            try:
                group = Group.objects.get(id=group_id)
                instance.groups.clear()
                instance.groups.add(group)
            except Group.DoesNotExist:
                pass
        
        # Update other fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        instance.save()
        return instance

class UserListSerializer(serializers.ModelSerializer):
    """Simplified serializer for user list"""
    full_name = serializers.SerializerMethodField()
    group = serializers.SerializerMethodField()
    group_id = serializers.SerializerMethodField()
    assigned_entity_name = serializers.SerializerMethodField()
    assigned_entity_type = serializers.SerializerMethodField()
    user_type = serializers.SerializerMethodField()
    role_display = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'full_name',
            'is_staff', 'is_active', 'is_public_only', 'can_access_dashboard',
            'group', 'group_id', 'assigned_entity_name', 'assigned_entity_type',
            'user_type', 'role_display', 'date_joined', 'last_login'
        ]
    
    def get_full_name(self, obj):
        return obj.full_name
    
    def get_group(self, obj):
        groups = obj.groups.all()
        if groups.exists():
            return groups.first().name
        return None
    
    def get_group_id(self, obj):
        groups = obj.groups.all()
        if groups.exists():
            return groups.first().id
        return None
    
    def get_assigned_entity_name(self, obj):
        if obj.assigned_department:
            return obj.assigned_department.name
        if obj.assigned_agency:
            return obj.assigned_agency.name
        return None
    
    def get_assigned_entity_type(self, obj):
        if obj.assigned_department:
            return 'department'
        if obj.assigned_agency:
            return 'agency'
        return None
    
    def get_user_type(self, obj):
        if obj.is_superuser:
            return 'super_admin'
        elif obj.is_staff and obj.can_access_dashboard:
            return 'staff'
        elif obj.can_access_dashboard:
            return 'dashboard_user'
        elif not obj.is_public_only:
            return 'pending'
        else:
            return 'public'
    
    def get_role_display(self, obj):
        return get_user_role_name(obj)

class ActivityLogSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()
    user_email = serializers.EmailField(source='user.email', read_only=True)
    
    class Meta:
        model = ActivityLog
        fields = ['id', 'user', 'user_name', 'user_email', 'action', 'description', 
                  'ip_address', 'created_at']
        read_only_fields = ['id', 'created_at']
    
    def get_user_name(self, obj):
        return obj.user.full_name