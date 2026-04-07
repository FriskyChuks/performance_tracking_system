# main/admin.py
from django.contrib import admin
from .models import Ministry, PriorityArea, Deliverable, Project

@admin.register(Ministry)
class MinistryAdmin(admin.ModelAdmin):
    list_display = ['id', 'title', 'created_at']
    search_fields = ['title']
    list_filter = ['created_at']

@admin.register(PriorityArea)
class PriorityAreaAdmin(admin.ModelAdmin):
    list_display = ['id', 'title', 'ministry', 'created_at']
    search_fields = ['title']
    list_filter = ['ministry', 'created_at']

@admin.register(Deliverable)
class DeliverableAdmin(admin.ModelAdmin):
    list_display = ['id', 'title', 'priority_area', 'created_at']
    search_fields = ['title']
    list_filter = ['priority_area__ministry', 'created_at']

@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'outcome', 'year', 'quarter', 'performance_rating',
        'created_by', 'created_at'
    ]
    search_fields = ['outcome', 'indicator', 'performance_comment']
    list_filter = ['year', 'quarter', 'performance_rating', 'created_at']
    readonly_fields = ['created_by', 'updated_by', 'created_at', 'updated_at']
    
    def save_model(self, request, obj, form, change):
        if not change:  # New object
            obj.created_by = request.user
        else:  # Update
            obj.updated_by = request.user
        super().save_model(request, obj, form, change)