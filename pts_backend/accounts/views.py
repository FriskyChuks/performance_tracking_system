# accounts/views.py
from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.utils import timezone

from accounts.permissions import IsAdminUser
from .models import User, ActivityLog
from .serializers import *

class RegisterView(generics.CreateAPIView):
    """Public registration for public users"""
    queryset = User.objects.all()
    serializer_class = UserCreateSerializer
    permission_classes = [permissions.AllowAny]
    
    def perform_create(self, serializer):
        user = serializer.save()
        ActivityLog.objects.create(
            user=user,
            action='create',
            description=f"User {user.email} registered",
            ip_address=self.request.META.get('REMOTE_ADDR')
        )

class LoginView(APIView):
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = authenticate(
            email=serializer.validated_data['email'],
            password=serializer.validated_data['password']
        )
        
        if not user:
            return Response(
                {'error': 'Invalid credentials'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        if not user.is_active:
            return Response(
                {'error': 'Account disabled'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        refresh = RefreshToken.for_user(user)
        
        ActivityLog.objects.create(
            user=user,
            action='login',
            description=f"User {user.email} logged in",
            ip_address=request.META.get('REMOTE_ADDR'),
            user_agent=request.META.get('HTTP_USER_AGENT', '')
        )
        
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': UserSerializer(user).data
        })

class LogoutView(APIView):
    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            
            ActivityLog.objects.create(
                user=request.user,
                action='logout',
                description=f"User {request.user.email} logged out",
                ip_address=request.META.get('REMOTE_ADDR')
            )
        except Exception:
            pass
        
        return Response({'message': 'Logged out successfully'})

class ProfileView(generics.RetrieveUpdateAPIView):
    """Get/Update current user profile"""
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        return self.request.user
    
# Admin views for user management and activity logs
class AdminUserFullUpdateView(generics.RetrieveUpdateAPIView):
    """Admin only: Update any user's complete profile including role and assignments"""
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]
    
    def perform_update(self, serializer):
        user = self.get_object()
        old_role = user.role
        
        # Update the user
        serializer.save()
        
        # Log the activity
        ActivityLog.objects.create(
            user=self.request.user,
            action='role_assigned',
            description=f"Updated user {user.email} from {old_role} to {user.role}",
            ip_address=self.request.META.get('REMOTE_ADDR')
        )

class ChangePasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = request.user
        if not user.check_password(serializer.validated_data['old_password']):
            return Response(
                {'old_password': 'Wrong password'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user.set_password(serializer.validated_data['new_password'])
        user.save()
        
        ActivityLog.objects.create(
            user=user,
            action='change_password',
            description=f"User {user.email} changed password",
            ip_address=request.META.get('REMOTE_ADDR')
        )
        
        return Response({'message': 'Password changed successfully'})

class UserListView(generics.ListAPIView):
    """Admin: List all users"""
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]

class UserRoleUpdateView(generics.UpdateAPIView):
    """Admin: Update user role"""
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]
    
    def perform_update(self, serializer):
        user = self.get_object()
        old_role = user.role
        serializer.save()
        
        ActivityLog.objects.create(
            user=self.request.user,
            action='role_assigned',
            description=f"Changed user {user.email} role from {old_role} to {user.role}",
            ip_address=self.request.META.get('REMOTE_ADDR')
        )

class ActivityLogListView(generics.ListAPIView):
    """View activity logs"""
    serializer_class = ActivityLogSerializer
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]
    
    def get_queryset(self):
        queryset = ActivityLog.objects.all()
        user_id = self.request.query_params.get('user')
        action = self.request.query_params.get('action')
        
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        if action:
            queryset = queryset.filter(action=action)
        
        return queryset[:100]  # Last 100 logs