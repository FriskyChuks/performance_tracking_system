# main/views.py
from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from django.db.models import Q, Avg, Sum
from django.utils import timezone
from .models import *
from .serializers import *
from accounts.permissions import *

# ==================== Public Views (No Auth Required) ====================

class PublicFederalPriorityAreaList(generics.ListAPIView):
    """Public list of Federal Priority Areas"""
    queryset = FederalPriorityArea.objects.all()
    serializer_class = FederalPriorityAreaSerializer
    permission_classes = [permissions.AllowAny]

class PublicDepartmentList(generics.ListAPIView):
    """Public list of Departments"""
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [permissions.AllowAny]

class PublicAgencyList(generics.ListAPIView):
    """Public list of Agencies"""
    queryset = Agency.objects.all()
    serializer_class = AgencySerializer
    permission_classes = [permissions.AllowAny]

class PublicDeliverableList(generics.ListAPIView):
    """Public list of Deliverables"""
    queryset = Deliverable.objects.all()
    serializer_class = DeliverableSerializer
    permission_classes = [permissions.AllowAny]

class PublicIndicatorList(generics.ListAPIView):
    """Public list of indicators (no auth required)"""
    queryset = Indicator.objects.all().select_related('deliverable')
    serializer_class = IndicatorSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        deliverable_id = self.request.query_params.get('deliverable')
        if deliverable_id:
            queryset = queryset.filter(deliverable_id=deliverable_id)
        
        priority_area_id = self.request.query_params.get('priority_area')
        if priority_area_id:
            queryset = queryset.filter(deliverable__federal_priority_area_id=priority_area_id)
        
        return queryset


class PublicProjectActivityList(generics.ListAPIView):
    """Public list of Project Activities - Show all activities (not just ongoing)"""
    serializer_class = ProjectActivityListSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        # Show all activities, not just ongoing
        queryset = ProjectActivity.objects.all()
        
        # Filter by department
        department = self.request.query_params.get('department')
        if department:
            queryset = queryset.filter(department_id=department)
        
        # Filter by agency
        agency = self.request.query_params.get('agency')
        if agency:
            queryset = queryset.filter(agency_id=agency)
        
        # Filter by status
        status = self.request.query_params.get('status')
        if status:
            queryset = queryset.filter(status=status)
        
        # Filter by priority area
        priority_area = self.request.query_params.get('priority_area')
        if priority_area:
            queryset = queryset.filter(
                indicators__deliverable__federal_priority_area_id=priority_area
            ).distinct()
        
        return queryset.order_by('-created_at')

class PublicProjectActivityDetail(generics.RetrieveAPIView):
    """Public detail of a Project Activity - FULL DATA including indicators"""
    queryset = ProjectActivity.objects.all()
    serializer_class = ProjectActivityDetailSerializer  # This now includes indicators
    permission_classes = [permissions.AllowAny]
    lookup_field = 'id'

    


# ==================== READ-ONLY Views for All Authenticated Users ====================

class AllAuthenticatedActivityListView(generics.ListAPIView):
    """All authenticated users can view activities (READ ONLY)"""
    serializer_class = ProjectActivityListSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        
        # Super Admin - see everything
        if user.is_superuser or user.role == 'super_admin':
            return ProjectActivity.objects.all()
        
        # Project Admin - see everything (they can also edit via other endpoints)
        if user.role == 'project_admin':
            return ProjectActivity.objects.all()
        
        # Delivery Officer - only their assigned department/agency
        if user.role == 'delivery_officer':
            if user.assigned_department:
                return ProjectActivity.objects.filter(department=user.assigned_department)
            if user.assigned_agency:
                return ProjectActivity.objects.filter(agency=user.assigned_agency)
        
        # Director - see everything (or filter as needed)
        if user.role == 'director':
            return ProjectActivity.objects.all()
        
        # Sector Expert - see only completed/approved activities for assessment
        if user.role == 'sector_expert':
            return ProjectActivity.objects.filter(
                quarterly_progress__status='approved',
                quarterly_progress__expert_assessed=False
            ).distinct()
        
        return ProjectActivity.objects.none()


