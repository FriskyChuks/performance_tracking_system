# main/admin.py
from django.contrib import admin
from django.urls import reverse
from django.utils.html import format_html
from django.utils import timezone
from django.db.models import Count, Avg
from django.contrib.admin import SimpleListFilter
from . import models

# ============== Custom Filters ==============

class InitiativeTypeFilter(SimpleListFilter):
    title = 'Initiative Type'
    parameter_name = 'initiative_type'
    
    def lookups(self, request, model_admin):
        return models.ProjectInitiative.INITIATIVE_TYPES
    
    def queryset(self, request, queryset):
        if self.value():
            return queryset.filter(initiative_type=self.value())
        return queryset

class QuarterFilter(SimpleListFilter):
    title = 'Quarter'
    parameter_name = 'quarter'
    
    def lookups(self, request, model_admin):
        return models.DeliverableQuarter.QUARTER_CHOICES
    
    def queryset(self, request, queryset):
        if self.value():
            return queryset.filter(quarter=self.value())
        return queryset

class PerformanceRatingFilter(SimpleListFilter):
    title = 'Performance Rating'
    parameter_name = 'performance_rating'
    
    def lookups(self, request, model_admin):
        return [(1, 'Poor (1)'), (2, 'Fair (2)'), (3, 'Good (3)'), 
                (4, 'Very Good (4)'), (5, 'Excellent (5)')]
    
    def queryset(self, request, queryset):
        if self.value():
            return queryset.filter(performance_rating=self.value())
        return queryset

# ============== Inline Admins ==============

class DeliverableInline(admin.TabularInline):
    model = models.Deliverable
    extra = 1
    fields = ['name', 'target_value', 'unit', 'deadline', 'is_achieved']
    show_change_link = True

class ProjectInitiativeHistoryInline(admin.TabularInline):
    model = models.ProjectInitiativeHistory
    extra = 0
    fields = ['recorded_date', 'actual_value', 'progress_percentage', 'performance_rating', 'notes']
    readonly_fields = ['recorded_date']
    classes = ['collapse']

class DeliverableQuarterInline(admin.TabularInline):
    model = models.DeliverableQuarter
    extra = 0
    fields = ['deliverable', 'quarter', 'year', 'target_value', 'actual_value', 
              'achievement_percentage', 'status']
    readonly_fields = ['achievement_percentage']
    classes = ['collapse']

class InitiativeQuarterSummaryInline(admin.TabularInline):
    model = models.InitiativeQuarterSummary
    extra = 0
    fields = ['year', 'annual_target', 'annual_actual', 'average_achievement', 
              'overall_rating', 'is_complete']
    readonly_fields = ['year', 'annual_target', 'annual_actual', 'average_achievement', 'overall_rating']
    can_delete = False
    classes = ['collapse']
    show_change_link = True

# ============== Model Admins ==============

@admin.register(models.Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'initiative_count', 'created_at']
    list_filter = ['created_at']
    search_fields = ['name', 'code', 'description']
    readonly_fields = ['created_at', 'updated_at']
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'description', 'code')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def initiative_count(self, obj):
        count = obj.initiatives.count()
        url = reverse('admin:main_projectinitiative_changelist') + f'?department__id={obj.id}'
        return format_html('<a href="{}">{} Initiatives</a>', url, count)
    initiative_count.short_description = 'Initiatives'

@admin.register(models.Agency)
class AgencyAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'website', 'initiative_count', 'created_at']
    list_filter = ['created_at']
    search_fields = ['name', 'code', 'description', 'website']
    readonly_fields = ['created_at', 'updated_at']
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'description', 'code', 'website')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def initiative_count(self, obj):
        count = obj.initiatives.count()
        url = reverse('admin:main_projectinitiative_changelist') + f'?agency__id={obj.id}'
        return format_html('<a href="{}">{} Initiatives</a>', url, count)
    initiative_count.short_description = 'Initiatives'

@admin.register(models.PriorityArea)
class PriorityAreaAdmin(admin.ModelAdmin):
    list_display = ['name', 'order', 'icon', 'color', 'deliverable_count', 'initiative_count']
    list_editable = ['order']
    list_filter = ['created_at']
    search_fields = ['name', 'description']
    readonly_fields = ['created_at', 'updated_at']
    inlines = [DeliverableInline]
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'description', 'icon', 'color', 'order')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def deliverable_count(self, obj):
        return obj.deliverables.count()
    deliverable_count.short_description = 'Deliverables'
    
    def initiative_count(self, obj):
        return obj.initiatives.count()
    initiative_count.short_description = 'Initiatives'

