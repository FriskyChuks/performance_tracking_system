# accounts/admin.py
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.html import format_html
from django.urls import reverse
from django.utils import timezone
from .models import User, ActivityLog


class UserAdmin(BaseUserAdmin):
    list_display = (
        'email', 
        'full_name_display', 
        'role_badge', 
        'assigned_entity_display',
        'is_active', 
        'date_joined',
        'last_login_display'
    )
    
    list_filter = (
        'role', 
        'is_active', 
        'is_staff', 
        'is_superuser',
        'is_verified',
        'can_access_dashboard',
        'date_joined'
    )
    
    search_fields = (
        'email', 
        'first_name', 
        'last_name', 
        'phone',
        'location'
    )
    
    ordering = ('-date_joined',)
    
    readonly_fields = (
        'id',
        'last_login',
        'date_joined',
        'verification_token',
        'comment_count',
        'last_public_activity',
        'upgraded_at'
    )
    
    fieldsets = (
        ('Basic Information', {
            'fields': (
                'id',
                'email',
                'first_name',
                'last_name',
                'phone',
                'role',
            )
        }),
        ('Permissions & Access', {
            'fields': (
                'is_active',
                'is_staff',
                'is_superuser',
                'is_verified',
                'can_access_dashboard',
                'groups',
                'user_permissions',
            ),
            'classes': ('collapse',)
        }),
        ('Assignment', {
            'fields': (
                'assigned_department',
                'assigned_agency',
            ),
            'classes': ('collapse',)
        }),
        ('Public Portal', {
            'fields': (
                'location',
                'is_public_only',
                'comment_count',
                'last_public_activity',
            ),
            'classes': ('collapse',)
        }),
        ('Upgrade Tracking', {
            'fields': (
                'upgraded_by',
                'upgraded_at',
            ),
            'classes': ('collapse',)
        }),
        ('Security', {
            'fields': (
                'password',
                'last_login',
                'date_joined',
                'verification_token',
            ),
            'classes': ('collapse',)
        }),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': (
                'email',
                'first_name',
                'last_name',
                'phone',
                'role',
                'password1',
                'password2',
                'is_active',
                'is_staff',
                'is_superuser',
                'assigned_department',
                'assigned_agency',
            ),
        }),
    )
    
    # Custom methods for display
    def full_name_display(self, obj):
        if obj.first_name or obj.last_name:
            return f"{obj.first_name} {obj.last_name}".strip()
        return "-"
    full_name_display.short_description = "Full Name"
    full_name_display.admin_order_field = 'first_name'
    
    def role_badge(self, obj):
        role_colors = {
            'project_admin': '#3b82f6',    # blue
            'delivery_officer': '#10b981',  # green
            'director': '#8b5cf6',          # purple
            'sector_expert': '#f59e0b',     # orange
            'public_user': '#6b7280',       # gray
        }
        role_labels = {
            'project_admin': 'Project Admin',
            'delivery_officer': 'Delivery Officer',
            'director': 'Director',
            'sector_expert': 'Sector Expert',
            'public_user': 'Public User',
        }
        color = role_colors.get(obj.role, '#6b7280')
        label = role_labels.get(obj.role, obj.role)
        return format_html(
            '<span style="background-color: {}; color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 500;">{}</span>',
            color, label
        )
    role_badge.short_description = "Role"
    role_badge.admin_order_field = 'role'
    
    def assigned_entity_display(self, obj):
        if obj.assigned_department:
            return format_html(
                '<span style="background-color: #eff6ff; color: #1e40af; padding: 2px 8px; border-radius: 12px; font-size: 11px;">🏛️ {}</span>',
                obj.assigned_department.name
            )
        elif obj.assigned_agency:
            return format_html(
                '<span style="background-color: #f3e8ff; color: #6b21a5; padding: 2px 8px; border-radius: 12px; font-size: 11px;">🏢 {}</span>',
                obj.assigned_agency.name
            )
        return "-"
    assigned_entity_display.short_description = "Assigned Entity"
    
    def last_login_display(self, obj):
        if obj.last_login:
            return timezone.localtime(obj.last_login).strftime("%Y-%m-%d %H:%M")
        return "Never"
    last_login_display.short_description = "Last Login"
    
    # Actions
    actions = ['make_active', 'make_inactive', 'upgrade_to_project_admin', 'upgrade_to_delivery_officer', 'upgrade_to_director', 'upgrade_to_sector_expert']
    
    def make_active(self, request, queryset):
        updated = queryset.update(is_active=True)
        self.message_user(request, f'{updated} users were successfully activated.')
    make_active.short_description = "Activate selected users"
    
    def make_inactive(self, request, queryset):
        updated = queryset.update(is_active=False)
        self.message_user(request, f'{updated} users were successfully deactivated.')
    make_inactive.short_description = "Deactivate selected users"
    
    def upgrade_to_project_admin(self, request, queryset):
        updated = queryset.update(role='project_admin', can_access_dashboard=True)
        self.message_user(request, f'{updated} users were upgraded to Project Admin.')
    upgrade_to_project_admin.short_description = "Upgrade to Project Admin"
    
    def upgrade_to_delivery_officer(self, request, queryset):
        updated = queryset.update(role='delivery_officer', can_access_dashboard=True)
        self.message_user(request, f'{updated} users were upgraded to Delivery Officer.')
    upgrade_to_delivery_officer.short_description = "Upgrade to Delivery Officer"
    
    def upgrade_to_director(self, request, queryset):
        updated = queryset.update(role='director', can_access_dashboard=True)
        self.message_user(request, f'{updated} users were upgraded to Director.')
    upgrade_to_director.short_description = "Upgrade to Director"
    
    def upgrade_to_sector_expert(self, request, queryset):
        updated = queryset.update(role='sector_expert', can_access_dashboard=True)
        self.message_user(request, f'{updated} users were upgraded to Sector Expert.')
    upgrade_to_sector_expert.short_description = "Upgrade to Sector Expert"
    
    def save_model(self, request, obj, form, change):
        if not change:  # New user creation
            obj.set_password(form.cleaned_data.get('password1'))
        super().save_model(request, obj, form, change)


