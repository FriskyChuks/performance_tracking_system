# engagement/admin.py
from django.contrib import admin
from django.urls import reverse
from django.utils.html import format_html
from django.utils import timezone
from django.db.models import Count, Q
from .models import (
    AnonymousCommenter,
    ProjectImage,
    QuarterlyDocument,
    ProjectComment,
    CommentReaction,
    ProjectActivityFollow
)


class BaseAdmin(admin.ModelAdmin):
    """Base admin class with common functionality"""
    save_on_top = True
    readonly_fields = ('created_at',)
    
    def save_model(self, request, obj, form, change):
        if not change and hasattr(obj, 'uploaded_by') and not obj.uploaded_by_id:
            obj.uploaded_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(AnonymousCommenter)
class AnonymousCommenterAdmin(BaseAdmin):
    list_display = ('id', 'display_name', 'session_id_truncated', 'comment_count', 'reaction_count', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('session_id', 'display_name')
    readonly_fields = ('session_id', 'created_at')
    
    def session_id_truncated(self, obj):
        return obj.session_id[:16] + '...' if len(obj.session_id) > 16 else obj.session_id
    session_id_truncated.short_description = 'Session ID'
    
    def comment_count(self, obj):
        count = obj.comments.count()
        url = reverse('admin:engagement_projectcomment_changelist') + f'?anonymous_user__id__exact={obj.id}'
        return format_html('<a href="{}">{} comments</a>', url, count)
    comment_count.short_description = '# Comments'
    
    def reaction_count(self, obj):
        count = obj.reactions.count()
        url = reverse('admin:engagement_commentreaction_changelist') + f'?anonymous_user__id__exact={obj.id}'
        return format_html('<a href="{}">{} reactions</a>', url, count)
    reaction_count.short_description = '# Reactions'
    
    fieldsets = (
        ('Anonymous User Information', {
            'fields': ('session_id', 'display_name')
        }),
        ('Timestamps', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )


@admin.register(ProjectImage)
class ProjectImageAdmin(BaseAdmin):
    list_display = ('preview_image', 'project_activity', 'is_primary', 'quarter', 'year', 
                   'uploaded_by', 'created_at')
    list_filter = ('is_primary', 'quarter', 'year', 'created_at', 'uploaded_by')
    search_fields = ('project_activity__title', 'caption', 'uploaded_by__email')
    readonly_fields = ('created_at', 'preview_image_large')
    raw_id_fields = ('project_activity', 'uploaded_by')
    list_editable = ('is_primary', 'quarter', 'year')
    
    fieldsets = (
        ('Image Information', {
            'fields': ('project_activity', 'image', 'caption', 'is_primary')
        }),
        ('Quarter Attribution', {
            'fields': ('quarter', 'year'),
            'description': 'Which quarter/year does this image document?'
        }),
        ('Upload Information', {
            'fields': ('uploaded_by', 'created_at')
        }),
        ('Preview', {
            'fields': ('preview_image_large',),
            'classes': ('collapse',)
        }),
    )
    
    def preview_image(self, obj):
        if obj.image:
            return format_html('<img src="{}" width="50" height="50" style="object-fit: cover; border-radius: 4px;" />', obj.image.url)
        return "No image"
    preview_image.short_description = 'Preview'
    
    def preview_image_large(self, obj):
        if obj.image:
            return format_html('<img src="{}" width="300" style="max-width: 100%; height: auto; border-radius: 8px;" />', obj.image.url)
        return "No image"
    preview_image_large.short_description = 'Image Preview'
    
    actions = ['set_as_primary', 'set_quarter_q1', 'set_quarter_q2', 'set_quarter_q3', 'set_quarter_q4']
    
    def set_as_primary(self, request, queryset):
        # First, unset primary for all other images of the same project activity
        for image in queryset:
            ProjectImage.objects.filter(project_activity=image.project_activity, is_primary=True).update(is_primary=False)
        count = queryset.update(is_primary=True)
        self.message_user(request, f'Set {count} images as primary')
    set_as_primary.short_description = 'Set selected images as primary (will unset others for same activity)'
    
    def set_quarter_q1(self, request, queryset):
        count = queryset.update(quarter=1, year=timezone.now().year)
        self.message_user(request, f'Set {count} images to Q1 {timezone.now().year}')
    set_quarter_q1.short_description = 'Set quarter to Q1 (current year)'
    
    def set_quarter_q2(self, request, queryset):
        count = queryset.update(quarter=2, year=timezone.now().year)
        self.message_user(request, f'Set {count} images to Q2 {timezone.now().year}')
    set_quarter_q2.short_description = 'Set quarter to Q2 (current year)'
    
    def set_quarter_q3(self, request, queryset):
        count = queryset.update(quarter=3, year=timezone.now().year)
        self.message_user(request, f'Set {count} images to Q3 {timezone.now().year}')
    set_quarter_q3.short_description = 'Set quarter to Q3 (current year)'
    
    def set_quarter_q4(self, request, queryset):
        count = queryset.update(quarter=4, year=timezone.now().year)
        self.message_user(request, f'Set {count} images to Q4 {timezone.now().year}')
    set_quarter_q4.short_description = 'Set quarter to Q4 (current year)'


@admin.register(QuarterlyDocument)
class QuarterlyDocumentAdmin(BaseAdmin):
    list_display = ('title', 'quarterly_progress', 'uploaded_by', 'download_link', 'created_at')
    list_filter = ('created_at', 'uploaded_by')
    search_fields = ('title', 'description', 'quarterly_progress__activity__title')
    readonly_fields = ('created_at',)
    raw_id_fields = ('quarterly_progress', 'uploaded_by')
    
    fieldsets = (
        ('Document Information', {
            'fields': ('quarterly_progress', 'title', 'description', 'document')
        }),
        ('Upload Information', {
            'fields': ('uploaded_by', 'created_at')
        }),
    )
    
    def download_link(self, obj):
        if obj.document:
            return format_html('<a href="{}" target="_blank">📄 Download</a>', obj.document.url)
        return "No file"
    download_link.short_description = 'Document'


class CommentReactionInline(admin.TabularInline):
    model = CommentReaction
    extra = 0
    fields = ('reaction_type', 'get_user_display', 'created_at')
    readonly_fields = ('created_at', 'get_user_display')
    can_delete = True
    show_change_link = True
    
    def get_user_display(self, obj):
        if obj.user:
            return f"👤 {obj.user.full_name} ({obj.user.email})"
        elif obj.anonymous_user:
            return f"👻 {obj.anonymous_user.display_name or 'Anonymous'}"
        elif obj.session_id:
            return f"🆔 Session: {obj.session_id[:16]}"
        return "Unknown"
    get_user_display.short_description = 'User'
    
    def has_add_permission(self, request, obj=None):
        return True


@admin.register(ProjectComment)
class ProjectCommentAdmin(BaseAdmin):
    list_display = ('author_display', 'project_activity', 'content_preview', 
                   'is_staff_comment', 'is_verified', 'reaction_count', 
                   'reply_count', 'created_at')
    list_filter = ('is_verified', 'created_at', 'updated_at', 'project_activity__status')
    search_fields = ('content', 'user__email', 'user__full_name', 
                    'anonymous_user__display_name', 'project_activity__title')
    readonly_fields = ('created_at', 'updated_at', 'author_type', 'is_staff_comment')
    raw_id_fields = ('project_activity', 'user', 'anonymous_user', 'parent')
    list_editable = ('is_verified',)
    inlines = [CommentReactionInline]
    actions = ['verify_selected', 'unverify_selected', 'delete_reported_comments']
    
    fieldsets = (
        ('Comment Information', {
            'fields': ('project_activity', 'parent', 'content')
        }),
        ('Author Information', {
            'fields': ('user', 'anonymous_user', 'location', 'author_type', 'is_staff_comment')
        }),
        ('Verification Status', {
            'fields': ('is_verified',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def author_display(self, obj):
        if obj.user:
            if obj.user.is_staff:
                return format_html('<span style="color: #007bff;">👑 {}</span>', obj.user.full_name or obj.user.email)
            return format_html('<span style="color: #28a745;">👤 {}</span>', obj.user.full_name or obj.user.email)
        elif obj.anonymous_user:
            return format_html('<span style="color: #6c757d;">👻 {}</span>', obj.anonymous_user.display_name or 'Anonymous')
        return "Unknown"
    author_display.short_description = 'Author'
    
    def content_preview(self, obj):
        preview = obj.content[:100]
        if len(obj.content) > 100:
            preview += '...'
        return preview
    content_preview.short_description = 'Comment'
    
    def reaction_count(self, obj):
        counts = obj.reactions.values('reaction_type').annotate(total=Count('reaction_type'))
        if counts:
            badges = ' '.join([f'{r["reaction_type"]}: {r["total"]}' for r in counts])
            return badges
        return '0'
    reaction_count.short_description = 'Reactions'
    
    def reply_count(self, obj):
        count = obj.replies.count()
        if count > 0:
            url = reverse('admin:engagement_projectcomment_changelist') + f'?parent__id__exact={obj.id}'
            return format_html('<a href="{}">{} replies</a>', url, count)
        return count
    reply_count.short_description = 'Replies'
    
    def verify_selected(self, request, queryset):
        count = queryset.update(is_verified=True)
        self.message_user(request, f'Verified {count} comments')
    verify_selected.short_description = 'Verify selected comments (mark as truthful)'
    
    def unverify_selected(self, request, queryset):
        count = queryset.update(is_verified=False)
        self.message_user(request, f'Unverified {count} comments')
    unverify_selected.short_description = 'Unverify selected comments'
    
    def delete_reported_comments(self, request, queryset):
        # Find comments with 'report' reactions
        reported = queryset.filter(reactions__reaction_type='report').distinct()
        count = reported.count()
        reported.delete()
        self.message_user(request, f'Deleted {count} reported comments')
    delete_reported_comments.short_description = 'Delete comments that have been reported'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user', 'anonymous_user')


@admin.register(CommentReaction)
class CommentReactionAdmin(BaseAdmin):
    list_display = ('reaction_type', 'comment_preview', 'user_display', 'created_at')
    list_filter = ('reaction_type', 'created_at')
    search_fields = ('comment__content', 'user__email', 'anonymous_user__display_name', 'session_id')
    readonly_fields = ('created_at',)
    raw_id_fields = ('comment', 'user', 'anonymous_user')
    
    list_per_page = 50
    
    fieldsets = (
        ('Reaction Information', {
            'fields': ('comment', 'reaction_type')
        }),
        ('User Information', {
            'fields': ('user', 'anonymous_user', 'session_id')
        }),
        ('Timestamps', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )
    
    def comment_preview(self, obj):
        preview = obj.comment.content[:50]
        if len(obj.comment.content) > 50:
            preview += '...'
        # Add link to comment
        url = reverse('admin:engagement_projectcomment_change', args=[obj.comment.id])
        return format_html('<a href="{}">{}</a>', url, preview)
    comment_preview.short_description = 'Comment'
    
    def user_display(self, obj):
        if obj.user:
            return f"👤 {obj.user.full_name or obj.user.email}"
        elif obj.anonymous_user:
            return f"👻 {obj.anonymous_user.display_name or 'Anonymous'}"
        elif obj.session_id:
            return f"🆔 Session: {obj.session_id[:16]}"
        return "Unknown"
    user_display.short_description = 'User'
    
    actions = ['bulk_delete_reactions']
    
    def bulk_delete_reactions(self, request, queryset):
        count = queryset.count()
        queryset.delete()
        self.message_user(request, f'Deleted {count} reactions')
    bulk_delete_reactions.short_description = 'Delete selected reactions'


@admin.register(ProjectActivityFollow)
class ProjectActivityFollowAdmin(BaseAdmin):
    list_display = ('user', 'project_activity', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('user__email', 'user__full_name', 'project_activity__title')
    readonly_fields = ('created_at',)
    raw_id_fields = ('user', 'project_activity')
    
    fieldsets = (
        ('Follow Information', {
            'fields': ('user', 'project_activity')
        }),
        ('Timestamps', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['export_followers_data']
    
    def export_followers_data(self, request, queryset):
        import csv
        from django.http import HttpResponse
        
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="project_followers.csv"'
        
        writer = csv.writer(response)
        writer.writerow(['Project Activity', 'User Email', 'User Name', 'Follow Date'])
        
        for follow in queryset.select_related('project_activity', 'user'):
            writer.writerow([
                follow.project_activity.title,
                follow.user.email,
                follow.user.full_name,
                follow.created_at.strftime('%Y-%m-%d %H:%M:%S')
            ])
        
        self.message_user(request, 'Export started')
        return response
    export_followers_data.short_description = 'Export selected followers to CSV'


# Optional: Dashboard statistics for admin index
class EngagementDashboard(admin.AdminSite):
    """Custom admin site with engagement statistics"""
    
    def index(self, request, extra_context=None):
        # Add engagement statistics to admin dashboard
        extra_context = extra_context or {}
        
        # Calculate engagement metrics
        total_comments = ProjectComment.objects.count()
        verified_comments = ProjectComment.objects.filter(is_verified=True).count()
        total_reactions = CommentReaction.objects.count()
        total_anonymous = AnonymousCommenter.objects.count()
        total_images = ProjectImage.objects.count()
        total_follows = ProjectActivityFollow.objects.count()
        
        # Recent activity
        recent_comments = ProjectComment.objects.select_related('user', 'anonymous_user')[:10]
        recent_images = ProjectImage.objects.select_related('project_activity')[:10]
        
        # Comment trends by day (last 7 days)
        from datetime import timedelta
        date_threshold = timezone.now() - timedelta(days=7)
        daily_comments = ProjectComment.objects.filter(created_at__gte=date_threshold)\
            .extra({'date': "DATE(created_at)"}).values('date')\
            .annotate(count=Count('id')).order_by('-date')
        
        extra_context.update({
            'engagement_stats': {
                'total_comments': total_comments,
                'verified_comments': verified_comments,
                'verification_rate': round((verified_comments / total_comments * 100), 1) if total_comments > 0 else 0,
                'total_reactions': total_reactions,
                'total_anonymous': total_anonymous,
                'total_images': total_images,
                'total_follows': total_follows,
            },
            'recent_comments': recent_comments,
            'recent_images': recent_images,
            'daily_comments': daily_comments,
        })
        
        return super().index(request, extra_context)


# Register custom admin site if needed (optional - uncomment to use)
# engagement_admin_site = EngagementDashboard(name='engagement_admin')
# engagement_admin_site.register(ProjectComment, ProjectCommentAdmin)
# engagement_admin_site.register(ProjectImage, ProjectImageAdmin)
# etc...


# Add custom list filters for advanced filtering
class VerifiedCommentFilter(admin.SimpleListFilter):
    title = 'verification status'
    parameter_name = 'verified'
    
    def lookups(self, request, model_admin):
        return (
            ('verified', 'Verified Only'),
            ('unverified', 'Unverified Only'),
            ('staff', 'Staff Comments Only'),
            ('anonymous', 'Anonymous Only'),
        )
    
    def queryset(self, request, queryset):
        if self.value() == 'verified':
            return queryset.filter(is_verified=True)
        if self.value() == 'unverified':
            return queryset.filter(is_verified=False)
        if self.value() == 'staff':
            return queryset.filter(user__is_staff=True)
        if self.value() == 'anonymous':
            return queryset.filter(user__isnull=True, anonymous_user__isnull=False)
        return queryset


# Add the custom filter to ProjectCommentAdmin
ProjectCommentAdmin.list_filter += (VerifiedCommentFilter,)