# main/views.py
from django_filters import rest_framework
from rest_framework import generics, status, filters
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Avg, Count, Sum
from django.shortcuts import get_object_or_404
import datetime
from rest_framework.exceptions import PermissionDenied, ValidationError
from django.utils import timezone

from accounts.utils import get_user_role, get_user_permissions
from accounts.serializers import UserSerializer
from .models import *
from .serializers import *

# ==================== Public Endpoints ====================
@api_view(['GET'])
@permission_classes([AllowAny])
def public_departments(request):
    """Public endpoint for departments"""
    departments = Department.objects.all()
    serializer = DepartmentSerializer(departments, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([AllowAny])
def public_agencies(request):
    """Public endpoint for agencies"""
    agencies = Agency.objects.all()
    serializer = AgencySerializer(agencies, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([AllowAny])
def public_priority_areas(request):
    """Public endpoint for priority areas"""
    priority_areas = PriorityArea.objects.all()
    serializer = PriorityAreaSerializer(priority_areas, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([AllowAny])
def public_deliverables(request):
    """Public endpoint for deliverables"""
    deliverables = Deliverable.objects.all().select_related('priority_area')
    serializer = DeliverableSerializer(deliverables, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([AllowAny])
def public_dashboard_stats(request):
    """Public dashboard statistics"""
    total_initiatives = ProjectInitiative.objects.count()
    total_departments = Department.objects.count()
    total_agencies = Agency.objects.count()
    total_priority_areas = PriorityArea.objects.count()
    total_deliverables = Deliverable.objects.count()
    
    # Calculate average performance rating
    avg_rating = ProjectInitiative.objects.exclude(
        performance_rating__isnull=True
    ).aggregate(avg=Avg('performance_rating'))['avg'] or 0
    
    # Calculate completion rate
    completed = ProjectInitiative.objects.filter(status='completed').count()
    completion_rate = (completed / total_initiatives * 100) if total_initiatives > 0 else 0
    
    # Get recent completed initiatives
    recent_completed = ProjectInitiative.objects.filter(
        status='completed'
    ).order_by('-updated_at')[:5]
    
    recent_data = ProjectInitiativeListSerializer(recent_completed, many=True).data
    
    return Response({
        'total_initiatives': total_initiatives,
        'total_departments': total_departments,
        'total_agencies': total_agencies,
        'total_priority_areas': total_priority_areas,
        'total_deliverables': total_deliverables,
        'avg_performance_rating': round(avg_rating, 1),
        'completion_rate': round(completion_rate, 1),
        'recent_completed': recent_data,
    })

# ==================== Department Views ====================
class DepartmentListCreateView(generics.ListCreateAPIView):
    """
    GET: List all departments (public)
    POST: Create a new department (authenticated only)
    """
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    
    def get_permissions(self):
        if self.request.method == 'GET':
            # Allow anyone to view departments
            return [AllowAny()]
        # Require authentication for POST, PUT, DELETE
        return [IsAuthenticated()]

class DepartmentDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    
    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAuthenticated()]

# ==================== Agency Views ====================

class AgencyListCreateView(generics.ListCreateAPIView):
    """
    GET: List all agencies (public)
    POST: Create a new agency (authenticated only)
    """
    queryset = Agency.objects.all()
    serializer_class = AgencySerializer
    
    def get_permissions(self):
        if self.request.method == 'GET':
            # Allow anyone to view agencies
            return [AllowAny()]
        # Require authentication for POST, PUT, DELETE
        return [IsAuthenticated()]

class AgencyDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Agency.objects.all()
    serializer_class = AgencySerializer
    
    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAuthenticated()]

# ==================== Priority Area Views ====================

class PriorityAreaListCreateView(generics.ListCreateAPIView):
    queryset = PriorityArea.objects.all()
    serializer_class = PriorityAreaSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name']
    ordering_fields = ['order', 'name']

class PriorityAreaDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = PriorityArea.objects.all()
    serializer_class = PriorityAreaSerializer
    permission_classes = [IsAuthenticated]

# ==================== Deliverable Views ====================

class DeliverableListCreateView(generics.ListCreateAPIView):
    queryset = Deliverable.objects.all()
    serializer_class = DeliverableSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['priority_area', 'is_achieved']
    search_fields = ['name', 'description']

class DeliverableDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Deliverable.objects.all()
    serializer_class = DeliverableSerializer
    permission_classes = [IsAuthenticated]

# ==================== Project Initiative Views ====================

class ProjectInitiativeListCreateView(generics.ListCreateAPIView):
    serializer_class = ProjectInitiativeSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['initiative_type', 'status', 'department', 'agency', 'priority_area']
    search_fields = ['title', 'description', 'code']
    ordering_fields = ['start_date', 'end_date', 'created_at', 'progress_percentage']
    
    def get_queryset(self):
        queryset = ProjectInitiative.objects.all().select_related(
            'department', 'agency', 'priority_area'
        ).prefetch_related('deliverables')
        
        # Filter by type
        initiative_type = self.request.query_params.get('initiative_type')
        if initiative_type:
            queryset = queryset.filter(initiative_type=initiative_type)
        
        # Filter by date range
        start_date_from = self.request.query_params.get('start_date_from')
        start_date_to = self.request.query_params.get('start_date_to')
        if start_date_from:
            queryset = queryset.filter(start_date__gte=start_date_from)
        if start_date_to:
            queryset = queryset.filter(start_date__lte=start_date_to)
        
        # Search in title and description
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) |
                Q(description__icontains=search) |
                Q(code__icontains=search)
            )
        
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

class ProjectInitiativeDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = ProjectInitiative.objects.all()
    serializer_class = ProjectInitiativeSerializer
    permission_classes = [IsAuthenticated]
    
    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)

# ==================== Function-Based Views ====================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def project_initiative_summary(request):
    """Get summary statistics for project initiatives"""
    queryset = ProjectInitiative.objects.all()
    
    # Apply filters
    department_id = request.query_params.get('department')
    if department_id:
        queryset = queryset.filter(department_id=department_id)
    
    agency_id = request.query_params.get('agency')
    if agency_id:
        queryset = queryset.filter(agency_id=agency_id)
    
    initiative_type = request.query_params.get('initiative_type')
    if initiative_type:
        queryset = queryset.filter(initiative_type=initiative_type)
    
    total_initiatives = queryset.count()
    total_projects = queryset.filter(initiative_type='project').count()
    total_programs = queryset.filter(initiative_type='program').count()
    
    # Performance stats
    avg_rating = queryset.exclude(performance_rating__isnull=True).aggregate(
        avg=Avg('performance_rating')
    )['avg']
    
    # Status distribution
    status_distribution = queryset.values('status').annotate(count=Count('id'))
    
    # Budget stats (for projects only)
    budget_stats = queryset.filter(initiative_type='project', budget__isnull=False).aggregate(
        total_budget=Sum('budget'),
        avg_budget=Avg('budget')
    )
    
    return Response({
        'total_initiatives': total_initiatives,
        'total_projects': total_projects,
        'total_programs': total_programs,
        'average_performance_rating': avg_rating,
        'status_distribution': status_distribution,
        'budget_stats': budget_stats,
    })

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def record_progress(request, initiative_id):
    """Record progress for an initiative (creates history entry)"""
    initiative = get_object_or_404(ProjectInitiative, id=initiative_id)
    
    actual_value = request.data.get('actual_value')
    notes = request.data.get('notes', '')
    
    if actual_value is None:
        return Response({'error': 'actual_value is required'}, status=400)
    
    # Calculate progress percentage
    if initiative.target_value and initiative.target_value > 0:
        progress = (float(actual_value) / float(initiative.target_value)) * 100
        progress = min(100, max(0, progress))
    else:
        progress = initiative.progress_percentage
    
    # Auto-calculate performance rating based on progress
    if progress >= 90:
        rating = 5
    elif progress >= 75:
        rating = 4
    elif progress >= 50:
        rating = 3
    elif progress >= 25:
        rating = 2
    else:
        rating = 1
    
    # Update initiative
    initiative.actual_value = actual_value
    initiative.progress_percentage = progress
    initiative.performance_rating = rating
    initiative.save()
    
    # Create history record
    history = ProjectInitiativeHistory.objects.create(
        initiative=initiative,
        actual_value=actual_value,
        progress_percentage=progress,
        performance_rating=rating,
        notes=notes,
        recorded_by=request.user
    )
    
    serializer = ProjectInitiativeHistorySerializer(history)
    return Response(serializer.data, status=status.HTTP_201_CREATED)