class AllAuthenticatedActivityDetailView(generics.RetrieveAPIView):
    """All authenticated users can view activity details (READ ONLY)"""
    serializer_class = ProjectActivityDetailSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'id'
    
    def get_queryset(self):
        user = self.request.user
        
        if user.is_superuser or user.role == 'super_admin':
            return ProjectActivity.objects.all()
        
        if user.role == 'project_admin':
            return ProjectActivity.objects.all()
        
        if user.role == 'delivery_officer':
            if user.assigned_department:
                return ProjectActivity.objects.filter(department=user.assigned_department)
            if user.assigned_agency:
                return ProjectActivity.objects.filter(agency=user.assigned_agency)
        
        if user.role == 'director':
            return ProjectActivity.objects.all()
        
        if user.role == 'sector_expert':
            return ProjectActivity.objects.filter(
                quarterly_progress__status='approved',
                quarterly_progress__expert_assessed=False
            ).distinct()
        
        return ProjectActivity.objects.none()


# ==================== Indicator Management Views ====================

class IndicatorListCreateView(generics.ListCreateAPIView):
    """List all indicators or create a new indicator (Project Admin only)"""
    permission_classes = [permissions.IsAuthenticated, IsProjectAdmin]
    
    def get_queryset(self):
        queryset = Indicator.objects.all().select_related('deliverable')
        
        deliverable_id = self.request.query_params.get('deliverable')
        if deliverable_id:
            queryset = queryset.filter(deliverable_id=deliverable_id)
        
        return queryset
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return IndicatorCreateUpdateSerializer
        return IndicatorSerializer
    
    def perform_create(self, serializer):
        serializer.save()

class IndicatorDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update or delete an indicator (Project Admin only)"""
    permission_classes = [permissions.IsAuthenticated, IsProjectAdmin]
    queryset = Indicator.objects.all()
    
    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return IndicatorCreateUpdateSerializer
        return IndicatorSerializer


# ==================== Department CRUD (Project Admin) ====================

class DepartmentListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated, IsProjectAdmin]
    queryset = Department.objects.all().order_by('name')

    def get_serializer_class(self):
        return DepartmentSerializer

class DepartmentDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [permissions.IsAuthenticated, IsProjectAdmin]
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer


# ==================== Agency CRUD (Project Admin) ====================

class AgencyListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated, IsProjectAdmin]
    queryset = Agency.objects.all().order_by('name')
    serializer_class = AgencySerializer

class AgencyDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [permissions.IsAuthenticated, IsProjectAdmin]
    queryset = Agency.objects.all()
    serializer_class = AgencySerializer


# ==================== Federal Priority Area CRUD (Project Admin) ====================

class FederalPriorityAreaListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated, IsProjectAdmin]
    queryset = FederalPriorityArea.objects.all().order_by('order', 'name')
    serializer_class = FederalPriorityAreaSerializer

class FederalPriorityAreaDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [permissions.IsAuthenticated, IsProjectAdmin]
    queryset = FederalPriorityArea.objects.all()
    serializer_class = FederalPriorityAreaSerializer


# ==================== Deliverable CRUD (Project Admin) ====================

class DeliverableListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated, IsProjectAdmin]
    queryset = Deliverable.objects.all().select_related('federal_priority_area').order_by('name')
    serializer_class = DeliverableSerializer

class DeliverableDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [permissions.IsAuthenticated, IsProjectAdmin]
    queryset = Deliverable.objects.all()
    serializer_class = DeliverableSerializer


# ==================== Project Admin Views (Full CRUD) ====================

class ProjectActivityListCreateView(generics.ListCreateAPIView):
    """Project Admin: List all activities and create new ones"""
    permission_classes = [permissions.IsAuthenticated, IsProjectAdmin]
    
    def get_queryset(self):
        user = self.request.user
        if user.is_superuser:
            return ProjectActivity.objects.all()
        if user.assigned_department:
            return ProjectActivity.objects.filter(department=user.assigned_department)
        if user.assigned_agency:
            return ProjectActivity.objects.filter(agency=user.assigned_agency)
        return ProjectActivity.objects.none()
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return ProjectActivityCreateUpdateSerializer
        return ProjectActivityListSerializer

class ProjectActivityDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Project Admin: View, update, delete activity"""
    permission_classes = [permissions.IsAuthenticated, IsProjectAdmin]
    serializer_class = ProjectActivityCreateUpdateSerializer
    
    def get_queryset(self):
        user = self.request.user
        if user.is_superuser:
            return ProjectActivity.objects.all()
        if user.assigned_department:
            return ProjectActivity.objects.filter(department=user.assigned_department)
        if user.assigned_agency:
            return ProjectActivity.objects.filter(agency=user.assigned_agency)
        return ProjectActivity.objects.none()