class ActivityLogAdmin(admin.ModelAdmin):
    list_display = (
        'user_email',
        'action_badge',
        'description_truncated',
        'created_at_display',
        'ip_address',
        'user_agent_truncated'
    )
    
    list_filter = (
        'action',
        'created_at',
    )
    
    search_fields = (
        'user__email',
        'description',
        'ip_address',
        'user_agent'
    )
    
    readonly_fields = (
        'user',
        'action',
        'description',
        'ip_address',
        'user_agent',
        'created_at'
    )
    
    ordering = ('-created_at',)
    
    fieldsets = (
        ('Activity Information', {
            'fields': (
                'user',
                'action',
                'description',
            )
        }),
        ('Technical Details', {
            'fields': (
                'ip_address',
                'user_agent',
                'created_at',
            ),
            'classes': ('collapse',)
        }),
    )
    
    def user_email(self, obj):
        return obj.user.email
    user_email.short_description = "User"
    user_email.admin_order_field = 'user__email'
    
    def action_badge(self, obj):
        action_colors = {
            'login': '#10b981',
            'logout': '#6b7280',
            'create': '#3b82f6',
            'activity_created': '#3b82f6',
            'update': '#f59e0b',
            'activity_updated': '#f59e0b',
            'delete': '#ef4444',
            'activity_deleted': '#ef4444',
            'change_password': '#8b5cf6',
            'update_profile': '#06b6d4',
            'quarterly_progress_submitted': '#14b8a6',
            'quarterly_progress_approved': '#10b981',
            'expert_assessment_completed': '#8b5cf6',
            'generate_report': '#ec4899',
            'export': '#06b6d4',
            'user_upgraded': '#8b5cf6',
            'role_assigned': '#8b5cf6',
        }
        color = action_colors.get(obj.action, '#6b7280')
        label = obj.action.replace('_', ' ').title()
        return format_html(
            '<span style="background-color: {}; color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px;">{}</span>',
            color, label
        )
    action_badge.short_description = "Action"
    action_badge.admin_order_field = 'action'
    
    def description_truncated(self, obj):
        if len(obj.description) > 60:
            return obj.description[:60] + '...'
        return obj.description
    description_truncated.short_description = "Description"
    
    def user_agent_truncated(self, obj):
        if len(obj.user_agent) > 50:
            return obj.user_agent[:50] + '...'
        return obj.user_agent or '-'
    user_agent_truncated.short_description = "User Agent"
    
    def created_at_display(self, obj):
        return timezone.localtime(obj.created_at).strftime("%Y-%m-%d %H:%M:%S")
    created_at_display.short_description = "Created At"
    created_at_display.admin_order_field = 'created_at'
    
    def has_add_permission(self, request):
        return False
    
    def has_change_permission(self, request, obj=None):
        return False
    
    def has_delete_permission(self, request, obj=None):
        return request.user.is_superuser


# Register models with custom admin interfaces
admin.site.register(User, UserAdmin)
admin.site.register(ActivityLog, ActivityLogAdmin)


# Custom admin site configuration
admin.site.site_header = "Environmental Monitoring System Admin"
admin.site.site_title = "EMS Admin Portal"
admin.site.index_title = "Welcome to Environmental Monitoring System Administration"