@admin.register(models.Deliverable)
class DeliverableAdmin(admin.ModelAdmin):
    list_display = ['name', 'priority_area', 'target_value', 'unit', 'deadline', 'is_achieved']
    list_filter = ['priority_area', 'is_achieved', 'deadline']
    search_fields = ['name', 'description', 'priority_area__name']
    list_editable = ['is_achieved']
    readonly_fields = ['created_at', 'updated_at']
    fieldsets = (
        ('Basic Information', {
            'fields': ('priority_area', 'name', 'description')
        }),
        ('Target Information', {
            'fields': ('target_value', 'unit', 'deadline', 'is_achieved')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

@admin.register(models.ProjectInitiative)
class ProjectInitiativeAdmin(admin.ModelAdmin):
    list_display = ['title', 'display_type', 'department', 'agency', 'status', 
                   'progress_percentage_display', 'performance_rating_display', 
                   'completion_percentage_display', 'start_date', 'end_date']
    list_filter = [InitiativeTypeFilter, 'status', PerformanceRatingFilter, 
                  'department', 'agency', 'priority_area', 'start_date']
    search_fields = ['title', 'code', 'description', 'location_address']
    readonly_fields = ['created_at', 'updated_at', 'progress_percentage', 'completion_percentage']
    list_editable = ['status']
    list_per_page = 25
    date_hierarchy = 'start_date'
    inlines = [ProjectInitiativeHistoryInline, DeliverableQuarterInline, InitiativeQuarterSummaryInline]
    actions = ['recalculate_progress', 'mark_as_completed', 'export_as_csv']
    
    fieldsets = (
        ('Type & Classification', {
            'fields': ('initiative_type', 'department', 'agency', 'priority_area', 'code')
        }),
        ('Basic Information', {
            'fields': ('title', 'description')
        }),
        ('Project Information (if Project)', {
            'fields': ('funding_source', 'budget'),
            'classes': ('collapse',)
        }),
        ('Program Information (if Program)', {
            'fields': ('program_goal',),
            'classes': ('collapse',)
        }),
        ('Location Information', {
            'fields': ('latitude', 'longitude', 'location_address', 'location_description'),
            'classes': ('wide',)
        }),
        ('Timeline', {
            'fields': ('start_date', 'end_date')
        }),
        ('Performance Metrics', {
            'fields': ('target_value', 'actual_value', 'unit_of_measure', 
                      'progress_percentage', 'completion_percentage', 
                      'performance_rating', 'performance_comment')
        }),
        ('Tracking Information', {
            'fields': ('status', 'created_by', 'updated_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def progress_percentage_display(self, obj):
        if obj.progress_percentage:
            return format_html('<b>{}%</b>', obj.progress_percentage)
        return '0%'
    progress_percentage_display.short_description = 'Progress'
    
    def performance_rating_display(self, obj):
        if obj.performance_rating:
            stars = '★' * obj.performance_rating + '☆' * (5 - obj.performance_rating)
            return format_html('<span style="color: #f5b042;">{}</span> ({})', stars, obj.performance_rating)
        return '-'
    performance_rating_display.short_description = 'Rating'
    
    def completion_percentage_display(self, obj):
        if obj.completion_percentage:
            return format_html('<b>{}%</b>', obj.completion_percentage)
        return '0%'
    completion_percentage_display.short_description = 'Timeline Completion'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'department', 'agency', 'priority_area', 'created_by', 'updated_by'
        )
    
    def save_model(self, request, obj, form, change):
        if not obj.pk:
            obj.created_by = request.user
        obj.updated_by = request.user
        super().save_model(request, obj, form, change)
    
    def recalculate_progress(self, request, queryset):
        for initiative in queryset:
            # Recalculate based on actual_value vs target_value
            if initiative.target_value and initiative.target_value > 0:
                if initiative.actual_value:
                    initiative.progress_percentage = (initiative.actual_value / initiative.target_value) * 100
                else:
                    initiative.progress_percentage = 0
                initiative.save()
        self.message_user(request, f"Progress recalculated for {queryset.count()} initiatives")
    recalculate_progress.short_description = "Recalculate progress percentage"
    
    def mark_as_completed(self, request, queryset):
        updated = queryset.update(status='completed')
        self.message_user(request, f"{updated} initiative(s) marked as completed")
    mark_as_completed.short_description = "Mark selected initiatives as completed"
    
    def export_as_csv(self, request, queryset):
        import csv
        from django.http import HttpResponse
        
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="initiatives_export.csv"'
        
        writer = csv.writer(response)
        writer.writerow(['Title', 'Type', 'Department', 'Agency', 'Status', 
                        'Progress %', 'Performance Rating', 'Start Date', 'End Date', 'Budget'])
        
        for initiative in queryset:
            writer.writerow([
                initiative.title,
                initiative.display_type,
                initiative.department.name if initiative.department else '',
                initiative.agency.name if initiative.agency else '',
                initiative.status,
                initiative.progress_percentage,
                initiative.performance_rating or '',
                initiative.start_date,
                initiative.end_date or '',
                initiative.budget or '',
            ])
        
        return response
    export_as_csv.short_description = "Export selected initiatives to CSV"

@admin.register(models.ProjectInitiativeHistory)
class ProjectInitiativeHistoryAdmin(admin.ModelAdmin):
    list_display = ['initiative', 'recorded_date', 'actual_value', 'progress_percentage', 
                   'performance_rating']
    list_filter = ['recorded_date', 'performance_rating']
    search_fields = ['initiative__title', 'notes']
    readonly_fields = ['recorded_date']
    date_hierarchy = 'recorded_date'
    
    fieldsets = (
        ('Initiative', {
            'fields': ('initiative',)
        }),
        ('Performance Data', {
            'fields': ('actual_value', 'progress_percentage', 'performance_rating', 'notes')
        }),
        ('Timestamp', {
            'fields': ('recorded_date',),
            'classes': ('collapse',)
        }),
    )

@admin.register(models.DeliverableQuarter)
class DeliverableQuarterAdmin(admin.ModelAdmin):
    list_display = ['initiative', 'deliverable', 'year', 'quarter_display', 
                   'target_value', 'actual_value', 'achievement_percentage_display', 'status']
    list_filter = [QuarterFilter, 'year', 'status', 'initiative__department']
    search_fields = ['initiative__title', 'deliverable__name', 'staff_comment']
    list_editable = ['status']
    readonly_fields = ['achievement_percentage', 'created_at', 'updated_at']
    raw_id_fields = ['initiative', 'deliverable', 'approved_by', 'updated_by']
    list_select_related = ['initiative', 'deliverable']
    
    fieldsets = (
        ('Quarter Information', {
            'fields': ('initiative', 'deliverable', 'quarter', 'year')
        }),
        ('Performance Data', {
            'fields': ('target_value', 'actual_value', 'baseline_value', 'unit_of_measure', 
                      'achievement_percentage')
        }),
        ('Status & Comments', {
            'fields': ('status', 'staff_comment', 'progress_images')
        }),
        ('Approval Information', {
            'fields': ('submitted_at', 'approved_at', 'approved_by'),
            'classes': ('collapse',)
        }),
        ('Tracking', {
            'fields': ('updated_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def quarter_display(self, obj):
        return f"Q{obj.quarter}"
    quarter_display.short_description = 'Quarter'
    
    def achievement_percentage_display(self, obj):
        if obj.achievement_percentage:
            if obj.achievement_percentage >= 100:
                color = 'green'
            elif obj.achievement_percentage >= 75:
                color = 'blue'
            elif obj.achievement_percentage >= 50:
                color = 'orange'
            else:
                color = 'red'
            return format_html('<span style="color: {}; font-weight: bold;">{}%</span>', 
                             color, obj.achievement_percentage)
        return '0%'
    achievement_percentage_display.short_description = 'Achievement'
    
    def save_model(self, request, obj, form, change):
        if not obj.pk:
            obj.updated_by = request.user
        else:
            obj.updated_by = request.user
        super().save_model(request, obj, form, change)

@admin.register(models.InitiativeAssessment)
class InitiativeAssessmentAdmin(admin.ModelAdmin):
    list_display = ['initiative', 'data_accuracy', 'effort_percentage', 
                   'expert_rating_display', 'assessed_by', 'assessed_at']
    list_filter = ['data_accuracy', 'expert_rating', 'assessed_at']
    search_fields = ['initiative__title', 'expert_comment', 'recommendations']
    readonly_fields = ['assessed_at']
    raw_id_fields = ['initiative', 'assessed_by']
    
    fieldsets = (
        ('Initiative', {
            'fields': ('initiative',)
        }),
        ('Expert Assessment', {
            'fields': ('data_accuracy', 'effort_percentage', 'expert_comment', 'expert_rating')
        }),
        ('Recommendations', {
            'fields': ('recommendations',)
        }),
        ('Assessment Information', {
            'fields': ('assessed_by', 'assessed_at'),
            'classes': ('collapse',)
        }),
    )
    
    def expert_rating_display(self, obj):
        stars = '★' * obj.expert_rating + '☆' * (5 - obj.expert_rating)
        return format_html('<span style="color: #f5b042;">{}</span>', stars)
    expert_rating_display.short_description = 'Expert Rating'

@admin.register(models.InitiativeQuarterSummary)
class InitiativeQuarterSummaryAdmin(admin.ModelAdmin):
    list_display = ['initiative', 'year', 'annual_target', 'annual_actual', 
                   'average_achievement', 'overall_rating', 'is_complete']
    list_filter = ['year', 'is_complete']
    search_fields = ['initiative__title']
    readonly_fields = ['year', 'annual_target', 'annual_actual', 'average_achievement', 
                      'overall_rating', 'completed_at']
    raw_id_fields = ['initiative']
    list_editable = ['is_complete']
    
    fieldsets = (
        ('Summary Information', {
            'fields': ('initiative', 'year')
        }),
        ('Performance Summary', {
            'fields': ('annual_target', 'annual_actual', 'average_achievement', 'overall_rating')
        }),
        ('Completion Status', {
            'fields': ('is_complete', 'completed_at'),
            'classes': ('collapse',)
        }),
    )
    
    def has_add_permission(self, request):
        # These should be auto-generated, not manually added
        return False

# ============== Admin Site Customization ==============

admin.site.site_header = 'Environmental Performance Dashboard Admin'
admin.site.site_title = 'EPD Admin Portal'
admin.site.index_title = 'Welcome to Environmental Performance Dashboard'