# ==================== Delivery Officer Views ====================

class DeliveryOfficerActivityListView(generics.ListAPIView):
    """Delivery Officer: List activities assigned to their department/agency only"""
    serializer_class = ProjectActivityListSerializer
    permission_classes = [permissions.IsAuthenticated, IsDeliveryOfficer]
    
    def get_queryset(self):
        user = self.request.user
        queryset = ProjectActivity.objects.prefetch_related('indicators')
        
        if user.assigned_department:
            return queryset.filter(department=user.assigned_department)
        if user.assigned_agency:
            return queryset.filter(agency=user.assigned_agency)
        return ProjectActivity.objects.none()


class DeliveryOfficerActivityDetailView(generics.RetrieveAPIView):
    """Delivery Officer: View specific activity detail (READ ONLY)"""
    permission_classes = [permissions.IsAuthenticated, IsDeliveryOfficer]
    serializer_class = ProjectActivityDetailSerializer
    
    def get_queryset(self):
        user = self.request.user
        if user.assigned_department:
            return ProjectActivity.objects.filter(department=user.assigned_department)
        if user.assigned_agency:
            return ProjectActivity.objects.filter(agency=user.assigned_agency)
        return ProjectActivity.objects.none()


class DeliveryOfficerActivityUpdateView(generics.UpdateAPIView):
    """Delivery Officer: Update activity location and other non-critical fields"""
    permission_classes = [permissions.IsAuthenticated, IsDeliveryOfficer]
    serializer_class = DeliveryOfficerActivityUpdateSerializer
    
    def get_queryset(self):
        user = self.request.user
        if user.assigned_department:
            return ProjectActivity.objects.filter(department=user.assigned_department)
        if user.assigned_agency:
            return ProjectActivity.objects.filter(agency=user.assigned_agency)
        return ProjectActivity.objects.none()


class DeliveryOfficerProgressList(generics.ListAPIView):
    """Delivery Officer: List quarterly progress for their activities"""
    serializer_class = IndicatorQuarterlyProgressSerializer
    permission_classes = [permissions.IsAuthenticated, IsDeliveryOfficer]
    
    def get_queryset(self):
        user = self.request.user
        if user.assigned_department:
            return IndicatorQuarterlyProgress.objects.filter(
                activity__department=user.assigned_department
            )
        if user.assigned_agency:
            return IndicatorQuarterlyProgress.objects.filter(
                activity__agency=user.assigned_agency
            )
        return IndicatorQuarterlyProgress.objects.none()


class DeliveryOfficerProgressUpdateView(generics.UpdateAPIView):
    """Delivery Officer: Update progress (actual values, images, comments)"""
    serializer_class = DeliveryOfficerProgressSerializer
    permission_classes = [permissions.IsAuthenticated, IsDeliveryOfficer]
    
    def get_queryset(self):
        user = self.request.user
        if user.assigned_department:
            return IndicatorQuarterlyProgress.objects.filter(
                activity__department=user.assigned_department,
                status__in=['draft', 'rejected']
            )
        if user.assigned_agency:
            return IndicatorQuarterlyProgress.objects.filter(
                activity__agency=user.assigned_agency,
                status__in=['draft', 'rejected']
            )
        return IndicatorQuarterlyProgress.objects.none()

