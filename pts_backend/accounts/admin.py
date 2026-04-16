# accounts/admin.py
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import Group
from django.utils.html import format_html
from django.urls import reverse
from django.db.models import Count
from django.utils import timezone
from .models import User, ActivityLog

class ActivityLogInline(admin.TabularInline):
    model = ActivityLog
    extra = 0
    fields = ['action', 'description', 'ip_address', 'created_at']
    readonly_fields = ['action', 'description', 'ip_address', 'created_at']
    can_delete = False
    max_num = 10
    show_change_link = True
    
    def has_add_permission(self, request, obj=None):
        return False

class UserAdmin(BaseUserAdmin):
    ordering = ['email']
    
    list_display = [
        'email', 
        'full_name_display', 
        'user_type_badge', 
        'group_badges', 
        'assigned_entity_display',
        'comment_count',
        'last_active_display',
        'date_joined'
    ]
    
    list_filter = [
        'is_staff', 
        'is_active', 
        'is_public_only', 
        'can_access_dashboard',
        'is_verified',
        'groups',
        'date_joined'
    ]
    
    search_fields = ['email', 'first_name', 'last_name', 'phone', 'location']
    
    filter_horizontal = ['groups', 'user_permissions']
    
    fieldsets = (
        ('Account Information', {
            'fields': ('email', 'password')
        }),
        ('Personal Information', {
            'fields': ('first_name', 'last_name', 'phone', 'location')
        }),
        ('Dashboard Access', {
            'fields': (
                'is_staff', 
                'is_active', 
                'can_access_dashboard',
                'groups', 
                'user_permissions'
            ),
            'classes': ('wide',)
        }),
        ('Assignment', {
            'fields': ('assigned_department', 'assigned_agency'),
            'classes': ('wide',)
        }),
        ('Public Portal', {
            'fields': (
                'is_public_only', 
                'is_verified', 
                'verification_token', 
                'comment_count', 
                'last_public_activity'
            ),
            'classes': ('collapse',)
        }),
        ('Upgrade Information', {
            'fields': ('upgraded_by', 'upgraded_at'),
            'classes': ('collapse',)
        }),
        ('Important Dates', {
            'fields': ('last_login', 'date_joined'),
            'classes': ('collapse',)
        }),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'first_name', 'last_name', 'password1', 'password2', 'groups'),
        }),
    )
    
    readonly_fields = ['date_joined', 'last_login', 'upgraded_at', 'verification_token']
    
    def full_name_display(self, obj):
        return obj.full_name
    full_name_display.short_description = 'Full Name'
    
    def assigned_entity_display(self, obj):
        entity = obj.assigned_entity
        if entity:
            if entity['type'] == 'department':
                return format_html('<span style="color: #3b82f6;">🏢 {}</span>', entity['name'])
            else:
                return format_html('<span style="color: #8b5cf6;">🏛️ {}</span>', entity['name'])
        return '-'
    assigned_entity_display.short_description = 'Department/Agency'
    
    def user_type_badge(self, obj):
        if obj.is_superuser:
            return format_html('<span style="background-color: #ef4444; color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px;">👑 Super Admin</span>')
        elif obj.is_staff and obj.can_access_dashboard:
            # Check user's group for more specific badge
            groups = obj.groups.all()
            if groups.filter(name='Director').exists():
                return format_html('<span style="background-color: #3b82f6; color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px;">🎯 Director</span>')
            elif groups.filter(name='SectorExpert').exists():
                return format_html('<span style="background-color: #8b5cf6; color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px;">🔬 Sector Expert</span>')
            elif groups.filter(name='Staff').exists():
                return format_html('<span style="background-color: #22c55e; color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px;">👷 Staff</span>')
            elif groups.filter(name='ProjectAdmin').exists():
                return format_html('<span style="background-color: #f59e0b; color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px;">📋 Project Admin</span>')
            return format_html('<span style="background-color: #22c55e; color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px;">📊 Staff</span>')
        elif obj.can_access_dashboard:
            return format_html('<span style="background-color: #3b82f6; color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px;">👤 Dashboard User</span>')
        elif not obj.is_public_only:
            return format_html('<span style="background-color: #f59e0b; color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px;">⏳ Pending</span>')
        else:
            return format_html('<span style="background-color: #6b7280; color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px;">🌐 Public User</span>')
    user_type_badge.short_description = 'User Type'
    
    def group_badges(self, obj):
        groups = obj.groups.all()
        if not groups:
            return format_html('<span style="color: #9ca3af;">No groups assigned</span>')
        
        group_colors = {
            'Super Admin': '#ef4444',
            'Director': '#3b82f6',
            'SectorExpert': '#8b5cf6',
            'Staff': '#22c55e',
            'ProjectAdmin': '#f59e0b',
            'Viewer': '#6b7280',
        }
        
        badges = []
        for group in groups:
            color = group_colors.get(group.name, '#6b7280')
            badges.append(format_html(
                '<span style="background-color: {}; color: white; padding: 2px 8px; border-radius: 12px; font-size: 10px; margin-right: 4px;">{}</span>',
                color, group.name
            ))
        return format_html(''.join(badges))
    group_badges.short_description = 'Groups'
    
    def last_active_display(self, obj):
        if obj.last_public_activity:
            return format_html('<span title="{}">{}</span>', 
                obj.last_public_activity.strftime('%Y-%m-%d %H:%M'),
                obj.last_public_activity.strftime('%Y-%m-%d')
            )
        return '-'
    last_active_display.short_description = 'Last Active'
    
    inlines = [ActivityLogInline]
    
    actions = [
        'upgrade_to_dashboard', 
        'downgrade_to_public',
        'verify_users',
        'assign_director',
        'assign_sector_expert',
        'assign_staff',
        'assign_project_admin'
    ]
    
    def upgrade_to_dashboard(self, request, queryset):
        updated = queryset.update(
            is_public_only=False,
            can_access_dashboard=True,
            upgraded_by=request.user,
            upgraded_at=timezone.now()
        )
        self.message_user(request, f'{updated} users upgraded to dashboard access.')
    upgrade_to_dashboard.short_description = 'Upgrade to Dashboard Access'
    
    def downgrade_to_public(self, request, queryset):
        updated = queryset.update(
            is_public_only=True,
            can_access_dashboard=False,
            is_staff=False
        )
        self.message_user(request, f'{updated} users downgraded to public access.')
    downgrade_to_public.short_description = 'Downgrade to Public Access'
    
    def verify_users(self, request, queryset):
        updated = queryset.update(is_verified=True)
        self.message_user(request, f'{updated} users marked as verified.')
    verify_users.short_description = 'Verify selected users'
    
    def assign_director(self, request, queryset):
        from django.contrib.auth.models import Group
        group, _ = Group.objects.get_or_create(name='Director')
        for user in queryset:
            user.groups.clear()
            user.groups.add(group)
            user.is_staff = True
            user.can_access_dashboard = True
            user.is_public_only = False
            user.save()
        self.message_user(request, f'{queryset.count()} users assigned to Director group.')
    assign_director.short_description = 'Assign to Director'
    
    def assign_sector_expert(self, request, queryset):
        from django.contrib.auth.models import Group
        group, _ = Group.objects.get_or_create(name='SectorExpert')
        for user in queryset:
            user.groups.clear()
            user.groups.add(group)
            user.is_staff = True
            user.can_access_dashboard = True
            user.is_public_only = False
            user.save()
        self.message_user(request, f'{queryset.count()} users assigned to Sector Expert group.')
    assign_sector_expert.short_description = 'Assign to Sector Expert'
    
    def assign_staff(self, request, queryset):
        from django.contrib.auth.models import Group
        group, _ = Group.objects.get_or_create(name='Staff')
        for user in queryset:
            user.groups.clear()
            user.groups.add(group)
            user.is_staff = True
            user.can_access_dashboard = True
            user.is_public_only = False
            user.save()
        self.message_user(request, f'{queryset.count()} users assigned to Staff group.')
    assign_staff.short_description = 'Assign to Staff'
    
    def assign_project_admin(self, request, queryset):
        from django.contrib.auth.models import Group
        group, _ = Group.objects.get_or_create(name='ProjectAdmin')
        for user in queryset:
            user.groups.clear()
            user.groups.add(group)
            user.is_staff = True
            user.can_access_dashboard = True
            user.is_public_only = False
            user.save()
        self.message_user(request, f'{queryset.count()} users assigned to Project Admin group.')
    assign_project_admin.short_description = 'Assign to Project Admin'

