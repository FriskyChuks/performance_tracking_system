# engagement/serializers.py
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import AnonymousCommenter, ProjectImage, ProjectComment, CommentReaction
from main.models import ProjectInitiative

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

# ProjectImageSerializer for upload
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
    

# engagement/serializers.py - Complete corrected PublicProjectSerializer
class PublicProjectSerializer(serializers.ModelSerializer):
    """Simplified project serializer for public view - Updated for ProjectInitiative"""
    images = serializers.SerializerMethodField()
    comment_count = serializers.SerializerMethodField()
    
    # Department and Agency names
    department_name = serializers.CharField(source='department.name', read_only=True, allow_null=True)
    agency_name = serializers.CharField(source='agency.name', read_only=True, allow_null=True)
    
    # Priority Area info
    priority_area_name = serializers.CharField(source='priority_area.name', read_only=True, allow_null=True)
    
    # Status display
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    performance_rating_display = serializers.SerializerMethodField()
    
    class Meta:
        model = ProjectInitiative
        fields = [
            'id', 'initiative_type', 'title', 'description', 'code',
            'department', 'department_name', 'agency', 'agency_name',
            'priority_area', 'priority_area_name',
            'status', 'status_display', 'start_date', 'end_date',
            'target_value', 'actual_value', 'unit_of_measure', 'progress_percentage',
            'performance_rating', 'performance_rating_display',
            'latitude', 'longitude',
            'images', 'comment_count', 'created_at'
        ]
    
    def get_images(self, obj):
        """Get images with absolute URLs"""
        request = self.context.get('request')
        images_data = []
        
        for img in obj.images.all():
            image_dict = {
                'id': img.id,
                'caption': img.caption,
                'is_primary': img.is_primary,
                'created_at': img.created_at
            }
            # Build absolute URL
            if img.image:
                if request:
                    image_dict['image'] = request.build_absolute_uri(img.image.url)
                    image_dict['image_url'] = request.build_absolute_uri(img.image.url)
                else:
                    image_dict['image'] = img.image.url
                    image_dict['image_url'] = img.image.url
            images_data.append(image_dict)
        
        return images_data
    
    def get_comment_count(self, obj):
        return obj.comments.count()
    
    def get_performance_rating_display(self, obj):
        """Get human-readable performance rating"""
        ratings = {
            5: 'Excellent',
            4: 'Very Good',
            3: 'Good',
            2: 'Fair',
            1: 'Poor'
        }
        return ratings.get(obj.performance_rating, 'Not Rated')