# ==================== Director Views ====================

class DirectorPendingApprovalsView(generics.ListAPIView):
    """Director: List pending approvals"""
    serializer_class = IndicatorQuarterlyProgressSerializer
    permission_classes = [permissions.IsAuthenticated, IsDirector]
    
    def get_queryset(self):
        user = self.request.user
        if user.assigned_department:
            return IndicatorQuarterlyProgress.objects.filter(
                activity__department=user.assigned_department,
                status='submitted'
            )
        if user.assigned_agency:
            return IndicatorQuarterlyProgress.objects.filter(
                activity__agency=user.assigned_agency,
                status='submitted'
            )
        return IndicatorQuarterlyProgress.objects.none()


class DirectorApproveView(generics.UpdateAPIView):
    serializer_class = DirectorApprovalSerializer
    permission_classes = [permissions.IsAuthenticated, IsDirector]

    def get_queryset(self):
        user = self.request.user
        if user.assigned_department:
            return IndicatorQuarterlyProgress.objects.filter(
                activity__department=user.assigned_department,
                status='submitted',
            )
        if user.assigned_agency:
            return IndicatorQuarterlyProgress.objects.filter(
                activity__agency=user.assigned_agency,
                status='submitted',
            )
        return IndicatorQuarterlyProgress.objects.none()

    # No perform_update override needed — the serializer handles status rewrite
    # and populating rejected_by/rejected_at.

# ==================== Sector Expert Views ====================

class ExpertPendingAssessmentsView(generics.ListAPIView):
    """Sector Expert: List pending expert assessments"""
    serializer_class = IndicatorQuarterlyProgressSerializer
    permission_classes = [permissions.IsAuthenticated, IsSectorExpert]
    
    def get_queryset(self):
        return IndicatorQuarterlyProgress.objects.filter(
            status='approved',
            expert_assessed=False
        )

class ExpertAssessView(generics.UpdateAPIView):
    """Sector Expert: Perform assessment"""
    serializer_class = ExpertAssessmentSerializer
    permission_classes = [permissions.IsAuthenticated, IsSectorExpert]
    
    def get_queryset(self):
        return IndicatorQuarterlyProgress.objects.filter(
            status='approved',
            expert_assessed=False
        )


# ==================== Dashboard Stats View ====================

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def dashboard_stats(request):
    """Get dashboard statistics based on user role"""
    user = request.user
    stats = {}
    
    if user.role == 'project_admin' or user.is_superuser:
        activities = ProjectActivity.objects.filter(
            Q(department=user.assigned_department) | Q(agency=user.assigned_agency)
        ) if user.assigned_department or user.assigned_agency else ProjectActivity.objects.all()
        stats['total_activities'] = activities.count()
        stats['ongoing_activities'] = activities.filter(status='ongoing').count()
        stats['completed_activities'] = activities.filter(status='completed').count()
        
    elif user.role == 'delivery_officer':
        progresses = IndicatorQuarterlyProgress.objects.filter(
            Q(activity__department=user.assigned_department) | 
            Q(activity__agency=user.assigned_agency)
        )
        stats['pending_updates'] = progresses.filter(status='draft').count()
        stats['submitted'] = progresses.filter(status='submitted').count()
        stats['approved'] = progresses.filter(status='approved').count()
        
    elif user.role == 'director':
        stats['pending_approvals'] = IndicatorQuarterlyProgress.objects.filter(
            Q(activity__department=user.assigned_department) | 
            Q(activity__agency=user.assigned_agency),
            status='submitted'
        ).count()
        
    elif user.role == 'sector_expert':
        stats['pending_assessments'] = IndicatorQuarterlyProgress.objects.filter(
            status='approved',
            expert_assessed=False
        ).count()
        stats['completed_assessments'] = IndicatorQuarterlyProgress.objects.filter(
            expert_assessed=True
        ).count()
    
    return Response(stats)