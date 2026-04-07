# main/serializers.py
from rest_framework import serializers
from .models import Ministry, PriorityArea, Deliverable, Project
from django.contrib.auth import get_user_model

User = get_user_model()

class MinistrySerializer(serializers.ModelSerializer):
    priority_areas_count = serializers.IntegerField(source='priority_areas.count', read_only=True)
    
    class Meta:
        model = Ministry
        fields = ['id', 'title', 'created_at', 'updated_at', 'priority_areas_count']
        read_only_fields = ['created_at', 'updated_at']

class PriorityAreaSerializer(serializers.ModelSerializer):
    deliverables_count = serializers.IntegerField(source='deliverables.count', read_only=True)
    
    class Meta:
        model = PriorityArea
        fields = ['id', 'ministry', 'title', 'created_at', 'updated_at', 'deliverables_count']
        read_only_fields = ['created_at', 'updated_at']

class DeliverableSerializer(serializers.ModelSerializer):
    projects_count = serializers.IntegerField(source='projects.count', read_only=True)
    
    class Meta:
        model = Deliverable
        fields = ['id', 'priority_area', 'title', 'created_at', 'updated_at', 'projects_count']
        read_only_fields = ['created_at', 'updated_at']

class ProjectSerializer(serializers.ModelSerializer):
    deliverable_title = serializers.CharField(source='deliverable.title', read_only=True)
    priority_area_title = serializers.CharField(source='deliverable.priority_area.title', read_only=True)
    ministry_title = serializers.CharField(source='deliverable.priority_area.ministry.title', read_only=True)
    created_by_email = serializers.EmailField(source='created_by.email', read_only=True)
    updated_by_email = serializers.EmailField(source='updated_by.email', read_only=True)
    
    class Meta:
        model = Project
        fields = [
            'id', 'deliverable', 'deliverable_title', 'priority_area_title', 'ministry_title',
            'outcome', 'indicator', 'year', 'quarter', 'baseline_data', 'target_data',
            'actual_data', 'performance_rating', 'performance_comment', 'performance_historics',
            'target_historics', 'performance_type', 'created_by', 'created_by_email',
            'updated_by', 'updated_by_email', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_by', 'updated_by', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        validated_data['updated_by'] = self.context['request'].user
        return super().update(instance, validated_data)