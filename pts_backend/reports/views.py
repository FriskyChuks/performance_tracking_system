# reports/views.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Sum, Avg, Count, Q
from django.http import HttpResponse
from accounts.utils import get_user_role
import io
import pandas as pd
from reportlab.lib import colors
from reportlab.lib.pagesizes import landscape, letter
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from datetime import datetime
import logging

from main.models import ProjectInitiative, DeliverableQuarter, Department, Agency, PriorityArea, Deliverable

logger = logging.getLogger(__name__)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_report_data(request, report_type):
    """Get report data based on type and user role"""
    user = request.user
    user_role = get_user_role(user)
    
    # Base queryset - filter by user's department/agency for non-admin
    if user_role in ['staff', 'director', 'sector_expert']:
        if user.assigned_department:
            initiatives = ProjectInitiative.objects.filter(department=user.assigned_department)
            deliverables = DeliverableQuarter.objects.filter(initiative__department=user.assigned_department)
        elif user.assigned_agency:
            initiatives = ProjectInitiative.objects.filter(agency=user.assigned_agency)
            deliverables = DeliverableQuarter.objects.filter(initiative__agency=user.assigned_agency)
        else:
            initiatives = ProjectInitiative.objects.none()
            deliverables = DeliverableQuarter.objects.none()
    else:
        initiatives = ProjectInitiative.objects.all()
        deliverables = DeliverableQuarter.objects.all()
    
    # Apply filters from request
    year = request.query_params.get('year')
    if year:
        initiatives = initiatives.filter(start_date__year=year)
        deliverables = deliverables.filter(year=year)
    
    department_id = request.query_params.get('department')
    if department_id:
        initiatives = initiatives.filter(department_id=department_id)
        deliverables = deliverables.filter(initiative__department_id=department_id)
    
    agency_id = request.query_params.get('agency')
    if agency_id:
        initiatives = initiatives.filter(agency_id=agency_id)
        deliverables = deliverables.filter(initiative__agency_id=agency_id)
    
    priority_area_id = request.query_params.get('priority_area')
    if priority_area_id:
        initiatives = initiatives.filter(priority_area_id=priority_area_id)
    
    if report_type == 'department':
        return get_department_report(initiatives, deliverables)
    elif report_type == 'agency':
        return get_agency_report(initiatives, deliverables)
    elif report_type == 'priority_area':
        return get_priority_area_report(initiatives, deliverables)
    elif report_type == 'deliverable':
        return get_deliverable_report(deliverables)
    elif report_type == 'quarterly':
        return get_quarterly_report(initiatives, deliverables)
    elif report_type == 'summary':
        return get_summary_report(initiatives, deliverables)
    
    return Response({'error': 'Invalid report type'}, status=400)


def get_department_report(initiatives, deliverables):
    """Get report grouped by department"""
    departments = Department.objects.all()
    report_data = []
    
    for dept in departments:
        dept_initiatives = initiatives.filter(department=dept)
        dept_deliverables = deliverables.filter(initiative__department=dept)
        
        report_data.append({
            'id': dept.id,
            'name': dept.name,
            'initiative_count': dept_initiatives.count(),
            'project_count': dept_initiatives.filter(initiative_type='project').count(),
            'program_count': dept_initiatives.filter(initiative_type='program').count(),
            'completed_count': dept_initiatives.filter(status='completed').count(),
            'ongoing_count': dept_initiatives.filter(status='ongoing').count(),
            'avg_rating': dept_initiatives.exclude(performance_rating__isnull=True).aggregate(avg=Avg('performance_rating'))['avg'] or 0,
            'total_target': dept_deliverables.aggregate(total=Sum('target_value'))['total'] or 0,
            'total_actual': dept_deliverables.aggregate(total=Sum('actual_value'))['total'] or 0,
            'avg_achievement': dept_deliverables.aggregate(avg=Avg('achievement_percentage'))['avg'] or 0,
        })
    
    return Response(report_data)


