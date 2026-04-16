# engagement/admin.py
from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.db.models import Count
from django.contrib.auth import get_user_model
from .models import AnonymousCommenter, ProjectImage, ProjectComment, CommentReaction

User = get_user_model()

@admin.register(AnonymousCommenter)
class AnonymousCommenterAdmin(admin.ModelAdmin):
    list_display = ['id', 'display_name', 'session_id_short', 'comment_count', 'created_at']
    search_fields = ['display_name', 'session_id']
    readonly_fields = ['session_id', 'created_at']
    ordering = ['-created_at']
    
    fieldsets = (
        ('Anonymous User Information', {
            'fields': ('display_name', 'session_id')
        }),
        ('Activity', {
            'fields': ('comment_count_display', 'created_at'),
            'classes': ('collapse',)
        }),
    )
    
    def session_id_short(self, obj):
        return obj.session_id[:16] + '...' if obj.session_id else 'N/A'
    session_id_short.short_description = 'Session ID'
    
    def comment_count(self, obj):
        count = obj.comments.count()
        url = reverse('admin:engagement_projectcomment_changelist') + f'?anonymous_user__id={obj.id}'
        return format_html('<a href="{}" style="color: #22c55e; font-weight: bold;">{} comments</a>', url, count)
    comment_count.short_description = 'Comments'
    
    def comment_count_display(self, obj):
        return f"{obj.comments.count()} total comments"
    comment_count_display.short_description = 'Comment Statistics'


@admin.register(ProjectImage)
class ProjectImageAdmin(admin.ModelAdmin):
    list_display = ['id', 'project_link', 'image_preview', 'caption_short', 'is_primary', 'uploaded_by_display', 'created_at']
    list_filter = ['is_primary', 'created_at']
    search_fields = ['caption', 'project__title', 'project__code']
    readonly_fields = ['created_at', 'image_preview_large']
    ordering = ['-is_primary', '-created_at']
    
    fieldsets = (
        ('Project Information', {
            'fields': ('project', 'is_primary')
        }),
        ('Image Details', {
            'fields': ('image', 'image_preview_large', 'caption')
        }),
        ('Metadata', {
            'fields': ('uploaded_by', 'created_at'),
            'classes': ('collapse',)
        }),
    )
    
    def project_link(self, obj):
        url = reverse('admin:main_projectinitiative_change', args=[obj.project.id])
        return format_html('<a href="{}" style="font-weight: bold;">{}</a>', url, obj.project.title[:50])
    project_link.short_description = 'Project/Initiative'
    
    def caption_short(self, obj):
        return obj.caption[:50] + '...' if len(obj.caption) > 50 else obj.caption
    caption_short.short_description = 'Caption'
    
    def image_preview(self, obj):
        if obj.image:
            return format_html('<img src="{}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 8px;" />', obj.image.url)
        return 'No image'
    image_preview.short_description = 'Preview'
    
    def image_preview_large(self, obj):
        if obj.image:
            return format_html('<img src="{}" style="max-width: 300px; max-height: 300px; border-radius: 8px;" />', obj.image.url)
        return 'No image'
    image_preview_large.short_description = 'Image Preview'
    
    def uploaded_by_display(self, obj):
        if obj.uploaded_by:
            return format_html('<span style="color: #22c55e;">👤 {}</span>', obj.uploaded_by.full_name)
        return 'Unknown'
    uploaded_by_display.short_description = 'Uploaded By'
    
    actions = ['set_as_primary', 'remove_primary']
    
    def set_as_primary(self, request, queryset):
        for image in queryset:
            # Remove primary from other images in same project
            ProjectImage.objects.filter(project=image.project).update(is_primary=False)
            image.is_primary = True
            image.save()
        self.message_user(request, f'{queryset.count()} images set as primary.')
    set_as_primary.short_description = 'Set as primary image'
    
    def remove_primary(self, request, queryset):
        updated = queryset.update(is_primary=False)
        self.message_user(request, f'{updated} images removed from primary.')
    remove_primary.short_description = 'Remove primary status'


class CommentReactionInline(admin.TabularInline):
    model = CommentReaction
    extra = 0
    fields = ['reaction_type', 'user', 'anonymous_user', 'created_at']
    readonly_fields = ['created_at']
    can_delete = True
    show_change_link = True
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user', 'anonymous_user')


