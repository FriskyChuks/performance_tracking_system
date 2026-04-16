# main/serializers.py
from rest_framework import serializers

from .models import *
from accounts.utils import get_user_role, get_user_permissions

class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = ['id', 'name', 'description', 'code', 'created_at']

class AgencySerializer(serializers.ModelSerializer):
    class Meta:
        model = Agency
        fields = ['id', 'name', 'description', 'code', 'website', 'created_at']

class PriorityAreaSerializer(serializers.ModelSerializer):
    deliverables_count = serializers.IntegerField(source='deliverables.count', read_only=True)
    
    class Meta:
        model = PriorityArea
        fields = ['id', 'name', 'description', 'icon', 'color', 'order', 'deliverables_count', 'created_at']

class DeliverableSerializer(serializers.ModelSerializer):
    priority_area_name = serializers.CharField(source='priority_area.name', read_only=True)
    
    class Meta:
        model = Deliverable
        fields = ['id', 'priority_area', 'priority_area_name', 'name', 'description', 
                  'target_value', 'unit', 'deadline', 'is_achieved', 'created_at']

class ProjectInitiativeHistorySerializer(serializers.ModelSerializer):
    recorded_by_name = serializers.CharField(source='recorded_by.get_full_name', read_only=True)
    
    class Meta:
        model = ProjectInitiativeHistory
        fields = ['id', 'recorded_date', 'actual_value', 'progress_percentage', 
                  'performance_rating', 'notes', 'recorded_by_name']

class ProjectInitiativeSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True)
    agency_name = serializers.CharField(source='agency.name', read_only=True)
    priority_area_name = serializers.CharField(source='priority_area.name', read_only=True)
    deliverables_list = DeliverableSerializer(source='deliverables', many=True, read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    updated_by_name = serializers.CharField(source='updated_by.get_full_name', read_only=True)
    performance_history = ProjectInitiativeHistorySerializer(many=True, read_only=True)
    
    class Meta:
        model = ProjectInitiative
        fields = [
            'id', 'initiative_type', 'title', 'description', 'code',
            'department', 'department_name', 'agency', 'agency_name',
            'priority_area', 'priority_area_name', 'deliverables', 'deliverables_list',
            'funding_source', 'budget', 'program_goal', 'status',
            'latitude', 'longitude', 'location_address', 'location_description',
            'start_date', 'end_date',
            'target_value', 'actual_value', 'unit_of_measure', 'progress_percentage',
            'performance_rating', 'performance_comment',
            'performance_history', 'completion_percentage',
            'created_by', 'created_by_name', 'updated_by', 'updated_by_name',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['progress_percentage', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        deliverables_data = validated_data.pop('deliverables', [])
        validated_data['created_by'] = self.context['request'].user
        initiative = ProjectInitiative.objects.create(**validated_data)
        initiative.deliverables.set(deliverables_data)
        return initiative
    
    def to_representation(self, instance):
        """Control what fields are visible based on user role"""
        data = super().to_representation(instance)
        request = self.context.get('request')
        
        if request and request.user.is_authenticated:
            role = get_user_role(request.user)
            
            # ProjectAdmin: Hide actual_value and images during creation
            if role == 'project_admin' and not instance.id:
                data.pop('actual_value', None)
                data.pop('images', None)
                data.pop('performance_rating', None)
                data.pop('performance_comment', None)
            
            # Staff: Everything visible, but we'll control edit in update
            # Director: Read-only view
            if role == 'director':
                # Make fields read-only - handled in update method
                pass
            
            # Sector Expert: Hide assessment until after approval
            if role == 'sector_expert' and instance.status != 'approved':
                data.pop('assessment', None)
        
        return data
    
    def update(self, instance, validated_data):
        """Control what fields can be updated based on user role"""
        request = self.context.get('request')
        
        if request and request.user.is_authenticated:
            role = get_user_role(request.user)
            
            if role == 'project_admin':
                # ProjectAdmin cannot update certain fields after creation
                forbidden_fields = ['actual_value', 'performance_rating', 'performance_comment']
                for field in forbidden_fields:
                    validated_data.pop(field, None)
            
            elif role == 'staff':
                # Staff can only update specific fields
                allowed_fields = ['actual_value', 'status', 'staff_comment']
                for field in list(validated_data.keys()):
                    if field not in allowed_fields:
                        validated_data.pop(field)
            
            elif role == 'director':
                # Director can only approve/reject
                allowed_fields = ['status']
                for field in list(validated_data.keys()):
                    if field not in allowed_fields:
                        validated_data.pop(field)
            
            elif role == 'sector_expert':
                # Sector Expert cannot edit initiative directly
                return instance
        
        return super().update(instance, validated_data)

class ProjectInitiativeListSerializer(serializers.ModelSerializer):
    """Simplified serializer for list views"""
    department_name = serializers.CharField(source='department.name', read_only=True)
    agency_name = serializers.CharField(source='agency.name', read_only=True)
    priority_area_name = serializers.CharField(source='priority_area.name', read_only=True)
    
    class Meta:
        model = ProjectInitiative
        fields = [
            'id', 'initiative_type', 'title', 'code', 'status',
            'department_name', 'agency_name', 'priority_area_name',
            'start_date', 'end_date', 'progress_percentage',
            'performance_rating', 'latitude', 'longitude'
        ]


# main/serializers.py - Add these serializers

class DeliverableQuarterSerializer(serializers.ModelSerializer):
    deliverable_name = serializers.CharField(source='deliverable.name', read_only=True)
    priority_area_name = serializers.CharField(source='deliverable.priority_area.name', read_only=True)
    updated_by_name = serializers.CharField(source='updated_by.get_full_name', read_only=True)
    approved_by_name = serializers.CharField(source='approved_by.get_full_name', read_only=True)
    progress_images_list = serializers.SerializerMethodField()
    
    class Meta:
        model = DeliverableQuarter
        fields = [
            'id', 'initiative', 'deliverable', 'deliverable_name', 'priority_area_name',
            'quarter', 'year', 'target_value', 'actual_value', 'baseline_value',
            'unit_of_measure', 'status', 'achievement_percentage',
            'staff_comment', 'progress_images', 'progress_images_list',
            'submitted_at', 'approved_at', 'approved_by', 'approved_by_name',
            'updated_by', 'updated_by_name', 'created_at', 'updated_at'
        ]
        read_only_fields = ['achievement_percentage', 'submitted_at', 'approved_at', 'created_at', 'updated_at']
    
    def get_progress_images_list(self, obj):
        request = self.context.get('request')
        images = obj.progress_images.all()
        return [{'id': img.id, 'image': request.build_absolute_uri(img.image.url) if request and img.image else None} for img in images]

class InitiativeAssessmentSerializer(serializers.ModelSerializer):
    assessed_by_name = serializers.CharField(source='assessed_by.get_full_name', read_only=True)
    
    class Meta:
        model = InitiativeAssessment
        fields = [
            'id', 'initiative', 'data_accuracy', 'effort_percentage',
            'expert_comment', 'expert_rating', 'recommendations',
            'assessed_by', 'assessed_by_name', 'assessed_at'
        ]
        read_only_fields = ['assessed_at']

class InitiativeQuarterSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = InitiativeQuarterSummary
        fields = [
            'id', 'initiative', 'year', 'annual_target', 'annual_actual',
            'average_achievement', 'overall_rating', 'is_complete', 'completed_at'
        ]