def get_agency_report(initiatives, deliverables):
    """Get report grouped by agency"""
    agencies = Agency.objects.all()
    report_data = []
    
    for agency in agencies:
        agency_initiatives = initiatives.filter(agency=agency)
        agency_deliverables = deliverables.filter(initiative__agency=agency)
        
        report_data.append({
            'id': agency.id,
            'name': agency.name,
            'initiative_count': agency_initiatives.count(),
            'project_count': agency_initiatives.filter(initiative_type='project').count(),
            'program_count': agency_initiatives.filter(initiative_type='program').count(),
            'completed_count': agency_initiatives.filter(status='completed').count(),
            'ongoing_count': agency_initiatives.filter(status='ongoing').count(),
            'avg_rating': agency_initiatives.exclude(performance_rating__isnull=True).aggregate(avg=Avg('performance_rating'))['avg'] or 0,
            'total_target': agency_deliverables.aggregate(total=Sum('target_value'))['total'] or 0,
            'total_actual': agency_deliverables.aggregate(total=Sum('actual_value'))['total'] or 0,
            'avg_achievement': agency_deliverables.aggregate(avg=Avg('achievement_percentage'))['avg'] or 0,
        })
    
    return Response(report_data)


def get_priority_area_report(initiatives, deliverables):
    """Get report grouped by priority area"""
    priority_areas = PriorityArea.objects.all()
    report_data = []
    
    for pa in priority_areas:
        pa_initiatives = initiatives.filter(priority_area=pa)
        pa_deliverables = deliverables.filter(initiative__priority_area=pa)
        
        report_data.append({
            'id': pa.id,
            'name': pa.name,
            'initiative_count': pa_initiatives.count(),
            'completed_count': pa_initiatives.filter(status='completed').count(),
            'ongoing_count': pa_initiatives.filter(status='ongoing').count(),
            'avg_rating': pa_initiatives.exclude(performance_rating__isnull=True).aggregate(avg=Avg('performance_rating'))['avg'] or 0,
            'total_target': pa_deliverables.aggregate(total=Sum('target_value'))['total'] or 0,
            'total_actual': pa_deliverables.aggregate(total=Sum('actual_value'))['total'] or 0,
            'avg_achievement': pa_deliverables.aggregate(avg=Avg('achievement_percentage'))['avg'] or 0,
        })
    
    return Response(report_data)


def get_deliverable_report(deliverables):
    """Get detailed report by deliverable"""
    deliverable_list = Deliverable.objects.all()
    report_data = []
    
    for del_item in deliverable_list:
        del_quarters = deliverables.filter(deliverable=del_item)
        
        report_data.append({
            'id': del_item.id,
            'name': del_item.name,
            'priority_area': del_item.priority_area.name if del_item.priority_area else '',
            'target_value': del_item.target_value,
            'unit': del_item.unit,
            'deadline': del_item.deadline,
            'is_achieved': del_item.is_achieved,
            'q1_target': del_quarters.filter(quarter=1).first().target_value if del_quarters.filter(quarter=1).exists() else 0,
            'q1_actual': del_quarters.filter(quarter=1).first().actual_value if del_quarters.filter(quarter=1).exists() else 0,
            'q2_target': del_quarters.filter(quarter=2).first().target_value if del_quarters.filter(quarter=2).exists() else 0,
            'q2_actual': del_quarters.filter(quarter=2).first().actual_value if del_quarters.filter(quarter=2).exists() else 0,
            'q3_target': del_quarters.filter(quarter=3).first().target_value if del_quarters.filter(quarter=3).exists() else 0,
            'q3_actual': del_quarters.filter(quarter=3).first().actual_value if del_quarters.filter(quarter=3).exists() else 0,
            'q4_target': del_quarters.filter(quarter=4).first().target_value if del_quarters.filter(quarter=4).exists() else 0,
            'q4_actual': del_quarters.filter(quarter=4).first().actual_value if del_quarters.filter(quarter=4).exists() else 0,
            'annual_target': del_quarters.aggregate(total=Sum('target_value'))['total'] or 0,
            'annual_actual': del_quarters.aggregate(total=Sum('actual_value'))['total'] or 0,
            'achievement_percentage': del_quarters.aggregate(avg=Avg('achievement_percentage'))['avg'] or 0,
        })
    
    return Response(report_data)


