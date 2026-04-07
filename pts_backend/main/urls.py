# main/urls.py
from django.urls import path
from . import views

urlpatterns = [
    # Ministry URLs
    path('ministries/', views.MinistryListCreateView.as_view(), name='ministry-list-create'),
    path('ministries/<int:pk>/', views.MinistryDetailView.as_view(), name='ministry-detail'),
    
    # Priority Area URLs
    path('priority-areas/', views.PriorityAreaListCreateView.as_view(), name='priority-area-list-create'),
    path('priority-areas/<int:pk>/', views.PriorityAreaDetailView.as_view(), name='priority-area-detail'),
    
    # Deliverable URLs
    path('deliverables/', views.DeliverableListCreateView.as_view(), name='deliverable-list-create'),
    path('deliverables/<int:pk>/', views.DeliverableDetailView.as_view(), name='deliverable-detail'),
    
    # Project URLs
    path('projects/', views.ProjectListCreateView.as_view(), name='project-list-create'),
    path('projects/<int:pk>/', views.ProjectDetailView.as_view(), name='project-detail'),
    
    # Function-based views
    path('projects/summary/', views.project_summary, name='project-summary'),
    path('projects/bulk-operations/', views.project_bulk_operations, name='project-bulk-operations'),
    path('projects/bulk-delete/', views.project_bulk_delete, name='project-bulk-delete'),
    path('projects/export/', views.export_projects, name='export-projects'),
    path('dashboard/stats/', views.dashboard_stats, name='dashboard-stats'),
    path('ministries/<int:ministry_id>/performance/', views.ministry_performance, name='ministry-performance'),
]