# engagement/views.py
from amqp import NotFound
from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from django.db import models
from .models import ProjectImage, ProjectComment, CommentReaction, ProjectActivityFollow
from .serializers import *
from main.models import ProjectActivity


# ==================== Helper Functions ====================
def _can_modify_activity_images(user, activity):
    """(i) Only the DO assigned to this activity's dept/agency, or super_admin."""
    if not user or not user.is_authenticated:
        return False
    if user.is_superuser or getattr(user, 'role', None) == 'super_admin':
        return True
    if getattr(user, 'role', None) != 'delivery_officer':
        return False
    if user.assigned_department and activity.department_id == user.assigned_department_id:
        return True
    if user.assigned_agency and activity.agency_id == user.assigned_agency_id:
        return True
    return False

# ==================== Public Views (No Auth) ====================
class PublicProjectImagesView(generics.ListAPIView):
    """Public: List images for a project activity"""
    serializer_class = ProjectImageSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        activity_id = self.kwargs.get('activity_id')
        return ProjectImage.objects.filter(project_activity_id=activity_id)


class PublicProjectCommentsView(generics.ListCreateAPIView):
    """Public: List and create comments for a project activity"""
    serializer_class = ProjectCommentSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        activity_id = self.kwargs.get('activity_id')
        return ProjectComment.objects.filter(
            project_activity_id=activity_id,
            parent__isnull=True
        ).prefetch_related('reactions')
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return CreateCommentSerializer
        return ProjectCommentSerializer
    
    def perform_create(self, serializer):
        session_id = self.request.META.get('HTTP_SESSION_ID')
        serializer.save(
            session_id=session_id,
            display_name=self.request.data.get('display_name')
        )
        

class PublicProjectCommentRepliesView(generics.ListAPIView):
    """Public: List replies for a comment"""
    serializer_class = ProjectCommentSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        comment_id = self.kwargs.get('comment_id')
        return ProjectComment.objects.filter(parent_id=comment_id)

class PublicProjectActivitiesMapView(generics.ListAPIView):
    """Public: Get project activities with coordinates for map"""
    serializer_class = ProjectActivityListSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        return ProjectActivity.objects.filter(
            status='ongoing',
            latitude__isnull=False,
            longitude__isnull=False
        )

# ==================== Protected Views (Auth Required) ====================

class ProjectImageUploadView(generics.CreateAPIView):
    """Delivery Officer: Upload images for activities in their own dept/agency."""
    serializer_class = ProjectImageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        activity_id = request.data.get('project_activity')
        if not activity_id:
            return Response(
                {'project_activity': 'This field is required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        activity = ProjectActivity.objects.filter(pk=activity_id).first()
        if not activity:
            return Response(
                {'project_activity': 'Activity not found.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not _can_modify_activity_images(request.user, activity):
            return Response(
                {'detail': 'You can only upload images to activities assigned to your department or agency.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        serializer.save(uploaded_by=self.request.user)

class ProjectImageDeleteView(generics.DestroyAPIView):
    """Delete a project image (scoped to the requester's assigned dept/agency)."""
    serializer_class = ProjectImageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        image = generics.get_object_or_404(ProjectImage, pk=self.kwargs.get('pk'))
        if not _can_modify_activity_images(self.request.user, image.project_activity):
            raise permissions.PermissionDenied(
                'You can only delete images on activities assigned to your department or agency.'
            )
        return image

class ProjectImageSetPrimaryView(generics.UpdateAPIView):
    """Set an image as primary for its activity (DO-scoped, super_admin bypass)."""
    serializer_class = ProjectImageSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ['patch']

    def get_object(self):
        image = generics.get_object_or_404(ProjectImage, pk=self.kwargs.get('pk'))
        if not _can_modify_activity_images(self.request.user, image.project_activity):
            raise permissions.PermissionDenied(
                'You can only modify images on activities assigned to your department or agency.'
            )
        return image

    def patch(self, request, *args, **kwargs):
        image = self.get_object()
        activity = image.project_activity

        ProjectImage.objects.filter(
            project_activity=activity
        ).exclude(pk=image.pk).update(is_primary=False)

        image.is_primary = True
        image.save(update_fields=['is_primary'])

        return Response(
            ProjectImageSerializer(image, context={'request': request}).data,
            status=status.HTTP_200_OK,
        )

class CommentReactionView(generics.CreateAPIView):
    """Create/update reaction to a comment"""
    serializer_class = CommentReactionSerializer
    permission_classes = [permissions.AllowAny]  # Allow anonymous users
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        # Get session_id from headers
        session_id = self.request.META.get('HTTP_SESSION_ID')
        context['session_id'] = session_id
        return context
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)


class CommentReactionDeleteView(generics.DestroyAPIView):
    """Remove reaction from a comment"""
    permission_classes = [permissions.AllowAny]
    
    def get_object(self):
        comment_id = self.kwargs.get('comment_id')
        session_id = self.request.META.get('HTTP_SESSION_ID')
        
        # Try to find the reaction
        if self.request.user.is_authenticated:
            return CommentReaction.objects.get(
                comment_id=comment_id,
                user=self.request.user
            )
        elif session_id:
            return CommentReaction.objects.get(
                comment_id=comment_id,
                session_id=session_id
            )
        raise NotFound("Reaction not found")

class FollowProjectActivityView(generics.CreateAPIView):
    """User follows a project activity"""
    serializer_class = ProjectActivityFollowSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class UnfollowProjectActivityView(generics.DestroyAPIView):
    """User unfollows a project activity"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        activity_id = self.kwargs.get('activity_id')
        return ProjectActivityFollow.objects.get(
            project_activity_id=activity_id,
            user=self.request.user
        )

class UserFollowedActivitiesView(generics.ListAPIView):
    """List project activities user follows"""
    serializer_class = ProjectActivityListSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return ProjectActivity.objects.filter(
            followers__user=self.request.user
        )

# ==================== Staff Moderation Views ====================

class ModerateCommentView(generics.UpdateAPIView):
    """Staff: Verify or delete comments"""
    queryset = ProjectComment.objects.all()
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]
    
    def patch(self, request, *args, **kwargs):
        comment = self.get_object()
        action = request.data.get('action')
        
        if action == 'verify':
            comment.is_verified = True
            comment.save()
            return Response({'message': 'Comment verified'})
        elif action == 'delete':
            comment.delete()
            return Response({'message': 'Comment deleted'})
        
        return Response({'error': 'Invalid action'}, status=status.HTTP_400_BAD_REQUEST)