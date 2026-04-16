# engagement/urls.py
from django.urls import path
from . import views

urlpatterns = [
    # Public initiative/project views
    path('initiatives/', views.PublicProjectListView.as_view(), name='public-initiatives'),
    path('initiatives/<int:id>/', views.PublicProjectDetailView.as_view(), name='public-initiative-detail'),
    
    # Comment views
    path('initiatives/<int:initiative_id>/comments/', views.ProjectCommentListView.as_view(), name='initiative-comments'),
    path('comments/<int:comment_id>/react/', views.CommentReactionView.as_view(), name='comment-react'),
    
    # User registration
    path('register/', views.RegisterPublicUserView.as_view(), name='register-public-user'),
    
    # Rate limit
    path('rate-limit/', views.get_rate_limit, name='rate-limit'),
    
    # Image upload endpoints
    path('initiatives/<int:initiative_id>/images/', views.get_initiative_images, name='initiative-images'),
    path('initiatives/<int:initiative_id>/images/upload/', views.upload_initiative_image, name='upload-initiative-image'),
    path('images/<int:image_id>/', views.delete_initiative_image, name='delete-initiative-image'),
    path('images/<int:image_id>/set-primary/', views.set_primary_image, name='set-primary-image'),
]