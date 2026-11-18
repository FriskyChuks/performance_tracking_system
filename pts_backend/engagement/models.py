# engagement/models.py
from django.db import models
from django.conf import settings
from django.core.validators import FileExtensionValidator, MinValueValidator, MaxValueValidator

class AnonymousCommenter(models.Model):
    """For anonymous comments - for non-registered users"""
    session_id = models.CharField(max_length=100, unique=True)
    display_name = models.CharField(max_length=100, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Anonymous - {self.display_name or self.session_id[:8]}"
    
    class Meta:
        verbose_name = "Anonymous Commenter"
        verbose_name_plural = "Anonymous Commenters"

class ProjectImage(models.Model):
    """Images uploaded for a project activity"""
    # Updated to reference ProjectActivity instead of ProjectInitiative
    project_activity = models.ForeignKey(
        'main.ProjectActivity', 
        on_delete=models.CASCADE, 
        related_name='images'
    )
    image = models.ImageField(
        upload_to='project_images/%Y/%m/%d/', 
        validators=[FileExtensionValidator(['jpg', 'jpeg', 'png', 'webp'])]
    )
    caption = models.CharField(max_length=500, blank=True)
    is_primary = models.BooleanField(default=False)
    
    # Which quarter this image belongs to (if applicable)
    quarter = models.IntegerField(null=True, blank=True, choices=[(1, 'Q1'), (2, 'Q2'), (3, 'Q3'), (4, 'Q4')])
    year = models.IntegerField(null=True, blank=True)
    
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        related_name='uploaded_images'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Image for {self.project_activity.title[:50]}"
    
    class Meta:
        ordering = ['-is_primary', '-created_at']

class QuarterlyDocument(models.Model):
    """Internal supporting documents for quarterly reports"""
    quarterly_progress = models.ForeignKey('main.IndicatorQuarterlyProgress', on_delete=models.CASCADE, related_name='documents')
    document = models.FileField(upload_to='quarterly_docs/%Y/%m/%d/')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

class ProjectComment(models.Model):
    """Comments from users (both registered and anonymous) on project activities"""
    # Updated to reference ProjectActivity
    project_activity = models.ForeignKey(
        'main.ProjectActivity', 
        on_delete=models.CASCADE, 
        related_name='comments'
    )
    
    # Registered user from accounts.User
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='engagement_comments'
    )
    
    # Anonymous user (for non-registered commenters)
    anonymous_user = models.ForeignKey(
        AnonymousCommenter, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='comments'
    )
    
    # For nested comments (replies)
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='replies')
    
    content = models.TextField()
    is_verified = models.BooleanField(default=False)  # For truthfulness verification
    location = models.CharField(max_length=250, blank=True, null=True)  # User's stated location
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        if self.user:
            author = self.user.full_name
        elif self.anonymous_user:
            author = self.anonymous_user.display_name or "Anonymous"
        else:
            author = "Unknown"
        return f"{author} on {self.project_activity.title[:30]}"
    
    @property
    def author_name(self):
        if self.user:
            return self.user.display_name
        elif self.anonymous_user:
            return self.anonymous_user.display_name or "Anonymous"
        return "Guest"
    
    @property
    def author_type(self):
        if self.user:
            if self.user.is_staff:
                return "staff"
            return "registered"
        return "anonymous"
    
    @property
    def is_staff_comment(self):
        return self.user and self.user.is_staff
    
    class Meta:
        ordering = ['-created_at']

class CommentReaction(models.Model):
    """Reactions to comments (like, agree, disagree, etc.)"""
    REACTION_TYPES = [
        ('like', '👍 Like'),
        ('agree', '✅ Agree'),
        ('disagree', '❌ Disagree'),
        ('helpful', '💡 Helpful'),
        ('report', '🚩 Report'),
    ]
    
    comment = models.ForeignKey(ProjectComment, on_delete=models.CASCADE, related_name='reactions')
    
    # Registered user from accounts.User
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='comment_reactions'
    )
    
    # Anonymous user
    anonymous_user = models.ForeignKey(
        AnonymousCommenter, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='reactions'
    )
    
    session_id = models.CharField(max_length=100, blank=True, null=True)
    reaction_type = models.CharField(max_length=20, choices=REACTION_TYPES)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = [
            ['comment', 'user'],
            ['comment', 'anonymous_user'],
            ['comment', 'session_id']
        ]
    
    def __str__(self):
        if self.user:
            user_display = self.user.full_name
        elif self.anonymous_user:
            user_display = self.anonymous_user.display_name or "Anonymous"
        else:
            user_display = "Unknown"
        return f"{self.reaction_type} from {user_display}"

class ProjectActivityFollow(models.Model):
    """Users can follow project activities to get updates"""
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='followed_activities'
    )
    project_activity = models.ForeignKey(
        'main.ProjectActivity', 
        on_delete=models.CASCADE, 
        related_name='followers'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['user', 'project_activity']
    
    def __str__(self):
        return f"{self.user.full_name} follows {self.project_activity.title}"