# main/admin.py
from django.contrib import admin
from django.urls import reverse
from django.utils.html import format_html
from django.utils import timezone
from django.db.models import Count, Avg
from .models import (
    FederalPriorityArea,
    Department,
    Agency,
    Deliverable,
    Indicator,
    ProjectActivity,
    IndicatorQuarterlyProgress,
    IndicatorAnnualSummary,
    DeliverableAnnualReport,
    FederalPriorityAreaAnnualReport
)


class BaseAdmin(admin.ModelAdmin):
    """Base admin class with common functionality"""
    save_on_top = True
    readonly_fields = ('created_at', 'updated_at')
    
    def save_model(self, request, obj, form, change):
        if not change:  # New object
            if hasattr(obj, 'created_by') and not obj.created_by_id:
                obj.created_by = request.user
            if hasattr(obj, 'updated_by') and not obj.updated_by_id:
                obj.updated_by = request.user
        else:  # Existing object
            if hasattr(obj, 'updated_by'):
                obj.updated_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(FederalPriorityArea)
class FederalPriorityAreaAdmin(BaseAdmin):
    list_display = ('name', 'code', 'is_primary_for_ministry', 'order', 'created_at')
    list_filter = ('is_primary_for_ministry', 'created_at')
    search_fields = ('name', 'code', 'description')
    list_editable = ('is_primary_for_ministry', 'order')
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'description', 'code')
        }),
        ('Ministry Focus', {
            'fields': ('is_primary_for_ministry', 'order'),
            'description': 'Indicate if this is one of the 3 primary focus areas for the Ministry'
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(Department)
class DepartmentAdmin(BaseAdmin):
    list_display = ('name', 'code', 'activity_count', 'created_at')
    search_fields = ('name', 'code', 'description')
    readonly_fields = ('created_at', 'updated_at', 'activity_count')
    
    def activity_count(self, obj):
        count = obj.activities.count()
        url = reverse('admin:main_projectactivity_changelist') + f'?department__id__exact={obj.id}'
        return format_html('<a href="{}">{} activities</a>', url, count)
    activity_count.short_description = 'Activities'


@admin.register(Agency)
class AgencyAdmin(BaseAdmin):
    list_display = ('name', 'code', 'website', 'activity_count', 'created_at')
    search_fields = ('name', 'code', 'description', 'website')
    list_filter = ('created_at',)
    
    def activity_count(self, obj):
        count = obj.activities.count()
        url = reverse('admin:main_projectactivity_changelist') + f'?agency__id__exact={obj.id}'
        return format_html('<a href="{}">{} activities</a>', url, count)
    activity_count.short_description = 'Activities'


class IndicatorInline(admin.TabularInline):
    model = Indicator
    extra = 1
    fields = ('name', 'measurement_type', 'target_value', 'target_year', 'order')
    show_change_link = True


@admin.register(Deliverable)
class DeliverableAdmin(BaseAdmin):
    list_display = ('name', 'federal_priority_area', 'code', 'indicator_count', 'created_at')
    list_filter = ('federal_priority_area', 'created_at')
    search_fields = ('name', 'code', 'description')
    inlines = [IndicatorInline]
    
    def indicator_count(self, obj):
        return obj.indicators.count()
    indicator_count.short_description = '# Indicators'


@admin.register(Indicator)
class IndicatorAdmin(BaseAdmin):
    list_display = ('name', 'deliverable', 'measurement_type', 'target_value', 'target_year', 'order')
    list_filter = ('measurement_type', 'target_year', 'is_cumulative', 'deliverable__federal_priority_area')
    search_fields = ('name', 'description', 'deliverable__name')
    fieldsets = (
        ('Basic Information', {
            'fields': ('deliverable', 'name', 'description', 'measurement_type', 'unit', 'order')
        }),
        ('Baseline and Targets', {
            'fields': ('baseline_value', 'baseline_year', 'target_value', 'target_year', 'target_boolean')
        }),
        ('Quarterly Targets', {
            'fields': ('q1_target', 'q2_target', 'q3_target', 'q4_target'),
            'classes': ('collapse',),
            'description': 'Optional: Set specific targets for each quarter'
        }),
        ('Tracking Settings', {
            'fields': ('is_cumulative',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


class QuarterlyProgressInline(admin.TabularInline):
    model = IndicatorQuarterlyProgress
    extra = 0
    fields = ('quarter', 'year', 'actual_value', 'cumulative_percentage', 'status', 'auto_rating')
    readonly_fields = ('cumulative_percentage', 'auto_rating', 'created_at', 'updated_at')
    show_change_link = True
    can_delete = False
    
    def has_add_permission(self, request, obj=None):
        return False  # Use the action to create quarterly progress


@admin.register(ProjectActivity)
class ProjectActivityAdmin(BaseAdmin):
    list_display = ('title', 'activity_type', 'department', 'agency', 'status', 
                   'start_date', 'end_date', 'completion_percentage_display', 
                   'overall_performance', 'quarterly_progress_status')
    list_filter = ('activity_type', 'status', 'funding_source', 'department', 'agency', 
                  'start_date', 'end_date')
    search_fields = ('title', 'code', 'description', 'location_address')
    filter_horizontal = ('indicators',)
    readonly_fields = ('created_at', 'updated_at', 'created_by', 'updated_by', 
                      'completion_percentage_display', 'overall_performance')
    actions = ['create_quarterly_progress_for_all', 'mark_as_ongoing', 'mark_as_completed']
    
    fieldsets = (
        ('Activity Information', {
            'fields': ('activity_type', 'title', 'description', 'code')
        }),
        ('Organizational Assignment', {
            'fields': ('department', 'agency')
        }),
        ('Indicators', {
            'fields': ('indicators',),
            'description': 'Select which indicators this activity measures'
        }),
        ('Financial Information (for Projects)', {
            'fields': ('funding_source', 'budget'),
            'classes': ('collapse',)
        }),
        ('Program Details (for Programs)', {
            'fields': ('program_goal',),
            'classes': ('collapse',)
        }),
        ('Location', {
            'fields': ('latitude', 'longitude', 'location_address', 'location_description'),
            'classes': ('collapse',)
        }),
        ('Timeline', {
            'fields': ('start_date', 'end_date', 'status')
        }),
        ('Performance', {
            'fields': ('completion_percentage_display', 'overall_performance'),
            'classes': ('collapse',)
        }),
        ('Tracking', {
            'fields': ('created_by', 'updated_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def save_model(self, request, obj, form, change):
        if not change:
            obj.created_by = request.user
        obj.updated_by = request.user
        super().save_model(request, obj, form, change)
    
    def completion_percentage_display(self, obj):
        percentage = obj.completion_percentage
        color = 'green' if percentage >= 75 else 'orange' if percentage >= 50 else 'red'
        return format_html('<span style="color: {}; font-weight: bold;">{}%</span>', color, percentage)
    completion_percentage_display.short_description = 'Timeline Completion'
    
    def overall_performance(self, obj):
        performance = obj.overall_annual_performance
        if performance >= 90:
            color = 'green'
        elif performance >= 75:
            color = 'orange'
        else:
            color = 'red'
        return format_html('<span style="color: {}; font-weight: bold;">{}%</span>', color, performance)
    overall_performance.short_description = 'Annual Performance'
    
    def quarterly_progress_status(self, obj):
        """Show quarterly progress submission status"""
        current_year = timezone.now().year
        current_quarter = (timezone.now().month - 1) // 3 + 1
        progress = IndicatorQuarterlyProgress.objects.filter(
            activity=obj,
            year=current_year,
            quarter=current_quarter
        )
        if progress.exists():
            statuses = progress.values_list('status', flat=True)
            if 'draft' in statuses:
                return format_html('<span style="color: orange;">⚠️ Draft</span>')
            elif 'submitted' in statuses:
                return format_html('<span style="color: blue;">📤 Submitted</span>')
            elif 'approved' in statuses:
                return format_html('<span style="color: green;">✅ Approved</span>')
        return format_html('<span style="color: gray;">❌ Not Started</span>')
    quarterly_progress_status.short_description = 'Q{} {} Status'.format(
        (timezone.now().month - 1) // 3 + 1, timezone.now().year
    )
    
    def create_quarterly_progress_for_all(self, request, queryset):
        """Admin action to create quarterly progress records"""
        year = timezone.now().year
        count = 0
        for activity in queryset:
            activity.create_quarterly_progress(year=year)
            count += 1
        self.message_user(request, f'Created quarterly progress for {count} activities for {year}')
    create_quarterly_progress_for_all.short_description = 'Create quarterly progress records for selected activities'
    
    def mark_as_ongoing(self, request, queryset):
        count = queryset.update(status='ongoing')
        self.message_user(request, f'Marked {count} activities as ongoing')
    mark_as_ongoing.short_description = 'Mark selected activities as Ongoing'
    
    def mark_as_completed(self, request, queryset):
        count = queryset.update(status='completed')
        self.message_user(request, f'Marked {count} activities as completed')
    mark_as_completed.short_description = 'Mark selected activities as Completed'


@admin.register(IndicatorQuarterlyProgress)
class IndicatorQuarterlyProgressAdmin(BaseAdmin):
    list_display = ('activity', 'indicator', 'quarter', 'year', 'actual_value', 
                   'cumulative_percentage', 'auto_rating', 'status', 'expert_assessed')
    list_filter = ('quarter', 'year', 'status', 'expert_assessed', 'data_accuracy')
    search_fields = ('activity__title', 'indicator__name', 'staff_comment', 
                    'expert_comment')
    readonly_fields = ('cumulative_actual', 'cumulative_percentage', 'auto_rating', 
                      'created_at', 'updated_at')
    raw_id_fields = ('activity', 'indicator', 'approved_by', 'expert_assessed_by', 'updated_by')
    
    fieldsets = (
        ('Progress Information', {
            'fields': ('activity', 'indicator', 'quarter', 'year', 'quarterly_target')
        }),
        ('Actual Achievement', {
            'fields': ('actual_value', 'actual_boolean')
        }),
        ('Automated Calculations', {
            'fields': ('cumulative_actual', 'cumulative_percentage', 'auto_rating'),
            'classes': ('collapse',)
        }),
        ('Status and Review', {
            'fields': ('status', 'submitted_at', 'approved_at', 'approved_by', 
                      'staff_comment', 'updated_by')
        }),
        ('Expert Assessment', {
            'fields': ('expert_assessed', 'expert_assessed_at', 'expert_assessed_by',
                      'expert_rating', 'expert_comment', 'expert_recommendations',
                      'data_accuracy', 'effort_percentage'),
            'classes': ('collapse',)
        }),
        ('Supporting Materials', {
            'fields': ('progress_images', 'supporting_documents'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['approve_selected', 'submit_for_review', 'mark_as_expert_assessed']
    
    def approve_selected(self, request, queryset):
        count = queryset.update(status='approved', approved_at=timezone.now(), approved_by=request.user)
        self.message_user(request, f'Approved {count} progress records')
    approve_selected.short_description = 'Approve selected progress records'
    
    def submit_for_review(self, request, queryset):
        count = queryset.update(status='submitted', submitted_at=timezone.now())
        self.message_user(request, f'Submitted {count} progress records for review')
    submit_for_review.short_description = 'Submit selected records for review'
    
    def mark_as_expert_assessed(self, request, queryset):
        count = queryset.update(expert_assessed=True, expert_assessed_at=timezone.now(), 
                               expert_assessed_by=request.user)
        self.message_user(request, f'Marked {count} records as expert assessed')
    mark_as_expert_assessed.short_description = 'Mark selected as Expert Assessed'


@admin.register(IndicatorAnnualSummary)
class IndicatorAnnualSummaryAdmin(BaseAdmin):
    list_display = ('indicator', 'activity', 'year', 'year_end_percentage', 
                   'overall_rating', 'is_complete')
    list_filter = ('year', 'is_complete')
    search_fields = ('indicator__name', 'activity__title')
    readonly_fields = ('annual_target', 'annual_actual', 'q1_achievement', 'q2_achievement',
                      'q3_achievement', 'q4_achievement', 'average_quarterly_achievement',
                      'year_end_percentage', 'auto_rating', 'overall_rating')
    
    fieldsets = (
        ('Summary Information', {
            'fields': ('indicator', 'activity', 'year')
        }),
        ('Annual Performance', {
            'fields': ('annual_target', 'annual_actual', 'year_end_percentage')
        }),
        ('Quarterly Breakdown', {
            'fields': ('q1_achievement', 'q2_achievement', 'q3_achievement', 'q4_achievement',
                      'average_quarterly_achievement')
        }),
        ('Ratings', {
            'fields': ('auto_rating', 'expert_rating', 'overall_rating')
        }),
        ('Expert Assessment', {
            'fields': ('expert_annual_comment', 'expert_annual_recommendations')
        }),
        ('Status', {
            'fields': ('is_complete', 'completed_at')
        }),
    )
    
    actions = ['mark_as_complete']
    
    def mark_as_complete(self, request, queryset):
        count = queryset.update(is_complete=True, completed_at=timezone.now())
        self.message_user(request, f'Marked {count} annual summaries as complete')
    mark_as_complete.short_description = 'Mark selected summaries as Complete'


@admin.register(DeliverableAnnualReport)
class DeliverableAnnualReportAdmin(BaseAdmin):
    list_display = ('deliverable', 'year', 'average_achievement', 'overall_rating', 
                   'is_finalized')
    list_filter = ('year', 'is_finalized')
    search_fields = ('deliverable__name', 'summary', 'challenges')
    readonly_fields = ('created_at', 'updated_at', 'finalized_at')
    
    fieldsets = (
        ('Report Information', {
            'fields': ('deliverable', 'year')
        }),
        ('Performance Metrics', {
            'fields': ('total_indicators', 'completed_indicators', 
                      'average_achievement', 'overall_rating')
        }),
        ('Federal Reporting', {
            'fields': ('federal_priority_area_contribution',)
        }),
        ('Narrative', {
            'fields': ('summary', 'challenges', 'recommendations', 'next_year_priorities')
        }),
        ('Finalization', {
            'fields': ('is_finalized', 'finalized_at', 'finalized_by')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['finalize_reports']
    
    def finalize_reports(self, request, queryset):
        count = queryset.update(is_finalized=True, finalized_at=timezone.now(), finalized_by=request.user)
        self.message_user(request, f'Finalized {count} reports')
    finalize_reports.short_description = 'Finalize selected reports'


@admin.register(FederalPriorityAreaAnnualReport)
class FederalPriorityAreaAnnualReportAdmin(BaseAdmin):
    list_display = ('federal_priority_area', 'year', 'average_achievement', 
                   'overall_rating', 'is_submitted_to_fg')
    list_filter = ('year', 'is_submitted_to_fg')
    search_fields = ('federal_priority_area__name', 'ministry_contribution', 
                    'key_achievements')
    readonly_fields = ('created_at', 'updated_at', 'submitted_to_fg_at')
    
    fieldsets = (
        ('Report Information', {
            'fields': ('federal_priority_area', 'year')
        }),
        ('Performance Metrics', {
            'fields': ('total_deliverables', 'total_indicators', 
                      'average_achievement', 'overall_rating')
        }),
        ('Ministry Contribution Narrative', {
            'fields': ('ministry_contribution', 'key_achievements', 'challenges_and_gaps')
        }),
        ('Federal Government Submission', {
            'fields': ('is_submitted_to_fg', 'submitted_to_fg_at')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['submit_to_federal_government']
    
    def submit_to_federal_government(self, request, queryset):
        count = queryset.update(is_submitted_to_fg=True, submitted_to_fg_at=timezone.now())
        self.message_user(request, f'Submitted {count} reports to Federal Government')
    submit_to_federal_government.short_description = 'Submit to Federal Government'


# Optional: Custom admin site header
admin.site.site_header = 'Ministry Performance Management System'
admin.site.site_title = 'Performance Dashboard'
admin.site.index_title = 'Welcome to Performance Management System'