# engagement/views.py
from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from django.db.models import Q, Count
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from rest_framework.parsers import MultiPartParser, FormParser

from main.models import Project
from .models import AnonymousCommenter, ProjectComment, CommentReaction,ProjectImage
from .serializers import (
    ProjectCommentSerializer, PublicProjectSerializer, 
    ProjectImageSerializer, AnonymousCommenterSerializer, ProjectImageUploadSerializer, ProjectImageSerializer
)
import uuid

User = get_user_model()

class PublicProjectListView(generics.ListAPIView):
    """List all projects for public view"""
    serializer_class = PublicProjectSerializer
    permission_classes = [AllowAny]
    
    def get_queryset(self):
        queryset = Project.objects.all()
        
        year = self.request.query_params.get('year')
        if year:
            queryset = queryset.filter(year=year)
        
        ministry = self.request.query_params.get('ministry')
        if ministry:
            queryset = queryset.filter(deliverable__priority_area__ministry__title__icontains=ministry)
        
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(outcome__icontains=search) |
                Q(indicator__icontains=search)
            )
        
        order_by = self.request.query_params.get('order_by', '-created_at')
        queryset = queryset.order_by(order_by)
        
        return queryset

class PublicProjectDetailView(generics.RetrieveAPIView):
    """Get single project with all details"""
    queryset = Project.objects.all()
    serializer_class = PublicProjectSerializer
    permission_classes = [AllowAny]
    lookup_field = 'id'

class ProjectCommentListView(generics.ListCreateAPIView):
    """List and create comments for a project"""
    serializer_class = ProjectCommentSerializer
    permission_classes = [AllowAny]
    
    def get_queryset(self):
        project_id = self.kwargs.get('project_id')
        return ProjectComment.objects.filter(
            project_id=project_id, 
            parent__isnull=True
        ).select_related('user', 'anonymous_user')
    
    def create(self, request, *args, **kwargs):
        project_id = self.kwargs.get('project_id')
        project = get_object_or_404(Project, id=project_id)
        
        user = None
        anonymous_user = None
        
        # Check if user is authenticated (logged in)
        if request.user and request.user.is_authenticated:
            user = request.user
            # Update user's comment count
            user.comment_count += 1
            user.save(update_fields=['comment_count'])
        else:
            # Anonymous user
            session_id = request.data.get('session_id', str(uuid.uuid4()))
            display_name = request.data.get('display_name', 'Anonymous')
            anonymous_user, created = AnonymousCommenter.objects.get_or_create(
                session_id=session_id,
                defaults={'display_name': display_name}
            )
            if not created and display_name != 'Anonymous':
                anonymous_user.display_name = display_name
                anonymous_user.save()
        
        # Apply rate limiting for anonymous users
        if not user:
            from django.utils import timezone
            from datetime import timedelta
            
            today = timezone.now().date()
            comments_today = ProjectComment.objects.filter(
                anonymous_user=anonymous_user,
                created_at__date=today
            ).count()
            
            if comments_today >= 3:  # Limit anonymous users to 3 comments per day
                return Response(
                    {'error': 'Daily comment limit reached. Please register to continue commenting.'},
                    status=status.HTTP_429_TOO_MANY_REQUESTS
                )
        
        # Create the comment
        comment = ProjectComment.objects.create(
            project=project,
            user=user,
            anonymous_user=anonymous_user,
            content=request.data.get('content'),
            location=request.data.get('location', ''),
            parent_id=request.data.get('parent_id'),
            is_verified=user.is_staff if user else False  # Staff comments are auto-verified
        )
        
        serializer = self.get_serializer(comment)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class CommentReactionView(generics.CreateAPIView):
    """Add reaction to a comment"""
    permission_classes = [AllowAny]
    
    def create(self, request, *args, **kwargs):
        comment_id = self.kwargs.get('comment_id')
        comment = get_object_or_404(ProjectComment, id=comment_id)
        reaction_type = request.data.get('reaction_type')
        
        if not reaction_type:
            return Response({'error': 'reaction_type required'}, status=status.HTTP_400_BAD_REQUEST)
        
        user = None
        anonymous_user = None
        
        # Check if authenticated user
        if request.user and request.user.is_authenticated:
            user = request.user
        else:
            session_id = request.data.get('session_id', str(uuid.uuid4()))
            anonymous_user, _ = AnonymousCommenter.objects.get_or_create(session_id=session_id)
        
        # Check for existing reaction
        existing_reaction = None
        if user:
            existing_reaction = CommentReaction.objects.filter(
                comment=comment, user=user
            ).first()
        elif anonymous_user:
            existing_reaction = CommentReaction.objects.filter(
                comment=comment, anonymous_user=anonymous_user
            ).first()
        
        if existing_reaction:
            # Remove existing reaction (toggle)
            existing_reaction.delete()
            return Response({'message': 'Reaction removed'}, status=status.HTTP_200_OK)
        
        # Create new reaction
        reaction = CommentReaction.objects.create(
            comment=comment,
            user=user,
            anonymous_user=anonymous_user,
            reaction_type=reaction_type
        )
        
        return Response({'message': 'Reaction added'}, status=status.HTTP_201_CREATED)