@admin.register(ProjectComment)
class ProjectCommentAdmin(admin.ModelAdmin):
    list_display = ['id', 'author_display', 'author_type_badge', 'project_link', 'content_preview', 'reaction_count', 'is_verified', 'created_at']
    list_filter = ['is_verified', 'created_at']
    search_fields = ['content', 'user__email', 'user__first_name', 'user__last_name', 'anonymous_user__display_name']
    readonly_fields = ['created_at', 'updated_at', 'reaction_stats', 'author_type_display']
    ordering = ['-created_at']
    inlines = [CommentReactionInline]
    
    fieldsets = (
        ('Comment Information', {
            'fields': ('project', 'parent', 'content')
        }),
        ('Author Information', {
            'fields': ('user', 'anonymous_user', 'author_type_display', 'location')
        }),
        ('Verification', {
            'fields': ('is_verified',),
            'classes': ('collapse',)
        }),
        ('Statistics', {
            'fields': ('reaction_stats', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def project_link(self, obj):
        url = reverse('admin:main_projectinitiative_change', args=[obj.project.id])
        return format_html('<a href="{}" style="font-weight: bold;">{}</a>', url, obj.project.title[:50])
    project_link.short_description = 'Project/Initiative'
    
    def author_display(self, obj):
        if obj.user:
            if obj.user.is_staff:
                # Use format_html to properly render HTML
                return format_html(
                    '<span style="color: #22c55e; font-weight: bold;">👤 {}</span> <span style="background-color: #22c55e; color: white; padding: 2px 6px; border-radius: 12px; font-size: 10px; margin-left: 4px;">STAFF</span>',
                    obj.user.full_name
                )
            return format_html('<span style="color: #3b82f6; font-weight: bold;">👤 {}</span>', obj.user.full_name)
        elif obj.anonymous_user:
            return format_html('<span style="color: #f59e0b; font-weight: bold;">🔒 {}</span>', obj.anonymous_user.display_name)
        return 'Unknown'
    author_display.short_description = 'Author'
    
    def author_type_badge(self, obj):
        if obj.user:
            if obj.user.is_staff:
                return format_html('<span style="background-color: #22c55e; color: white; padding: 2px 8px; border-radius: 12px; font-size: 10px;">Staff</span>')
            return format_html('<span style="background-color: #3b82f6; color: white; padding: 2px 8px; border-radius: 12px; font-size: 10px;">Registered</span>')
        return format_html('<span style="background-color: #f59e0b; color: white; padding: 2px 8px; border-radius: 12px; font-size: 10px;">Anonymous</span>')
    author_type_badge.short_description = 'Type'
    
    def content_preview(self, obj):
        content = obj.content[:100]
        if len(obj.content) > 100:
            content += '...'
        return content
    content_preview.short_description = 'Comment'
    
    def reaction_count(self, obj):
        count = obj.reactions.count()
        if count > 0:
            return format_html('<span style="background-color: #e0e7ff; padding: 2px 8px; border-radius: 12px; font-weight: bold;">👍 {} reactions</span>', count)
        return '0'
    reaction_count.short_description = 'Reactions'
    
    def reaction_stats(self, obj):
        reactions = obj.reactions.values('reaction_type').annotate(count=Count('reaction_type'))
        if not reactions:
            return 'No reactions yet'
        
        reaction_icons = {
            'agree': '👍',
            'disagree': '👎',
            'like': '❤️',
            'helpful': '💡',
            'report': '🚩'
        }
        
        html = '<div style="display: flex; gap: 8px; flex-wrap: wrap;">'
        for reaction in reactions:
            icon = reaction_icons.get(reaction['reaction_type'], '📌')
            html += f'<span style="background-color: #f3f4f6; padding: 4px 8px; border-radius: 8px; font-size: 12px;">{icon} {reaction["count"]}</span>'
        html += '</div>'
        return format_html(html)
    reaction_stats.short_description = 'Reaction Statistics'
    
    def author_type_display(self, obj):
        if obj.user:
            if obj.user.is_staff:
                return format_html('<span style="color: #22c55e;">👑 Staff User (Verified)</span>')
            return format_html('<span style="color: #3b82f6;">✓ Registered User</span>')
        return format_html('<span style="color: #f59e0b;">○ Anonymous User</span>')
    author_type_display.short_description = 'Author Type'
    
    actions = ['verify_comments', 'unverify_comments', 'delete_selected_comments']
    
    def verify_comments(self, request, queryset):
        updated = queryset.update(is_verified=True)
        self.message_user(request, f'{updated} comments were marked as verified.')
    verify_comments.short_description = 'Verify selected comments'
    
    def unverify_comments(self, request, queryset):
        updated = queryset.update(is_verified=False)
        self.message_user(request, f'{updated} comments were unverified.')
    unverify_comments.short_description = 'Unverify selected comments'
    
    def delete_selected_comments(self, request, queryset):
        count = queryset.count()
        queryset.delete()
        self.message_user(request, f'{count} comments were successfully deleted.')
    delete_selected_comments.short_description = 'Delete selected comments'


@admin.register(CommentReaction)
class CommentReactionAdmin(admin.ModelAdmin):
    list_display = ['id', 'comment_link', 'user_display', 'reaction_type', 'created_at']
    list_filter = ['reaction_type', 'created_at']
    search_fields = ['comment__content', 'user__email', 'anonymous_user__display_name']
    readonly_fields = ['created_at']
    ordering = ['-created_at']
    
    fieldsets = (
        ('Reaction Information', {
            'fields': ('comment', 'reaction_type')
        }),
        ('User Information', {
            'fields': ('user', 'anonymous_user')
        }),
        ('Metadata', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )
    
    def comment_link(self, obj):
        url = reverse('admin:engagement_projectcomment_change', args=[obj.comment.id])
        return format_html('<a href="{}">{}</a>', url, obj.comment.content[:50])
    comment_link.short_description = 'Comment'
    
    def user_display(self, obj):
        if obj.user:
            return format_html('<span style="color: #22c55e;">👤 {}</span>', obj.user.full_name)
        elif obj.anonymous_user:
            return format_html('<span style="color: #f59e0b;">🔒 {}</span>', obj.anonymous_user.display_name)
        return 'Unknown'
    user_display.short_description = 'User'


# Custom admin site configuration
admin.site.site_header = 'PTS Engagement Portal Admin'
admin.site.site_title = 'PTS Engagement Admin'
admin.site.index_title = 'Welcome to Performance Tracking System Engagement Portal'