@api_view(['GET'])
@permission_classes([AllowAny])
def public_initiatives(request):
    """Public endpoint for viewing initiatives (no auth required)"""
    queryset = ProjectInitiative.objects.filter().select_related(
        'department', 'agency', 'priority_area'
    )[:50]
    
    serializer = ProjectInitiativeListSerializer(queryset, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([AllowAny])
def public_initiative_detail(request, initiative_id):
    """Public endpoint for initiative detail (no auth required)"""
    initiative = get_object_or_404(ProjectInitiative, id=initiative_id)
    serializer = ProjectInitiativeSerializer(initiative)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    """Get dashboard statistics"""
    total_departments = Department.objects.count()
    total_agencies = Agency.objects.count()
    total_priority_areas = PriorityArea.objects.count()
    total_deliverables = Deliverable.objects.count()
    total_initiatives = ProjectInitiative.objects.count()
    
    # Initiatives by type
    initiatives_by_type = ProjectInitiative.objects.values('initiative_type').annotate(
        count=Count('id')
    )
    
    # Recent initiatives
    recent_initiatives = ProjectInitiative.objects.all().order_by('-created_at')[:5]
    recent_data = ProjectInitiativeListSerializer(recent_initiatives, many=True).data
    
    return Response({
        'total_departments': total_departments,
        'total_agencies': total_agencies,
        'total_priority_areas': total_priority_areas,
        'total_deliverables': total_deliverables,
        'total_initiatives': total_initiatives,
        'initiatives_by_type': initiatives_by_type,
        'recent_initiatives': recent_data,
    })


# Additional views for user info and staff updates
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_info(request):
    """Get current user's role and permissions"""
    user = request.user
    return Response({
        'user': UserSerializer(user).data,
        'role': get_user_role(user),
        'permissions': get_user_permissions(user),
    })

class StaffInitiativeUpdateView(generics.UpdateAPIView):
    """Special view for staff to update actual values"""
    serializer_class = ProjectInitiativeSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        role = get_user_role(user)
        
        if role == 'staff':
            # Staff can only see initiatives assigned to their department/agency
            if user.assigned_department:
                return ProjectInitiative.objects.filter(department=user.assigned_department)
            elif user.assigned_agency:
                return ProjectInitiative.objects.filter(agency=user.assigned_agency)
        
        return ProjectInitiative.objects.none()
    
    def perform_update(self, serializer):
        user = self.request.user
        role = get_user_role(user)
        
        if role != 'staff':
            raise PermissionDenied("Only staff can update actual values")
        
        # Only allow updating specific fields
        allowed_updates = {
            'actual_value': serializer.validated_data.get('actual_value'),
            'status': serializer.validated_data.get('status'),
        }
        
        # Remove None values
        allowed_updates = {k: v for k, v in allowed_updates.items() if v is not None}
        
        for key, value in allowed_updates.items():
            setattr(serializer.instance, key, value)
        
        serializer.instance.save()
        serializer.instance.update_achievement_percentage()

class DirectorApprovalView(generics.UpdateAPIView):
    """View for directors to approve initiatives"""
    serializer_class = ProjectInitiativeSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return ProjectInitiative.objects.filter(status='submitted')
    
    def perform_update(self, serializer):
        user = self.request.user
        role = get_user_role(user)
        
        if role != 'director':
            raise PermissionDenied("Only directors can approve initiatives")
        
        action = self.request.data.get('action')
        
        if action == 'approve':
            serializer.save(status='approved', approved_by=user, approved_at=timezone.now())
        elif action == 'reject':
            serializer.save(status='rejected')
        else:
            raise ValidationError("Action must be 'approve' or 'reject'")
        

# ==================== Quarterly Progress Views ====================

class InitiativeQuarterListView(generics.ListAPIView):
    """Get all quarters for an initiative"""
    serializer_class = DeliverableQuarterSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        initiative_id = self.kwargs.get('initiative_id')
        year = self.request.query_params.get('year')
        
        queryset = DeliverableQuarter.objects.filter(initiative_id=initiative_id)
        
        if year:
            queryset = queryset.filter(year=year)
        
        return queryset.order_by('year', 'quarter', 'deliverable__name')

class InitiativeQuarterDetailView(generics.RetrieveAPIView):
    """Get specific quarter details"""
    serializer_class = DeliverableQuarterSerializer
    permission_classes = [IsAuthenticated]
    
    def get_object(self):
        initiative_id = self.kwargs.get('initiative_id')
        year = self.kwargs.get('year')
        quarter = self.kwargs.get('quarter')
        
        return get_object_or_404(
            DeliverableQuarter, 
            initiative_id=initiative_id, 
            year=year, 
            quarter=quarter
        )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def initialize_quarterly_targets(request, initiative_id):
    """Initialize quarterly targets for deliverables"""
    initiative = get_object_or_404(ProjectInitiative, id=initiative_id)
    
    # Check permission - only ProjectAdmin or Staff can initialize
    user_role = get_user_role(request.user)
    if user_role not in ['project_admin', 'staff', 'super_admin']:
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
    
    deliverable_id = request.data.get('deliverable_id')
    target_value = request.data.get('target_value')
    unit_of_measure = request.data.get('unit_of_measure')
    year = request.data.get('year', timezone.now().year)
    
    if not deliverable_id or not target_value:
        return Response({'error': 'deliverable_id and target_value are required'}, status=400)
    
    # Create quarterly records for Q1, Q2, Q3, Q4
    quarters_created = []
    for quarter in range(1, 5):
        quarter_obj, created = DeliverableQuarter.objects.get_or_create(
            initiative=initiative,
            deliverable_id=deliverable_id,
            quarter=quarter,
            year=year,
            defaults={
                'target_value': target_value,
                'unit_of_measure': unit_of_measure,
                'status': 'draft'
            }
        )
        quarters_created.append(quarter_obj)
    
    serializer = DeliverableQuarterSerializer(quarters_created, many=True)
    return Response(serializer.data, status=status.HTTP_201_CREATED)

@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_quarter_actual(request, quarter_id):
    """Staff updates actual value for a quarter"""
    quarter = get_object_or_404(DeliverableQuarter, id=quarter_id)
    
    # Check permission - only Staff can update actual values
    user_role = get_user_role(request.user)
    if user_role not in ['staff', 'super_admin']:
        return Response({'error': 'Only staff can update actual values'}, status=403)
    
    # Check if quarter is still in draft status
    if quarter.status != 'draft':
        return Response({'error': f'Cannot update quarter in {quarter.status} status'}, status=400)
    
    actual_value = request.data.get('actual_value')
    staff_comment = request.data.get('staff_comment', '')
    
    if actual_value is None:
        return Response({'error': 'actual_value is required'}, status=400)
    
    quarter.actual_value = actual_value
    if staff_comment:
        quarter.staff_comment = staff_comment
    quarter.updated_by = request.user
    quarter.save()
    
    serializer = DeliverableQuarterSerializer(quarter)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_quarter_for_review(request, quarter_id):
    """Staff submits quarter for director review"""
    quarter = get_object_or_404(DeliverableQuarter, id=quarter_id)
    
    # Check permission - only Staff can submit
    user_role = get_user_role(request.user)
    if user_role not in ['staff', 'super_admin']:
        return Response({'error': 'Only staff can submit for review'}, status=403)
    
    if quarter.status != 'draft':
        return Response({'error': f'Cannot submit quarter in {quarter.status} status'}, status=400)
    
    if quarter.actual_value is None:
        return Response({'error': 'Please update actual value before submitting'}, status=400)
    
    quarter.status = 'submitted'
    quarter.submitted_at = timezone.now()
    quarter.save()
    
    serializer = DeliverableQuarterSerializer(quarter)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_quarter(request, initiative_id):
    """Create a new quarterly record for a deliverable"""
    initiative = get_object_or_404(ProjectInitiative, id=initiative_id)
    
    # Check permission
    user_role = get_user_role(request.user)
    if user_role not in ['project_admin', 'staff', 'super_admin']:
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
    
    deliverable_id = request.data.get('deliverable_id')
    quarter = request.data.get('quarter')
    year = request.data.get('year')
    target_value = request.data.get('target_value')
    unit_of_measure = request.data.get('unit_of_measure')
    
    if not all([deliverable_id, quarter, year, target_value]):
        return Response({'error': 'Missing required fields'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Check if quarter already exists
    existing, created = DeliverableQuarter.objects.get_or_create(
        initiative=initiative,
        deliverable_id=deliverable_id,
        quarter=quarter,
        year=year,
        defaults={
            'target_value': target_value,
            'unit_of_measure': unit_of_measure,
            'status': 'draft'
        }
    )
    
    if not created:
        # Update existing
        existing.target_value = target_value
        existing.unit_of_measure = unit_of_measure
        existing.save()
        serializer = DeliverableQuarterSerializer(existing)
    else:
        serializer = DeliverableQuarterSerializer(existing)
    
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upsert_quarter(request, initiative_id):
    """Create or update a quarterly record (upsert)"""
    initiative = get_object_or_404(ProjectInitiative, id=initiative_id)
    
    # Check permission
    user_role = get_user_role(request.user)
    if user_role not in ['project_admin', 'staff', 'super_admin']:
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
    
    deliverable_id = request.data.get('deliverable_id')
    quarter = request.data.get('quarter')
    year = request.data.get('year')
    target_value = request.data.get('target_value')
    unit_of_measure = request.data.get('unit_of_measure')
    
    if not all([deliverable_id, quarter, year, target_value]):
        return Response({'error': 'Missing required fields: deliverable_id, quarter, year, target_value'}, 
                       status=status.HTTP_400_BAD_REQUEST)
    
    # Upsert: update or create
    quarter_obj, created = DeliverableQuarter.objects.update_or_create(
        initiative=initiative,
        deliverable_id=deliverable_id,
        quarter=quarter,
        year=year,
        defaults={
            'target_value': target_value,
            'unit_of_measure': unit_of_measure,
            'status': 'draft'
        }
    )
    
    serializer = DeliverableQuarterSerializer(quarter_obj)
    return Response(serializer.data, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def approve_quarter(request, quarter_id):
    """Director approves a quarter"""
    quarter = get_object_or_404(DeliverableQuarter, id=quarter_id)
    
    # Check permission - only Director can approve
    user_role = get_user_role(request.user)
    if user_role not in ['director', 'super_admin']:
        return Response({'error': 'Only directors can approve'}, status=403)
    
    if quarter.status != 'submitted':
        return Response({'error': f'Cannot approve quarter in {quarter.status} status'}, status=400)
    
    quarter.status = 'approved'
    quarter.approved_at = timezone.now()
    quarter.approved_by = request.user
    quarter.save()
    
    # Check if all quarters for this initiative/year are approved
    # If yes, update initiative status
    all_quarters = DeliverableQuarter.objects.filter(
        initiative=quarter.initiative,
        year=quarter.year
    )
    all_approved = all(q.status == 'approved' for q in all_quarters)
    
    if all_approved:
        # Update initiative status to completed for this year
        initiative = quarter.initiative
        if initiative.status == 'ongoing':
            initiative.status = 'completed'
            initiative.save()
    
    serializer = DeliverableQuarterSerializer(quarter)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def reject_quarter(request, quarter_id):
    """Director rejects a quarter"""
    quarter = get_object_or_404(DeliverableQuarter, id=quarter_id)
    
    # Check permission - only Director can reject
    user_role = get_user_role(request.user)
    if user_role not in ['director', 'super_admin']:
        return Response({'error': 'Only directors can reject'}, status=403)
    
    if quarter.status != 'submitted':
        return Response({'error': f'Cannot reject quarter in {quarter.status} status'}, status=400)
    
    reason = request.data.get('reason', '')
    quarter.status = 'rejected'
    quarter.staff_comment = f"Rejected: {reason}" if reason else quarter.staff_comment
    quarter.save()
    
    serializer = DeliverableQuarterSerializer(quarter)
    return Response(serializer.data)


# ==================== Expert Assessment Views ====================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_initiative_assessment(request, initiative_id):
    """Get assessment for an initiative"""
    initiative = get_object_or_404(ProjectInitiative, id=initiative_id)
    
    try:
        assessment = InitiativeAssessment.objects.get(initiative=initiative)
        serializer = InitiativeAssessmentSerializer(assessment)
        return Response(serializer.data)
    except InitiativeAssessment.DoesNotExist:
        return Response(None, status=status.HTTP_200_OK)

@api_view(['POST', 'PUT'])
@permission_classes([IsAuthenticated])
def save_initiative_assessment(request, initiative_id):
    """Create or update assessment for an initiative"""
    initiative = get_object_or_404(ProjectInitiative, id=initiative_id)
    
    # Check permission - only Sector Expert can assess
    user_role = get_user_role(request.user)
    if user_role not in ['sector_expert', 'super_admin']:
        return Response({'error': 'Only sector experts can assess'}, status=403)
    
    # Check if initiative has approved deliverables or is completed
    has_approved_quarters = DeliverableQuarter.objects.filter(
        initiative=initiative,
        status='approved'
    ).exists()
    
    if not has_approved_quarters and initiative.status != 'completed':
        return Response({'error': 'Initiative must have approved deliverables or be completed before assessment'}, status=400)
    
    data = {
        'initiative': initiative.id,
        'data_accuracy': request.data.get('data_accuracy'),
        'effort_percentage': request.data.get('effort_percentage'),
        'expert_comment': request.data.get('expert_comment'),
        'expert_rating': request.data.get('expert_rating'),
        'recommendations': request.data.get('recommendations', ''),
        'assessed_by': request.user.id
    }
    
    try:
        assessment = InitiativeAssessment.objects.get(initiative=initiative)
        serializer = InitiativeAssessmentSerializer(assessment, data=data, partial=True)
    except InitiativeAssessment.DoesNotExist:
        serializer = InitiativeAssessmentSerializer(data=data)
    
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_initiative_for_expert_assessment(request, initiative_id):
    """Get complete initiative data with all approved deliverables for expert assessment"""
    initiative = get_object_or_404(ProjectInitiative, id=initiative_id)
    
    # Get all approved quarters for this initiative
    approved_quarters = DeliverableQuarter.objects.filter(
        initiative=initiative,
        status='approved'
    ).select_related('deliverable')
    
    # Get existing assessment if any
    try:
        assessment = InitiativeAssessment.objects.get(initiative=initiative)
        assessment_data = InitiativeAssessmentSerializer(assessment).data
    except InitiativeAssessment.DoesNotExist:
        assessment_data = None
    
    # Structure approved deliverables
    approved_deliverables = []
    for quarter in approved_quarters:
        approved_deliverables.append({
            'id': quarter.deliverable.id,
            'name': quarter.deliverable.name,
            'quarter': quarter.quarter,
            'year': quarter.year,
            'target_value': quarter.target_value,
            'actual_value': quarter.actual_value,
            'unit_of_measure': quarter.unit_of_measure,
            'achievement_percentage': quarter.achievement_percentage,
            'quarter_id': quarter.id
        })
    
    return Response({
        'initiative': ProjectInitiativeSerializer(initiative).data,
        'approved_deliverables': approved_deliverables,
        'existing_assessment': assessment_data
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def expert_dashboard(request):
    """Get dashboard for sector expert users - shows deliverables pending expert review"""
    user_role = get_user_role(request.user)
    if user_role not in ['sector_expert', 'super_admin']:
        return Response({'error': 'Access denied'}, status=403)
    
    # Get all approved quarters that haven't been assessed yet
    # Group by initiative
    approved_quarters = DeliverableQuarter.objects.filter(
        status='approved'
    ).select_related('initiative', 'deliverable', 'initiative__department', 'initiative__agency')
    
    # Process initiatives with approved quarters
    initiative_dict = {}
    for quarter in approved_quarters:
        initiative_id = quarter.initiative.id
        if initiative_id not in initiative_dict:
            # Check if this initiative already has an assessment
            has_assessment = InitiativeAssessment.objects.filter(initiative_id=initiative_id).exists()
            if not has_assessment:
                initiative_dict[initiative_id] = {
                    'id': initiative_id,
                    'title': quarter.initiative.title,
                    'description': quarter.initiative.description,
                    'code': quarter.initiative.code,
                    'initiative_type': quarter.initiative.initiative_type,
                    'department_name': quarter.initiative.department.name if quarter.initiative.department else None,
                    'agency_name': quarter.initiative.agency.name if quarter.initiative.agency else None,
                    'priority_area_name': quarter.initiative.priority_area.name if quarter.initiative.priority_area else None,
                    'status': quarter.initiative.status,
                    'start_date': quarter.initiative.start_date,
                    'end_date': quarter.initiative.end_date,
                    'approved_deliverables': []
                }
        
        if initiative_id in initiative_dict:
            initiative_dict[initiative_id]['approved_deliverables'].append({
                'id': quarter.deliverable.id,
                'name': quarter.deliverable.name,
                'quarter': quarter.quarter,
                'year': quarter.year,
                'target_value': quarter.target_value,
                'actual_value': quarter.actual_value,
                'unit_of_measure': quarter.unit_of_measure,
                'achievement_percentage': quarter.achievement_percentage,
                'quarter_id': quarter.id
            })
    
    # Also include completed initiatives without any approved deliverables
    completed_initiatives = ProjectInitiative.objects.filter(
        status='completed'
    ).exclude(
        id__in=InitiativeAssessment.objects.values('initiative_id')
    )
    
    for initiative in completed_initiatives:
        if initiative.id not in initiative_dict:
            initiative_dict[initiative.id] = {
                'id': initiative.id,
                'title': initiative.title,
                'description': initiative.description,
                'code': initiative.code,
                'initiative_type': initiative.initiative_type,
                'department_name': initiative.department.name if initiative.department else None,
                'agency_name': initiative.agency.name if initiative.agency else None,
                'priority_area_name': initiative.priority_area.name if initiative.priority_area else None,
                'status': initiative.status,
                'start_date': initiative.start_date,
                'end_date': initiative.end_date,
                'approved_deliverables': []
            }
    
    return Response(list(initiative_dict.values()))


# ==================== Staff/Director Dashboard Views ====================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def staff_dashboard(request):
    """Get dashboard for staff users"""
    user_role = get_user_role(request.user)
    if user_role not in ['staff', 'super_admin']:
        return Response({'error': 'Access denied'}, status=403)
    
    # Get quarters assigned to staff's department/agency
    quarters = DeliverableQuarter.objects.filter(
        initiative__department=request.user.assigned_department,
        status='draft'
    ).select_related('initiative', 'deliverable')
    
    serializer = DeliverableQuarterSerializer(quarters, many=True)
    return Response(serializer.data)


# Updated the director_dashboard view to include all necessary fields for the frontend
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def director_dashboard(request):
    """Get dashboard for director users"""
    user_role = get_user_role(request.user)
    if user_role not in ['director', 'super_admin']:
        return Response({'error': 'Access denied'}, status=403)
    
    # Get quarters pending approval with all necessary fields
    quarters = DeliverableQuarter.objects.filter(
        status='submitted'
    ).select_related('initiative', 'deliverable', 'initiative__department', 'initiative__agency')
    
    # Serialize with all required fields
    data = []
    for q in quarters:
        data.append({
            'id': q.id,
            'initiative_id': q.initiative.id,
            'initiative_title': q.initiative.title,
            'initiative_code': q.initiative.code,
            'deliverable_id': q.deliverable.id,
            'deliverable_name': q.deliverable.name,
            'quarter': q.quarter,
            'year': q.year,
            'target_value': q.target_value,
            'actual_value': q.actual_value,
            'unit_of_measure': q.unit_of_measure,
            'achievement_percentage': q.achievement_percentage,
            'staff_comment': q.staff_comment,
            'status': q.status,
            'submitted_at': q.submitted_at,
        })
    
    return Response(data)


# ==================== Quarterly Summary Views ====================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_initiative_summaries(request, initiative_id):
    """Get quarterly summaries for an initiative"""
    initiative = get_object_or_404(ProjectInitiative, id=initiative_id)
    
    summaries = InitiativeQuarterSummary.objects.filter(initiative=initiative)
    serializer = InitiativeQuarterSummarySerializer(summaries, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_initiative_summary_by_year(request, initiative_id, year):
    """Get summary for a specific year"""
    initiative = get_object_or_404(ProjectInitiative, id=initiative_id)
    
    try:
        summary = InitiativeQuarterSummary.objects.get(initiative=initiative, year=year)
        serializer = InitiativeQuarterSummarySerializer(summary)
        return Response(serializer.data)
    except InitiativeQuarterSummary.DoesNotExist:
        return Response(None, status=status.HTTP_200_OK)