class RegisterPublicUserView(generics.CreateAPIView):
    """Register a public user (creates regular User account)"""
    permission_classes = [AllowAny]
    
    def create(self, request, *args, **kwargs):
        email = request.data.get('email')
        full_name = request.data.get('full_name', '')
        password = request.data.get('password')
        location = request.data.get('location', '')
        
        if not email or not password:
            return Response({'error': 'Email and password required'}, status=status.HTTP_400_BAD_REQUEST)
        
        if User.objects.filter(email=email).exists():
            return Response({'error': 'Email already registered'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Split full name into first and last name
        name_parts = full_name.split(' ', 1)
        first_name = name_parts[0]
        last_name = name_parts[1] if len(name_parts) > 1 else ''
        
        # Create user (regular user, not staff)
        user = User.objects.create_user(
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
            location=location,
            is_public_only=True,
            is_staff=False
        )
        
        return Response({
            'message': 'Registration successful',
            'user': {
                'id': user.id,
                'email': user.email,
                'full_name': user.full_name
            }
        }, status=status.HTTP_201_CREATED)
    

@api_view(['GET'])
@permission_classes([AllowAny])
def get_rate_limit(request):
    """Get remaining comments for anonymous user"""
    session_id = request.query_params.get('session_id')
    
    if not session_id:
        return Response({'remaining': 3, 'reset_time': None})
    
    from django.utils import timezone
    from datetime import timedelta
    
    today = timezone.now().date()
    anonymous_user = AnonymousCommenter.objects.filter(session_id=session_id).first()
    
    if anonymous_user:
        comments_today = ProjectComment.objects.filter(
            anonymous_user=anonymous_user,
            created_at__date=today
        ).count()
        remaining = max(0, 3 - comments_today)
        
        # Calculate reset time (end of day)
        reset_time = timezone.now().replace(hour=23, minute=59, second=59)
        
        return Response({
            'remaining': remaining,
            'reset_time': reset_time.isoformat()
        })
    
    return Response({'remaining': 3, 'reset_time': None})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_project_image(request, project_id):
    """Upload an image for a project"""
    try:
        project = Project.objects.get(id=project_id)
    except Project.DoesNotExist:
        return Response({'error': 'Project not found'}, status=status.HTTP_404_NOT_FOUND)
    
    # Check if user has permission
    if not (request.user.is_staff or request.user.is_superuser):
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
    
    # Check image limit (max 4 images per project)
    current_images = project.images.count()
    if current_images >= 4:
        return Response({'error': 'Maximum 4 images allowed per project'}, status=status.HTTP_400_BAD_REQUEST)
    
    serializer = ProjectImageUploadSerializer(data=request.data)
    if serializer.is_valid():
        # If this is the first image, make it primary
        is_primary = current_images == 0
        
        image = serializer.save(
            project=project,
            uploaded_by=request.user,
            is_primary=is_primary
        )
        
        return Response(ProjectImageSerializer(image, context={'request': request}).data, 
                       status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_project_image(request, image_id):
    """Delete a project image"""
    try:
        image = ProjectImage.objects.get(id=image_id)
    except ProjectImage.DoesNotExist:
        return Response({'error': 'Image not found'}, status=status.HTTP_404_NOT_FOUND)
    
    # Check if user has permission
    if not (request.user.is_staff or request.user.is_superuser):
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
    
    # If deleting primary image, set another image as primary
    was_primary = image.is_primary
    image.delete()
    
    if was_primary:
        # Set the first remaining image as primary
        remaining_images = ProjectImage.objects.filter(project=image.project)
        if remaining_images.exists():
            first_image = remaining_images.first()
            first_image.is_primary = True
            first_image.save()
    
    return Response({'message': 'Image deleted successfully'}, status=status.HTTP_200_OK)

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def set_primary_image(request, image_id):
    """Set an image as the primary image for its project"""
    try:
        image = ProjectImage.objects.get(id=image_id)
    except ProjectImage.DoesNotExist:
        return Response({'error': 'Image not found'}, status=status.HTTP_404_NOT_FOUND)
    
    # Check if user has permission
    if not (request.user.is_staff or request.user.is_superuser):
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
    
    # Remove primary flag from all project images
    ProjectImage.objects.filter(project=image.project).update(is_primary=False)
    
    # Set this image as primary
    image.is_primary = True
    image.save()
    
    return Response({'message': 'Primary image updated'}, status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([AllowAny])
def get_project_images(request, project_id):
    """Get all images for a project"""
    try:
        project = Project.objects.get(id=project_id)
    except Project.DoesNotExist:
        return Response({'error': 'Project not found'}, status=status.HTTP_404_NOT_FOUND)
    
    images = project.images.all()
    serializer = ProjectImageSerializer(images, many=True, context={'request': request})
    return Response(serializer.data)