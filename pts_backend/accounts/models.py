# accounts/models.py
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager, Group, Permission
from django.utils import timezone
from django.conf import settings

class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Users must have an email address')
        
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user
    
    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        
        return self.create_user(email, password, **extra_fields)

class User(AbstractBaseUser, PermissionsMixin):
    # Basic Information
    email = models.EmailField(unique=True, db_index=True)
    first_name = models.CharField(max_length=150, blank=True)
    last_name = models.CharField(max_length=150, blank=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    
    # Dashboard fields
    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    date_joined = models.DateTimeField(default=timezone.now)
    assigned_ministry = models.ForeignKey('main.Ministry', on_delete=models.SET_NULL, null=True, blank=True)
    can_access_dashboard = models.BooleanField(default=False)
    
    # Public portal fields
    location = models.CharField(max_length=250, blank=True, null=True)
    is_verified = models.BooleanField(default=False)
    verification_token = models.CharField(max_length=100, blank=True, null=True)
    comment_count = models.IntegerField(default=0)
    last_public_activity = models.DateTimeField(null=True, blank=True)
    is_public_only = models.BooleanField(default=True)

    upgraded_by = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True)
    upgraded_at = models.DateTimeField(null=True, blank=True)
    
    # Groups and permissions are already included via PermissionsMixin
    # Django automatically adds: groups, user_permissions
    
    objects = UserManager()
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []
    
    def __str__(self):
        return self.email
    
    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip() or self.email
    
    @property
    def display_name(self):
        """Return appropriate display name for public portal"""
        if self.is_staff:
            return f"{self.first_name} {self.last_name} (Staff)"
        return self.full_name
    
    @property
    def can_moderate_comments(self):
        """Check if user can moderate comments"""
        return self.has_perm('engagement.moderate_comments') or self.is_staff
    
    @property
    def can_manage_projects(self):
        """Check if user can manage projects"""
        return self.has_perm('main.manage_projects') or self.is_staff
    
    @property
    def can_view_reports(self):
        """Check if user can view reports"""
        return self.has_perm('reports.view_reports') or self.is_staff
    
    class Meta:
        permissions = [
            # Dashboard permissions
            ("view_dashboard", "Can view dashboard"),
            ("manage_ministries", "Can manage ministries"),
            ("manage_priority_areas", "Can manage priority areas"),
            ("manage_deliverables", "Can manage deliverables"),
            ("manage_all_projects", "Can manage all projects"),
            ("view_all_reports", "Can view all reports"),
            ("export_data", "Can export data"),
            
            # Engagement permissions
            ("moderate_comments", "Can moderate comments"),
            ("delete_any_comment", "Can delete any comment"),
            ("pin_comments", "Can pin important comments"),
            ("view_analytics", "Can view engagement analytics"),
            ("manage_public_users", "Can manage public users"),
            
            # User management permissions
            ("manage_users", "Can manage users"),
            ("manage_roles", "Can manage roles and permissions"),
        ]


class ActivityLog(models.Model):
    ACTION_TYPES = [
        ('login', 'Login'),
        ('logout', 'Logout'),
        ('create', 'Create'),
        ('project_created', 'Project Created'),
        ('update', 'Update'),
        ('project_updated', 'Project Updated'),
        ('delete', 'Delete'),
        ('project_deleted', 'Project Deleted'),
        ('view', 'View'),
        ('export', 'Export'),
        ('generate_report', 'Generate Report'),
        ('report_generated', 'Report Generated'),
        ('change_password', 'Change Password'),
        ('update_profile', 'Update Profile'),
    ]
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='activities')
    action = models.CharField(max_length=50, choices=ACTION_TYPES)
    description = models.TextField()
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name_plural = 'Activity Logs'
    
    def __str__(self):
        return f"{self.user.email} - {self.action} - {self.created_at.strftime('%Y-%m-%d %H:%M')}"