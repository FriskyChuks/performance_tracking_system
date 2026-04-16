# reports/urls.py
from django.urls import path
from . import views

urlpatterns = [
    # Export endpoint - must come BEFORE the dynamic pattern
    path('export/<str:report_type>/', views.export_report, name='export-report'),
    
    # Report data endpoints
    path('<str:report_type>/', views.get_report_data, name='report-data'),
]