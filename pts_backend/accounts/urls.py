# accounts/urls.py
from django.urls import path
from . import views

urlpatterns = [
    # Authentication
    path('register/', views.RegisterView.as_view(), name='register'),
    path('login/', views.LoginView.as_view(), name='login'),
    path('logout/', views.LogoutView.as_view(), name='logout'),
    path('profile/', views.ProfileView.as_view(), name='profile'),
    path('change-password/', views.ChangePasswordView.as_view(), name='change-password'),
    
    # Admin user management
    path('users/', views.UserListView.as_view(), name='user-list'),
    path('users/<int:pk>/update/', views.AdminUserFullUpdateView.as_view(), name='admin-user-update'),
    path('users/<int:pk>/role/', views.AdminUserFullUpdateView.as_view(), name='user-role-update'),
    
    # Activity logs
    path('activity-logs/', views.ActivityLogListView.as_view(), name='activity-logs'),
]