class ActivityLogAdmin(admin.ModelAdmin):
    list_display = ['id', 'user_link', 'action_badge', 'description_short', 'ip_address', 'created_at']
    list_filter = ['action', 'created_at']
    search_fields = ['user__email', 'description', 'ip_address']
    readonly_fields = ['user', 'action', 'description', 'ip_address', 'user_agent', 'created_at']
    
    def has_add_permission(self, request):
        return False
    
    def has_delete_permission(self, request, obj=None):
        return request.user.is_superuser
    
    def user_link(self, obj):
        url = reverse('admin:accounts_user_change', args=[obj.user.id])
        return format_html('<a href="{}" style="font-weight: bold;">{}</a>', url, obj.user.email)
    user_link.short_description = 'User'
    
    def action_badge(self, obj):
        action_colors = {
            'login': '#22c55e',
            'logout': '#6b7280',
            'create': '#3b82f6',
            'initiative_created': '#3b82f6',
            'update': '#f59e0b',
            'initiative_updated': '#f59e0b',
            'delete': '#ef4444',
            'initiative_deleted': '#ef4444',
            'progress_recorded': '#10b981',
            'export': '#8b5cf6',
            'generate_report': '#8b5cf6',
            'report_generated': '#8b5cf6',
            'change_password': '#ef4444',
            'update_profile': '#10b981',
            'user_upgraded': '#8b5cf6',
            'role_assigned': '#8b5cf6',
        }
        color = action_colors.get(obj.action, '#6b7280')
        return format_html('<span style="background-color: {}; color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px;">{}</span>', 
            color, obj.action.replace('_', ' ').title())
    action_badge.short_description = 'Action'
    
    def description_short(self, obj):
        if len(obj.description) > 50:
            return obj.description[:50] + '...'
        return obj.description
    description_short.short_description = 'Description'

# Custom Group Admin
class GroupAdmin(admin.ModelAdmin):
    list_display = ['name', 'user_count', 'permission_count']
    search_fields = ['name']
    filter_horizontal = ['permissions']
    
    def user_count(self, obj):
        return obj.user_set.count()
    user_count.short_description = 'Users'
    
    def permission_count(self, obj):
        return obj.permissions.count()
    permission_count.short_description = 'Permissions'

# Unregister default Group admin and register our enhanced version
admin.site.unregister(Group)
admin.site.register(Group, GroupAdmin)

# Register models
admin.site.register(User, UserAdmin)
admin.site.register(ActivityLog, ActivityLogAdmin)

# Custom admin site configuration
admin.site.site_header = 'FME Performance Tracking System Admin'
admin.site.site_title = 'FME PTS Admin'
admin.site.index_title = 'Welcome to Federal Ministry of Environment Performance Tracking System'