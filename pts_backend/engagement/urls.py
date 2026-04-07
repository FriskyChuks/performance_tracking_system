# engagement/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('projects/', views.PublicProjectListView.as_view(), name='public-projects'),
    path('projects/<int:id>/', views.PublicProjectDetailView.as_view(), name='public-project-detail'),
    path('projects/<int:project_id>/comments/', views.ProjectCommentListView.as_view(), name='project-comments'),
    path('comments/<int:comment_id>/react/', views.CommentReactionView.as_view(), name='comment-react'),
    path('register/', views.RegisterPublicUserView.as_view(), name='register-public-user'),
    path('rate-limit/', views.get_rate_limit, name='rate-limit'),

    # Image upload endpoints
    path('projects/<int:project_id>/images/', views.get_project_images, name='project-images'),
    path('projects/<int:project_id>/images/upload/', views.upload_project_image, name='upload-project-image'),
    path('images/<int:image_id>/', views.delete_project_image, name='delete-project-image'),
    path('images/<int:image_id>/set-primary/', views.set_primary_image, name='set-primary-image'),
]