# main/views.py
from django.shortcuts import get_object_or_404
from django.db import models
from django.db.models import Avg, Count, Sum, Q
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.generics import (
    ListCreateAPIView,
    RetrieveUpdateDestroyAPIView,
    ListAPIView,
)
from .models import Ministry, PriorityArea, Deliverable, Project
from .serializers import (
    MinistrySerializer,
    PriorityAreaSerializer,
    DeliverableSerializer,
    ProjectSerializer,
)

# ==================== Ministry Views ====================

class MinistryListCreateView(ListCreateAPIView):
    """
    GET: List all ministries
    POST: Create a new ministry
    """
    queryset = Ministry.objects.all()
    serializer_class = MinistrySerializer
    permission_classes = [IsAuthenticated]

class MinistryDetailView(RetrieveUpdateDestroyAPIView):
    """
    GET: Retrieve a specific ministry
    PUT/PATCH: Update a ministry
    DELETE: Delete a ministry
    """
    queryset = Ministry.objects.all()
    serializer_class = MinistrySerializer
    permission_classes = [IsAuthenticated]

# ==================== Priority Area Views ====================

class PriorityAreaListCreateView(ListCreateAPIView):
    """
    GET: List all priority areas (filter by ministry if query param provided)
    POST: Create a new priority area
    """
    serializer_class = PriorityAreaSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = PriorityArea.objects.all()
        ministry_id = self.request.query_params.get('ministry')
        if ministry_id:
            queryset = queryset.filter(ministry_id=ministry_id)
        return queryset

class PriorityAreaDetailView(RetrieveUpdateDestroyAPIView):
    """
    GET: Retrieve a specific priority area
    PUT/PATCH: Update a priority area
    DELETE: Delete a priority area
    """
    queryset = PriorityArea.objects.all()
    serializer_class = PriorityAreaSerializer
    permission_classes = [IsAuthenticated]

# ==================== Deliverable Views ====================

class DeliverableListCreateView(ListCreateAPIView):
    """
    GET: List all deliverables (filter by priority_area if query param provided)
    POST: Create a new deliverable
    """
    serializer_class = DeliverableSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Deliverable.objects.all()
        priority_area_id = self.request.query_params.get('priority_area')
        if priority_area_id:
            queryset = queryset.filter(priority_area_id=priority_area_id)
        return queryset

class DeliverableDetailView(RetrieveUpdateDestroyAPIView):
    """
    GET: Retrieve a specific deliverable
    PUT/PATCH: Update a deliverable
    DELETE: Delete a deliverable
    """
    queryset = Deliverable.objects.all()
    serializer_class = DeliverableSerializer
    permission_classes = [IsAuthenticated]

# ==================== Project Views ====================

class ProjectListCreateView(ListCreateAPIView):
    """
    GET: List all projects with advanced filtering
    POST: Create a new project (automatically sets created_by)
    """
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Project.objects.all()
        
        # Filter by deliverable
        deliverable_id = self.request.query_params.get('deliverable')
        if deliverable_id:
            queryset = queryset.filter(deliverable_id=deliverable_id)
        
        # Filter by ministry (through deliverable -> priority_area)
        ministry_id = self.request.query_params.get('ministry')
        if ministry_id:
            queryset = queryset.filter(
                deliverable__priority_area__ministry_id=ministry_id
            )
        
        # Filter by priority area
        priority_area_id = self.request.query_params.get('priority_area')
        if priority_area_id:
            queryset = queryset.filter(
                deliverable__priority_area_id=priority_area_id
            )
        
        # Filter by year
        year = self.request.query_params.get('year')
        if year:
            queryset = queryset.filter(year=year)
        
        # Filter by year range
        year_from = self.request.query_params.get('year_from')
        year_to = self.request.query_params.get('year_to')
        if year_from:
            queryset = queryset.filter(year__gte=year_from)
        if year_to:
            queryset = queryset.filter(year__lte=year_to)
        
        # Filter by quarter
        quarter = self.request.query_params.get('quarter')
        if quarter:
            queryset = queryset.filter(quarter=quarter)
        
        # Filter by performance rating
        performance_rating = self.request.query_params.get('performance_rating')
        if performance_rating:
            queryset = queryset.filter(performance_rating=performance_rating)
        
        # Search in outcome, indicator, and performance_comment
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(outcome__icontains=search) |
                Q(indicator__icontains=search) |
                Q(performance_comment__icontains=search)
            )
        
        # Ordering
        ordering = self.request.query_params.get('ordering', '-year')
        if ordering:
            queryset = queryset.order_by(ordering)
        
        return queryset

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

class ProjectDetailView(RetrieveUpdateDestroyAPIView):
    """
    GET: Retrieve a specific project
    PUT/PATCH: Update a project (automatically sets updated_by)
    DELETE: Delete a project
    """
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticated]

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)

