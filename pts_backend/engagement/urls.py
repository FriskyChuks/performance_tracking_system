# engagement/urls.py
from django.urls import path
from . import views

urlpatterns = [
    # Public endpoints
    path('public/activities/<int:activity_id>/images/', views.PublicProjectImagesView.as_view(), name='public-images'),
    path('public/activities/<int:activity_id>/comments/', views.PublicProjectCommentsView.as_view(), name='public-comments'),
    path('public/comments/<int:comment_id>/replies/', views.PublicProjectCommentRepliesView.as_view(), name='public-replies'),
    path('public/map/activities/', views.PublicProjectActivitiesMapView.as_view(), name='public-map'),
    
    # Reactions
    path('reactions/', views.CommentReactionView.as_view(), name='reaction-create'),
    path('reactions/comments/<int:comment_id>/', views.CommentReactionDeleteView.as_view(), name='reaction-delete'),
    
    # Image management (authenticated)
    path('images/upload/', views.ProjectImageUploadView.as_view(), name='image-upload'),
    path('images/<int:pk>/set-primary/', views.ProjectImageSetPrimaryView.as_view(), name='image-set-primary'),
    path('images/<int:pk>/', views.ProjectImageDeleteView.as_view(), name='image-delete'),
    
    # Follow functionality
    path('follow/<int:activity_id>/', views.FollowProjectActivityView.as_view(), name='follow'),
    path('unfollow/<int:activity_id>/', views.UnfollowProjectActivityView.as_view(), name='unfollow'),
    path('my-follows/', views.UserFollowedActivitiesView.as_view(), name='my-follows'),
    
    # Moderation (staff only)
    path('moderate/comments/<int:pk>/', views.ModerateCommentView.as_view(), name='moderate-comment'),
]