def get_quarterly_report(initiatives, deliverables):
    """Get quarterly performance report"""
    quarters_data = []
    
    for quarter in range(1, 5):
        quarter_deliverables = deliverables.filter(quarter=quarter)
        quarter_initiatives = initiatives.filter(
            Q(start_date__quarter=quarter) | Q(quarterly_progress__quarter=quarter)
        ).distinct()
        
        quarters_data.append({
            'quarter': quarter,
            'name': f'Q{quarter}',
            'initiative_count': quarter_initiatives.count(),
            'deliverable_count': quarter_deliverables.count(),
            'total_target': quarter_deliverables.aggregate(total=Sum('target_value'))['total'] or 0,
            'total_actual': quarter_deliverables.aggregate(total=Sum('actual_value'))['total'] or 0,
            'avg_achievement': quarter_deliverables.aggregate(avg=Avg('achievement_percentage'))['avg'] or 0,
            'completed_count': quarter_deliverables.filter(status='approved').count(),
            'pending_count': quarter_deliverables.filter(status='submitted').count(),
            'draft_count': quarter_deliverables.filter(status='draft').count(),
        })
    
    return Response(quarters_data)


def get_summary_report(initiatives, deliverables):
    """Get overall summary statistics"""
    total_initiatives = initiatives.count()
    total_projects = initiatives.filter(initiative_type='project').count()
    total_programs = initiatives.filter(initiative_type='program').count()
    completed = initiatives.filter(status='completed').count()
    ongoing = initiatives.filter(status='ongoing').count()
    planning = initiatives.filter(status='planning').count()
    
    total_target = deliverables.aggregate(total=Sum('target_value'))['total'] or 0
    total_actual = deliverables.aggregate(total=Sum('actual_value'))['total'] or 0
    overall_achievement = (total_actual / total_target * 100) if total_target > 0 else 0
    
    # Rating distribution
    rating_distribution = {
        'Excellent (5)': initiatives.filter(performance_rating=5).count(),
        'Very Good (4)': initiatives.filter(performance_rating=4).count(),
        'Good (3)': initiatives.filter(performance_rating=3).count(),
        'Fair (2)': initiatives.filter(performance_rating=2).count(),
        'Poor (1)': initiatives.filter(performance_rating=1).count(),
    }
    
    # Quarterly performance trend
    quarterly_trend = []
    for quarter in range(1, 5):
        quarter_deliverables = deliverables.filter(quarter=quarter)
        quarterly_trend.append({
            'quarter': f'Q{quarter}',
            'achievement': quarter_deliverables.aggregate(avg=Avg('achievement_percentage'))['avg'] or 0,
            'deliverables': quarter_deliverables.count(),
        })
    
    return Response({
        'summary': {
            'total_initiatives': total_initiatives,
            'total_projects': total_projects,
            'total_programs': total_programs,
            'completed': completed,
            'ongoing': ongoing,
            'planning': planning,
            'completion_rate': (completed / total_initiatives * 100) if total_initiatives > 0 else 0,
            'total_target': total_target,
            'total_actual': total_actual,
            'overall_achievement': overall_achievement,
            'avg_rating': initiatives.exclude(performance_rating__isnull=True).aggregate(avg=Avg('performance_rating'))['avg'] or 0,
        },
        'rating_distribution': rating_distribution,
        'quarterly_trend': quarterly_trend,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_report(request, report_type):
    """Export report as PDF or Excel"""
    try:
        logger.info(f"Export report called - Type: {report_type}, Params: {request.query_params}")
        
        format_type = request.query_params.get('format', 'excel')
        
        # Manually rebuild the request for get_report_data
        # Create a mock request with the same parameters
        from rest_framework.request import Request
        
        # Get the report data by calling the report function directly
        user = request.user
        user_role = get_user_role(user)
        
        # Build the querysets manually (same logic as get_report_data)
        if user_role in ['staff', 'director', 'sector_expert']:
            if user.assigned_department:
                initiatives = ProjectInitiative.objects.filter(department=user.assigned_department)
                deliverables = DeliverableQuarter.objects.filter(initiative__department=user.assigned_department)
            elif user.assigned_agency:
                initiatives = ProjectInitiative.objects.filter(agency=user.assigned_agency)
                deliverables = DeliverableQuarter.objects.filter(initiative__agency=user.assigned_agency)
            else:
                initiatives = ProjectInitiative.objects.none()
                deliverables = DeliverableQuarter.objects.none()
        else:
            initiatives = ProjectInitiative.objects.all()
            deliverables = DeliverableQuarter.objects.all()
        
        # Apply filters
        year = request.query_params.get('year')
        if year:
            initiatives = initiatives.filter(start_date__year=year)
            deliverables = deliverables.filter(year=year)
        
        department_id = request.query_params.get('department')
        if department_id:
            initiatives = initiatives.filter(department_id=department_id)
            deliverables = deliverables.filter(initiative__department_id=department_id)
        
        agency_id = request.query_params.get('agency')
        if agency_id:
            initiatives = initiatives.filter(agency_id=agency_id)
            deliverables = deliverables.filter(initiative__agency_id=agency_id)
        
        priority_area_id = request.query_params.get('priority_area')
        if priority_area_id:
            initiatives = initiatives.filter(priority_area_id=priority_area_id)
        
        # Get the report data based on type
        if report_type == 'department':
            report_data = get_department_report(initiatives, deliverables).data
        elif report_type == 'agency':
            report_data = get_agency_report(initiatives, deliverables).data
        elif report_type == 'priority_area':
            report_data = get_priority_area_report(initiatives, deliverables).data
        elif report_type == 'deliverable':
            report_data = get_deliverable_report(deliverables).data
        elif report_type == 'quarterly':
            report_data = get_quarterly_report(initiatives, deliverables).data
        elif report_type == 'summary':
            report_data = get_summary_report(initiatives, deliverables).data
        else:
            return Response({'error': 'Invalid report type'}, status=400)
        
        if format_type == 'excel':
            return export_to_excel(report_data, report_type)
        else:
            return export_to_pdf(report_data, report_type)
            
    except Exception as e:
        logger.error(f"Export error: {str(e)}", exc_info=True)
        return Response({'error': f'Export failed: {str(e)}'}, status=500)


def export_to_excel(report_data, report_type):
    """Export report data to Excel with multiple sheets"""
    try:
        output = io.BytesIO()
        
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            if report_type == 'summary' and isinstance(report_data, dict):
                # Summary report - multiple sheets
                summary_df = pd.DataFrame([report_data.get('summary', {})])
                summary_df.to_excel(writer, sheet_name='Summary', index=False)
                
                rating_df = pd.DataFrame(report_data.get('rating_distribution', {}).items(), columns=['Rating', 'Count'])
                rating_df.to_excel(writer, sheet_name='Rating Distribution', index=False)
                
                quarterly_df = pd.DataFrame(report_data.get('quarterly_trend', []))
                quarterly_df.to_excel(writer, sheet_name='Quarterly Trend', index=False)
                
            elif report_type == 'deliverable' and isinstance(report_data, list):
                df = pd.DataFrame(report_data)
                # Reorder columns for better readability
                column_order = ['name', 'priority_area', 'q1_target', 'q1_actual', 'q2_target', 'q2_actual', 
                               'q3_target', 'q3_actual', 'q4_target', 'q4_actual', 'achievement_percentage']
                # Only include columns that exist
                existing_columns = [c for c in column_order if c in df.columns]
                df = df[existing_columns]
                df.to_excel(writer, sheet_name='Deliverables', index=False)
                
            elif isinstance(report_data, list):
                if len(report_data) > 0:
                    df = pd.DataFrame(report_data)
                    df.to_excel(writer, sheet_name=report_type.title(), index=False)
                else:
                    # Create empty dataframe with message
                    pd.DataFrame({'Message': ['No data available']}).to_excel(writer, sheet_name=report_type.title(), index=False)
        
        output.seek(0)
        response = HttpResponse(output.read(), content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        response['Content-Disposition'] = f'attachment; filename={report_type}_report_{datetime.now().strftime("%Y%m%d_%H%M%S")}.xlsx'
        return response
        
    except Exception as e:
        logger.error(f"Excel export error: {str(e)}")
        raise


def export_to_pdf(report_data, report_type):
    """Export report data to PDF"""
    try:
        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename={report_type}_report_{datetime.now().strftime("%Y%m%d_%H%M%S")}.pdf'
        
        doc = SimpleDocTemplate(response, pagesize=landscape(letter))
        styles = getSampleStyleSheet()
        story = []
        
        # Title style
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=16,
            textColor=colors.HexColor('#22c55e'),
            alignment=1,
            spaceAfter=30
        )
        
        # Add title
        story.append(Paragraph(f"{report_type.upper()} REPORT", title_style))
        story.append(Spacer(1, 20))
        
        # Add generation timestamp
        timestamp_style = ParagraphStyle(
            'Timestamp',
            parent=styles['Normal'],
            fontSize=9,
            textColor=colors.gray,
            alignment=1
        )
        story.append(Paragraph(f"Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", timestamp_style))
        story.append(Spacer(1, 20))
        
        if report_type == 'summary' and isinstance(report_data, dict):
            # Summary statistics table
            summary = report_data.get('summary', {})
            summary_data = [
                ['Metric', 'Value'],
                ['Total Initiatives', summary.get('total_initiatives', 0)],
                ['Total Projects', summary.get('total_projects', 0)],
                ['Total Programs', summary.get('total_programs', 0)],
                ['Completed Initiatives', summary.get('completed', 0)],
                ['Ongoing Initiatives', summary.get('ongoing', 0)],
                ['Planning Initiatives', summary.get('planning', 0)],
                ['Completion Rate', f"{summary.get('completion_rate', 0):.1f}%"],
                ['Average Rating', f"{summary.get('avg_rating', 0):.1f}/5"],
                ['Overall Achievement', f"{summary.get('overall_achievement', 0):.1f}%"],
                ['Total Target', summary.get('total_target', 0)],
                ['Total Actual', summary.get('total_actual', 0)],
            ]
            
            table = Table(summary_data, colWidths=[200, 150])
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#22c55e')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 10),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ]))
            story.append(table)
            story.append(Spacer(1, 20))
            
            # Rating distribution table
            rating_data = [['Rating', 'Count']]
            for rating, count in report_data.get('rating_distribution', {}).items():
                rating_data.append([rating, count])
            
            if len(rating_data) > 1:
                rating_table = Table(rating_data, colWidths=[200, 150])
                rating_table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#22c55e')),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('GRID', (0, 0), (-1, -1), 1, colors.black),
                ]))
                story.append(rating_table)
            
        elif isinstance(report_data, list) and len(report_data) > 0:
            # Convert list of dicts to table data
            headers = list(report_data[0].keys())
            # Limit headers to avoid PDF being too wide
            max_headers = 8
            if len(headers) > max_headers:
                headers = headers[:max_headers]
            
            data = [headers]
            for item in report_data:
                row = []
                for h in headers:
                    val = item.get(h, '')
                    if isinstance(val, float):
                        val = f"{val:.1f}"
                    elif isinstance(val, (int, str)):
                        val = str(val)
                    else:
                        val = ''
                    # Truncate long text
                    if len(str(val)) > 30:
                        val = str(val)[:27] + '...'
                    row.append(val)
                data.append(row)
            
            # Limit rows to avoid PDF issues
            if len(data) > 50:
                data = data[:51]
            
            # Calculate column widths based on content
            col_widths = []
            for i in range(len(headers)):
                max_len = len(headers[i])
                for row in data[1:10]:  # Sample first 10 rows
                    if i < len(row) and len(str(row[i])) > max_len:
                        max_len = len(str(row[i]))
                col_widths.append(min(max_len * 6, 100))
            
            table = Table(data, colWidths=col_widths)
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#22c55e')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 8),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ]))
            story.append(table)
        else:
            # No data available
            no_data_style = ParagraphStyle('NoData', parent=styles['Normal'], alignment=1, fontSize=12, textColor=colors.gray)
            story.append(Paragraph("No data available for the selected filters", no_data_style))
        
        doc.build(story)
        return response
        
    except Exception as e:
        logger.error(f"PDF export error: {str(e)}")
        raise