# ==================== Function-Based Views ====================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def project_summary(request):
    """
    Get summary statistics for projects
    Query params: ministry, year, quarter
    """
    queryset = Project.objects.all()
    
    # Apply filters
    ministry_id = request.query_params.get('ministry')
    if ministry_id:
        queryset = queryset.filter(
            deliverable__priority_area__ministry_id=ministry_id
        )
    
    year = request.query_params.get('year')
    if year:
        queryset = queryset.filter(year=year)
    
    quarter = request.query_params.get('quarter')
    if quarter:
        queryset = queryset.filter(quarter=quarter)
    
    # Calculate statistics
    total_projects = queryset.count()
    
    avg_rating = queryset.exclude(
        performance_rating__isnull=True
    ).aggregate(avg=models.Avg('performance_rating'))['avg']
    
    rating_distribution = queryset.exclude(
        performance_rating__isnull=True
    ).values('performance_rating').annotate(
        count=Count('id')
    ).order_by('performance_rating')
    
    # Get year range
    year_range = Project.objects.aggregate(
        min_year=models.Min('year'),
        max_year=models.Max('year')
    )
    
    # Get performance by quarter
    performance_by_quarter = queryset.values('year', 'quarter').annotate(
        avg_rating=Avg('performance_rating'),
        total_projects=Count('id')
    ).order_by('year', 'quarter')
    
    return Response({
        'total_projects': total_projects,
        'average_performance_rating': avg_rating,
        'rating_distribution': rating_distribution,
        'year_range': year_range,
        'performance_by_quarter': performance_by_quarter,
        'quarters': dict(Project.QUARTER_CHOICES),
        'performance_ratings': dict(Project.PERFORMANCE_RATING_CHOICES),
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def ministry_performance(request, ministry_id):
    """
    Get performance summary for a specific ministry
    """
    ministry = get_object_or_404(Ministry, id=ministry_id)
    
    projects = Project.objects.filter(
        deliverable__priority_area__ministry=ministry
    )
    
    total_projects = projects.count()
    
    # Performance by priority area
    performance_by_priority = projects.values(
        'deliverable__priority_area__title'
    ).annotate(
        avg_rating=Avg('performance_rating'),
        total_projects=Count('id')
    ).order_by('-avg_rating')
    
    # Performance trend over years
    yearly_performance = projects.values('year').annotate(
        avg_rating=Avg('performance_rating'),
        total_projects=Count('id')
    ).order_by('year')
    
    # Recent projects
    recent_projects = projects.order_by('-year', '-quarter', '-updated_at')[:10]
    recent_projects_data = ProjectSerializer(recent_projects, many=True).data
    
    return Response({
        'ministry': MinistrySerializer(ministry).data,
        'total_projects': total_projects,
        'performance_by_priority_area': performance_by_priority,
        'yearly_performance': yearly_performance,
        'recent_projects': recent_projects_data,
    })

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def project_bulk_operations(request):
    """
    GET: Bulk retrieve projects with IDs
    POST: Bulk create multiple projects
    """
    if request.method == 'GET':
        # Get multiple projects by IDs
        project_ids = request.query_params.get('ids', '').split(',')
        if project_ids and project_ids[0]:
            projects = Project.objects.filter(id__in=project_ids)
            serializer = ProjectSerializer(projects, many=True)
            return Response(serializer.data)
        return Response({'error': 'No project IDs provided'}, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'POST':
        # Bulk create projects
        if not isinstance(request.data, list):
            return Response(
                {'error': 'Expected a list of projects'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        created_projects = []
        errors = []
        
        for project_data in request.data:
            serializer = ProjectSerializer(data=project_data, context={'request': request})
            if serializer.is_valid():
                project = serializer.save(created_by=request.user)
                created_projects.append(ProjectSerializer(project).data)
            else:
                errors.append({
                    'data': project_data,
                    'errors': serializer.errors
                })
        
        return Response({
            'created': created_projects,
            'errors': errors,
            'total_created': len(created_projects),
            'total_errors': len(errors)
        }, status=status.HTTP_201_CREATED if created_projects else status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def project_bulk_delete(request):
    """
    Bulk delete projects by IDs
    """
    project_ids = request.data.get('ids', [])
    
    if not project_ids:
        return Response(
            {'error': 'No project IDs provided'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    deleted_count = Project.objects.filter(id__in=project_ids).delete()[0]
    
    return Response({
        'message': f'Successfully deleted {deleted_count} projects',
        'deleted_count': deleted_count
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_projects(request):
    """
    Export projects data as CSV/JSON
    Query param: format (json/csv)
    """
    queryset = Project.objects.all()
    
    # Apply filters similar to list view
    ministry_id = request.query_params.get('ministry')
    if ministry_id:
        queryset = queryset.filter(
            deliverable__priority_area__ministry_id=ministry_id
        )
    
    year = request.query_params.get('year')
    if year:
        queryset = queryset.filter(year=year)
    
    quarter = request.query_params.get('quarter')
    if quarter:
        queryset = queryset.filter(quarter=quarter)
    
    serializer = ProjectSerializer(queryset, many=True)
    format_type = request.query_params.get('format', 'json')
    
    if format_type == 'csv':
        # For CSV export, you'd need to generate CSV response
        # I'll implement this when we set up the reports app
        return Response({
            'message': 'CSV export coming soon',
            'data': serializer.data
        })
    
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    """
    Get dashboard statistics
    """
    total_ministries = Ministry.objects.count()
    total_priority_areas = PriorityArea.objects.count()
    total_deliverables = Deliverable.objects.count()
    total_projects = Project.objects.count()
    
    # Projects by year
    projects_by_year = Project.objects.values('year').annotate(
        count=Count('id')
    ).order_by('-year')
    
    # Performance distribution
    performance_distribution = Project.objects.exclude(
        performance_rating__isnull=True
    ).values('performance_rating').annotate(
        count=Count('id')
    ).order_by('performance_rating')
    
    # Recent projects
    recent_projects = Project.objects.all().order_by('-created_at')[:5]
    recent_projects_data = ProjectSerializer(recent_projects, many=True).data
    
    return Response({
        'total_ministries': total_ministries,
        'total_priority_areas': total_priority_areas,
        'total_deliverables': total_deliverables,
        'total_projects': total_projects,
        'projects_by_year': projects_by_year,
        'performance_distribution': performance_distribution,
        'recent_projects': recent_projects_data,
    })