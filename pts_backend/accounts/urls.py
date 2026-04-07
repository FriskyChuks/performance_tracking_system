# accounts/urls.py
from django.urls import path, include
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView,
)
from . import views

urlpatterns = [
    # Test endpoint
    # path('test/', views.api_test, name='api-test'),
    
    # JWT endpoints
    path('auth/jwt/create/', TokenObtainPairView.as_view(), name='jwt-create'),
    path('auth/jwt/refresh/', TokenRefreshView.as_view(), name='jwt-refresh'),
    path('auth/jwt/verify/', TokenVerifyView.as_view(), name='jwt-verify'),
    
    # Custom user endpoints
    path('me/', views.me, name='me'),
    path('profile/', views.update_profile, name='update-profile'),
    path('register/', views.register, name='register'),
    path('change-password/', views.change_password, name='change-password'),
    
    # Activity endpoints
    path('activities/', views.get_activities, name='get-activities'),
    path('activities/all/', views.get_all_activities, name='get-all-activities'),
    path('activities/log/', views.log_activity, name='log-activity'),

    # Admin User Management
    path('admin/users/', views.get_all_users, name='admin-users'),
    path('admin/users/pending/', views.get_pending_users, name='admin-pending-users'),
    path('admin/users/<int:user_id>/', views.get_user_detail, name='admin-user-detail'),
    path('admin/users/<int:user_id>/upgrade/', views.upgrade_user, name='admin-upgrade-user'),
    path('admin/users/assign-group/', views.assign_user_group, name='admin-assign-group'),
    path('admin/groups/', views.get_available_groups, name='admin-groups'),
    
    # User Status
    path('user/status/', views.get_current_user_status, name='user-status'),
]