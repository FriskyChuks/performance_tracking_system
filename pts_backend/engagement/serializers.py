# engagement/serializers.py
from rest_framework import serializers
from django.db import models
from .models import AnonymousCommenter, ProjectImage, ProjectComment, CommentReaction, ProjectActivityFollow
from main.serializers import ProjectActivityListSerializer

class ProjectImageSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.CharField(source='uploaded_by.full_name', read_only=True)
    
    class Meta:
        model = ProjectImage
        fields = ['id', 'project_activity', 'image', 'caption', 'is_primary', 
                  'quarter', 'year', 'uploaded_by', 'uploaded_by_name', 'created_at']
        read_only_fields = ['created_at']

class AnonymousCommenterSerializer(serializers.ModelSerializer):
    class Meta:
        model = AnonymousCommenter
        fields = ['id', 'session_id', 'display_name', 'created_at']


# engagement/serializers.py - Update ProjectCommentSerializer

class ProjectCommentSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(read_only=True)
    author_type = serializers.CharField(read_only=True)
    is_staff_comment = serializers.BooleanField(read_only=True)
    replies = serializers.SerializerMethodField()
    reaction_counts = serializers.SerializerMethodField()
    user_reaction = serializers.SerializerMethodField()
    reactions = serializers.SerializerMethodField()  # Add this to include all reactions
    
    class Meta:
        model = ProjectComment
        fields = [
            'id', 'project_activity', 'user', 'anonymous_user', 'parent',
            'content', 'author_name', 'author_type', 'is_staff_comment',
            'location', 'is_verified', 'replies', 'reactions', 'reaction_counts',
            'user_reaction', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'is_verified']
    
    def get_replies(self, obj):
        if obj.replies.exists():
            return ProjectCommentSerializer(obj.replies.all(), many=True, context=self.context).data
        return []
    
    def get_reactions(self, obj):
        """Get all reactions for this comment"""
        from .serializers import CommentReactionSerializer
        return CommentReactionSerializer(obj.reactions.all(), many=True).data
    
    def get_reaction_counts(self, obj):
        reactions = obj.reactions.values('reaction_type').annotate(count=models.Count('reaction_type'))
        result = {}
        for r in reactions:
            result[r['reaction_type']] = r['count']
        # Ensure all reaction types are present even if count is 0
        for reaction_type in ['agree', 'disagree', 'like', 'helpful', 'report']:
            if reaction_type not in result:
                result[reaction_type] = 0
        return result
    
    def get_user_reaction(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            reaction = obj.reactions.filter(user=request.user).first()
            if reaction:
                return reaction.reaction_type
        return None

class CreateCommentSerializer(serializers.ModelSerializer):
    session_id = serializers.CharField(required=False, write_only=True)
    display_name = serializers.CharField(required=False, write_only=True)
    
    class Meta:
        model = ProjectComment
        fields = ['project_activity', 'parent', 'content', 'location', 'session_id', 'display_name']
    
    def create(self, validated_data):
        session_id = validated_data.pop('session_id', None)
        display_name = validated_data.pop('display_name', None)
        request = self.context.get('request')
        
        if request and request.user.is_authenticated:
            validated_data['user'] = request.user
        elif session_id:
            anonymous_user, _ = AnonymousCommenter.objects.get_or_create(
                session_id=session_id,
                defaults={'display_name': display_name}
            )
            validated_data['anonymous_user'] = anonymous_user
        
        return super().create(validated_data)


# engagement/serializers.py - Update CommentReactionSerializer

class CommentReactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = CommentReaction
        fields = ['id', 'comment', 'reaction_type']
    
    def validate(self, data):
        # Validate that comment exists
        if not data.get('comment'):
            raise serializers.ValidationError({"comment": "Comment is required"})
        return data
    
    def create(self, validated_data):
        request = self.context.get('request')
        session_id = self.context.get('session_id')
        
        # Determine the user/session
        if request and request.user.is_authenticated:
            validated_data['user'] = request.user
        elif session_id:
            validated_data['session_id'] = session_id
        else:
            raise serializers.ValidationError("Authentication required")
        
        # Remove existing reaction if any
        existing = None
        if validated_data.get('user'):
            existing = CommentReaction.objects.filter(
                comment=validated_data['comment'],
                user=validated_data['user']
            ).first()
        elif validated_data.get('session_id'):
            existing = CommentReaction.objects.filter(
                comment=validated_data['comment'],
                session_id=validated_data['session_id']
            ).first()
        
        if existing:
            # Update existing reaction
            existing.reaction_type = validated_data['reaction_type']
            existing.save()
            return existing
        
        return super().create(validated_data)

class ProjectActivityFollowSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectActivityFollow
        fields = ['id', 'project_activity', 'created_at']
        read_only_fields = ['created_at']
    
    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)