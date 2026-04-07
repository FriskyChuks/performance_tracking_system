# accounts/serializers.py
from djoser.serializers import UserCreateSerializer as BaseUserCreateSerializer
from djoser.serializers import UserSerializer as BaseUserSerializer
from rest_framework import serializers
from django.contrib.auth.models import Group

from main.models import Ministry
from .models import User, ActivityLog

from .models import User, ActivityLog, Group, Permission

class GroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = Group
        fields = ['id', 'name']

class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    display_name = serializers.SerializerMethodField()
    groups = GroupSerializer(many=True, read_only=True)
    group_names = serializers.SerializerMethodField()
    assigned_ministry_name = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'full_name', 'display_name',
            'phone', 'location', 'is_staff', 'is_active', 'is_superuser',
            'is_public_only', 'can_access_dashboard', 'is_verified',
            'assigned_ministry', 'assigned_ministry_name',
            'groups', 'group_names', 'comment_count',
            'date_joined', 'last_login', 'last_public_activity'
        ]
        read_only_fields = ['id', 'date_joined', 'last_login', 'comment_count']
    
    def get_full_name(self, obj):
        return obj.full_name
    
    def get_display_name(self, obj):
        return obj.display_name
    
    def get_group_names(self, obj):
        return [group.name for group in obj.groups.all()]
    
    def get_assigned_ministry_name(self, obj):
        if obj.assigned_ministry:
            return obj.assigned_ministry.title
        return None

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
    group = serializers.CharField(write_only=True, required=False)
    group_id = serializers.IntegerField(write_only=True, required=False)
    ministry_id = serializers.IntegerField(write_only=True, required=False)
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'phone', 'location',
            'is_staff', 'is_active', 'is_public_only', 'can_access_dashboard',
            'assigned_ministry', 'ministry_id', 'group', 'group_id',
            'is_verified'
        ]
        read_only_fields = ['id', 'email']
    
    def update(self, instance, validated_data):
        # Handle group assignment
        group_name = validated_data.pop('group', None)
        group_id = validated_data.pop('group_id', None)
        ministry_id = validated_data.pop('ministry_id', None)
        
        # Update ministry
        if ministry_id:
            try:
                instance.assigned_ministry = Ministry.objects.get(id=ministry_id)
            except Ministry.DoesNotExist:
                pass
        
        # Update group
        if group_name:
            try:
                group = Group.objects.get(name=group_name)
                instance.groups.clear()
                instance.groups.add(group)
            except Group.DoesNotExist:
                pass
        elif group_id:
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
    

class PermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Permission
        fields = ['id', 'name', 'codename']
  

class ActivityLogSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_name = serializers.SerializerMethodField()
    
    class Meta:
        model = ActivityLog
        fields = ['id', 'user', 'user_email', 'user_name', 'action', 'description', 
                  'ip_address', 'created_at']
        read_only_fields = ['id', 'user', 'created_at']
    
    def get_user_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}".strip() or obj.user.email
    

class UserListSerializer(serializers.ModelSerializer):
    """Simplified serializer for user list"""
    full_name = serializers.SerializerMethodField()
    group = serializers.SerializerMethodField()
    group_id = serializers.SerializerMethodField()
    ministry_name = serializers.SerializerMethodField()
    ministry_id = serializers.SerializerMethodField()
    user_type = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'full_name',
            'is_staff', 'is_active', 'is_public_only', 'can_access_dashboard',
            'group', 'group_id', 'ministry_name', 'ministry_id',
            'user_type', 'date_joined', 'last_login'
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
    
    def get_ministry_name(self, obj):
        if obj.assigned_ministry:
            return obj.assigned_ministry.title
        return None
    
    def get_ministry_id(self, obj):
        if obj.assigned_ministry:
            return obj.assigned_ministry.id
        return None
    
    def get_user_type(self, obj):
        """Determine user type for UI display"""
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