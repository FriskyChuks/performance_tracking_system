# main/urls.py
from django.urls import path
from . import views

urlpatterns = [
    # Public endpoints (no auth)
    path('public/priority-areas/', views.PublicFederalPriorityAreaList.as_view(), name='public-priority-areas'),
    path('public/departments/', views.PublicDepartmentList.as_view(), name='public-departments'),
    path('public/agencies/', views.PublicAgencyList.as_view(), name='public-agencies'),
    path('public/deliverables/', views.PublicDeliverableList.as_view(), name='public-deliverables'),
    path('public/indicators/', views.PublicIndicatorList.as_view(), name='public-indicators'),
    path('public/activities/', views.PublicProjectActivityList.as_view(), name='public-activities'),
    path('public/activities/<int:id>/', views.PublicProjectActivityDetail.as_view(), name='public-activity-detail'),
    
    # READ-ONLY endpoints for all authenticated users
    path('all/activities/', views.AllAuthenticatedActivityListView.as_view(), name='all-activities-list'),
    path('all/activities/<int:id>/', views.AllAuthenticatedActivityDetailView.as_view(), name='all-activity-detail'),
    
    # Indicator Management (Project Admin only)
    path('indicators/', views.IndicatorListCreateView.as_view(), name='indicator-list-create'),
    path('indicators/<int:pk>/', views.IndicatorDetailView.as_view(), name='indicator-detail'),
    
    # Project Activity CRUD (Project Admin)
    path('activities/', views.ProjectActivityListCreateView.as_view(), name='activity-list-create'),
    path('activities/<int:pk>/', views.ProjectActivityDetailView.as_view(), name='activity-detail'),

    # Delivery Officer endpoints
    path('delivery/activities/', views.DeliveryOfficerActivityListView.as_view(), name='delivery-activities-list'),
    path('delivery/activities/<int:pk>/', views.DeliveryOfficerActivityDetailView.as_view(), name='delivery-activity-detail'),
    path('delivery/activities/<int:pk>/update/', views.DeliveryOfficerActivityUpdateView.as_view(), name='delivery-activity-update'),
    path('delivery/progress/', views.DeliveryOfficerProgressList.as_view(), name='delivery-progress-list'),
    path('delivery/progress/<int:pk>/', views.DeliveryOfficerProgressUpdateView.as_view(), name='delivery-progress-update'),
    
    # Director endpoints
    path('director/pending/', views.DirectorPendingApprovalsView.as_view(), name='director-pending'),
    path('director/approve/<int:pk>/', views.DirectorApproveView.as_view(), name='director-approve'),
    
        # Sector Expert endpoints
    path('expert/pending/', views.ExpertPendingAssessmentsView.as_view(), name='expert-pending'),
    path('expert/assess/<int:pk>/', views.ExpertAssessView.as_view(), name='expert-assess'),

    # Department CRUD (Project Admin)
    path('departments/', views.DepartmentListCreateView.as_view(), name='department-list-create'),
    path('departments/<int:pk>/', views.DepartmentDetailView.as_view(), name='department-detail'),

    # Agency CRUD (Project Admin)
    path('agencies/', views.AgencyListCreateView.as_view(), name='agency-list-create'),
    path('agencies/<int:pk>/', views.AgencyDetailView.as_view(), name='agency-detail'),

    # Federal Priority Area CRUD (Project Admin)
    path('priority-areas/', views.FederalPriorityAreaListCreateView.as_view(), name='priority-area-list-create'),
    path('priority-areas/<int:pk>/', views.FederalPriorityAreaDetailView.as_view(), name='priority-area-detail'),

    # Deliverable CRUD (Project Admin)
    path('deliverables/', views.DeliverableListCreateView.as_view(), name='deliverable-list-create'),
    path('deliverables/<int:pk>/', views.DeliverableDetailView.as_view(), name='deliverable-detail'),

    # Dashboard
    path('dashboard/stats/', views.dashboard_stats, name='dashboard-stats'),

]