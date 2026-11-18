# accounts/serializers.py
from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from .models import User, ActivityLog

class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    assigned_entity = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'full_name', 'phone',
            'role', 'assigned_department', 'assigned_agency', 'assigned_entity',
            'location', 'is_verified', 'can_access_dashboard', 'is_public_only',
            'date_joined', 'is_active','is_superuser'
        ]
        read_only_fields = ['id', 'date_joined', 'is_verified']
    
    def get_full_name(self, obj):
        return obj.full_name
    
    def get_assigned_entity(self, obj):
        return obj.assigned_entity
    
    def update(self, instance, validated_data):
        # Allow updating role and assignments
        instance.role = validated_data.get('role', instance.role)
        instance.assigned_department = validated_data.get('assigned_department', instance.assigned_department)
        instance.assigned_agency = validated_data.get('assigned_agency', instance.assigned_agency)
        instance.can_access_dashboard = validated_data.get('can_access_dashboard', instance.can_access_dashboard)
        instance.is_public_only = validated_data.get('is_public_only', instance.is_public_only)
        instance.first_name = validated_data.get('first_name', instance.first_name)
        instance.last_name = validated_data.get('last_name', instance.last_name)
        instance.phone = validated_data.get('phone', instance.phone)
        instance.save()
        return instance

class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)
    
    class Meta:
        model = User
        fields = [
            'email', 'first_name', 'last_name', 'phone', 'password', 'password2',
            'role', 'assigned_department', 'assigned_agency'
        ]
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password2')
        password = validated_data.pop('password')
        # Default to public_user for new registrations
        if 'role' not in validated_data:
            validated_data['role'] = 'public_user'
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()

class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, validators=[validate_password])
    confirm_password = serializers.CharField(required=True)
    
    def validate(self, attrs):
        if attrs['new_password'] != attrs['confirm_password']:
            raise serializers.ValidationError({"confirm_password": "Password fields didn't match."})
        return attrs

class ActivityLogSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source='user.email', read_only=True)
    user_name = serializers.SerializerMethodField()
    
    class Meta:
        model = ActivityLog
        fields = ['id', 'user', 'user_email', 'user_name', 'action', 'description', 'ip_address', 'created_at']
        read_only_fields = ['id', 'created_at']
    
    def get_user_name(self, obj):
        return obj.user.full_name