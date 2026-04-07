# engagement/serializers.py
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import AnonymousCommenter, ProjectImage, ProjectComment, CommentReaction
from main.models import Project

User = get_user_model()

class UserInfoSerializer(serializers.ModelSerializer):
    """Basic user info for comments"""
    class Meta:
        model = User
        fields = ['id', 'full_name', 'display_name', 'is_staff']

class AnonymousCommenterSerializer(serializers.ModelSerializer):
    class Meta:
        model = AnonymousCommenter
        fields = ['id', 'display_name']

# ProjectImageSerializer is used for both upload and retrieval, but we can have a separate serializer for uploads if needed
class ProjectImageUploadSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectImage
        fields = ['id', 'image', 'caption', 'is_primary', 'created_at']
    
    def validate_image(self, value):
        """Validate image size and format"""
        if value.size > 5 * 1024 * 1024:  # 5MB limit
            raise serializers.ValidationError("Image size cannot exceed 5MB")
        return value

class ProjectImageSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()
    thumbnail_url = serializers.SerializerMethodField()
    
    class Meta:
        model = ProjectImage
        fields = ['id', 'image', 'image_url', 'thumbnail_url', 'caption', 'is_primary', 'created_at']
    
    def get_image_url(self, obj):
        request = self.context.get('request')
        if obj.image and request:
            return request.build_absolute_uri(obj.image.url)
        return obj.image.url if obj.image else None
    
    def get_thumbnail_url(self, obj):
        request = self.context.get('request')
        # You can add thumbnail generation logic here
        if obj.image and request:
            return request.build_absolute_uri(obj.image.url)
        return obj.image.url if obj.image else None

class CommentReactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = CommentReaction
        fields = ['id', 'reaction_type', 'created_at']

class ProjectCommentSerializer(serializers.ModelSerializer):
    reactions = CommentReactionSerializer(many=True, read_only=True)
    replies = serializers.SerializerMethodField()
    reply_count = serializers.SerializerMethodField()
    author_name = serializers.ReadOnlyField()
    author_type = serializers.ReadOnlyField()
    is_staff_comment = serializers.ReadOnlyField()
    user_info = UserInfoSerializer(source='user', read_only=True)
    
    class Meta:
        model = ProjectComment
        fields = ['id', 'project', 'parent', 'content', 'author_name', 'author_type', 
                  'is_staff_comment', 'is_verified', 'location', 'user_info', 
                  'reactions', 'replies', 'reply_count', 'created_at']
        read_only_fields = ['created_at']
    
    def get_replies(self, obj):
        """Get nested replies for this comment"""
        replies = obj.replies.all()
        return ProjectCommentSerializer(replies, many=True, context=self.context).data
    
    def get_reply_count(self, obj):
        return obj.replies.count()

class PublicProjectSerializer(serializers.ModelSerializer):
    """Simplified project serializer for public view"""
    images = ProjectImageSerializer(many=True, read_only=True)
    comment_count = serializers.SerializerMethodField()
    ministry_name = serializers.CharField(source='deliverable.priority_area.ministry.title', read_only=True)
    priority_area_name = serializers.CharField(source='deliverable.priority_area.title', read_only=True)
    deliverable_name = serializers.CharField(source='deliverable.title', read_only=True)
    
    class Meta:
        model = Project
        fields = ['id', 'outcome', 'indicator', 'year', 'quarter', 'performance_rating',
                  'images', 'comment_count', 'ministry_name', 'priority_area_name', 
                  'deliverable_name', 'actual_data', 'target_data']
    
    def get_comment_count(self, obj):
        return obj.comments.count()