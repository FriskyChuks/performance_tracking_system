from django.urls import path
from . import views

urlpatterns = [
    path('summary/',            views.SummaryView.as_view(),            name='report-summary'),
    path('priority-areas/',     views.PriorityAreasView.as_view(),      name='report-priority-areas'),
    path('deliverables/',       views.DeliverablesView.as_view(),       name='report-deliverables'),
    path('departments/',        views.DepartmentsView.as_view(),        name='report-departments'),
    path('agencies/',           views.AgenciesView.as_view(),           name='report-agencies'),
    path('at-risk-activities/', views.AtRiskActivitiesView.as_view(),   name='report-at-risk'),
    path('quarterly-trend/',    views.QuarterlyTrendView.as_view(),     name='report-quarterly-trend'),
    path('assessments/',        views.AssessmentsView.as_view(),        name='report-assessments'),
]