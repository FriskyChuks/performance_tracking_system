# main/urls.py
from django.urls import path
from . import views

urlpatterns = [
    # Public endpoints
    path('public/initiatives/', views.public_initiatives, name='public-initiatives'),
    path('public/initiatives/<int:initiative_id>/', views.public_initiative_detail, name='public-initiative-detail'),
    path('public/departments/', views.public_departments, name='public-departments'),
    path('public/agencies/', views.public_agencies, name='public-agencies'),
    path('public/priority-areas/', views.public_priority_areas, name='public-priority-areas'),
    path('public/deliverables/', views.public_deliverables, name='public-deliverables'),
    path('public/dashboard-stats/', views.public_dashboard_stats, name='public-dashboard-stats'),
    
    # Department URLs
    path('departments/', views.DepartmentListCreateView.as_view(), name='department-list'),
    path('departments/<int:pk>/', views.DepartmentDetailView.as_view(), name='department-detail'),
    
    # Agency URLs
    path('agencies/', views.AgencyListCreateView.as_view(), name='agency-list'),
    path('agencies/<int:pk>/', views.AgencyDetailView.as_view(), name='agency-detail'),
    
    # Priority Area URLs
    path('priority-areas/', views.PriorityAreaListCreateView.as_view(), name='priority-area-list'),
    path('priority-areas/<int:pk>/', views.PriorityAreaDetailView.as_view(), name='priority-area-detail'),
    
    # Deliverable URLs
    path('deliverables/', views.DeliverableListCreateView.as_view(), name='deliverable-list'),
    path('deliverables/<int:pk>/', views.DeliverableDetailView.as_view(), name='deliverable-detail'),
    
    # Project Initiative URLs
    path('initiatives/', views.ProjectInitiativeListCreateView.as_view(), name='initiative-list'),
    path('initiatives/<int:pk>/', views.ProjectInitiativeDetailView.as_view(), name='initiative-detail'),
    path('initiatives/<int:initiative_id>/record-progress/', views.record_progress, name='record-progress'),
    
    # Quarterly Progress URLs
    path('initiatives/<int:initiative_id>/quarters/', views.InitiativeQuarterListView.as_view(), name='initiative-quarters'),
    path('initiatives/<int:initiative_id>/quarters/create/', views.create_quarter, name='create-quarter'),
    path('initiatives/<int:initiative_id>/quarters/upsert/', views.upsert_quarter, name='upsert-quarter'),
    path('initiatives/<int:initiative_id>/quarters/<int:year>/<int:quarter>/', views.InitiativeQuarterDetailView.as_view(), name='initiative-quarter-detail'),
    path('initiatives/<int:initiative_id>/quarters/initialize/', views.initialize_quarterly_targets, name='initialize-quarters'),
    path('quarterly/<int:quarter_id>/update-actual/', views.update_quarter_actual, name='update-quarter-actual'),
    path('quarterly/<int:quarter_id>/submit/', views.submit_quarter_for_review, name='submit-quarter'),
    path('quarterly/<int:quarter_id>/approve/', views.approve_quarter, name='approve-quarter'),
    path('quarterly/<int:quarter_id>/reject/', views.reject_quarter, name='reject-quarter'),
    path('quarterly/pending-approval/', views.director_dashboard, name='pending-approvals'),
    
    # Expert Assessment URLs - ADD THESE
    path('initiatives/<int:initiative_id>/assessment/', views.get_initiative_assessment, name='get-assessment'),
    path('initiatives/<int:initiative_id>/assessment/save/', views.save_initiative_assessment, name='save-assessment'),
    path('initiatives/<int:initiative_id>/expert-assessment/', views.get_initiative_for_expert_assessment, name='expert-assessment-detail'),
    
    # Quarterly Summary URLs
    path('initiatives/<int:initiative_id>/summaries/', views.get_initiative_summaries, name='initiative-summaries'),
    path('initiatives/<int:initiative_id>/summaries/<int:year>/', views.get_initiative_summary_by_year, name='initiative-summary-year'),
    
    # Role-based Dashboards
    path('dashboard/staff/', views.staff_dashboard, name='staff-dashboard'),
    path('dashboard/director/', views.director_dashboard, name='director-dashboard'),
    path('dashboard/expert/', views.expert_dashboard, name='expert-dashboard'),
    
    # Public endpoints
    path('public/initiatives/', views.public_initiatives, name='public-initiatives'),
    path('public/initiatives/<int:initiative_id>/', views.public_initiative_detail, name='public-initiative-detail'),
    
    # Stats endpoints
    path('initiatives/summary/', views.project_initiative_summary, name='initiative-summary'),
    path('dashboard/stats/', views.dashboard_stats, name='dashboard-stats'),

    # Role-specific views
    path('user/info/', views.get_user_info, name='user-info'),
    path('staff/initiatives/<int:pk>/update/', views.StaffInitiativeUpdateView.as_view(), name='staff-initiative-update'),
    path('director/initiatives/<int:pk>/approve/', views.DirectorApprovalView.as_view(), name='director-approve'),
]