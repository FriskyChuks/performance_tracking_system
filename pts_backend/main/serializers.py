from rest_framework import serializers
from django.db import transaction
from django.utils import timezone


from .models import (
    FederalPriorityArea, Department, Agency, Deliverable, 
    Indicator, ProjectActivity, IndicatorQuarterlyProgress,
    IndicatorAnnualSummary, DeliverableAnnualReport,
    FederalPriorityAreaAnnualReport, REJECTION_CATEGORY_CHOICES
)

# ==================== Basic Serializers ====================

class FederalPriorityAreaSerializer(serializers.ModelSerializer):
    class Meta:
        model = FederalPriorityArea
        fields = ['id', 'name', 'description', 'code', 'is_primary_for_ministry', 'order']
        read_only_fields = ['created_at', 'updated_at']

class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = ['id', 'name', 'description', 'code']
        read_only_fields = ['created_at', 'updated_at']

class AgencySerializer(serializers.ModelSerializer):
    class Meta:
        model = Agency
        fields = ['id', 'name', 'description', 'code', 'website']
        read_only_fields = ['created_at', 'updated_at']

class DeliverableSerializer(serializers.ModelSerializer):
    federal_priority_area_name = serializers.CharField(source='federal_priority_area.name', read_only=True)
    
    class Meta:
        model = Deliverable
        fields = ['id', 'name', 'description', 'code', 'federal_priority_area', 'federal_priority_area_name']
        read_only_fields = ['created_at', 'updated_at']

# ==================== Indicator Serializers ====================

class IndicatorSerializer(serializers.ModelSerializer):
    deliverable_name = serializers.CharField(source='deliverable.name', read_only=True)
    q1_target = serializers.DecimalField(max_digits=15, decimal_places=2, required=False, allow_null=True)
    q2_target = serializers.DecimalField(max_digits=15, decimal_places=2, required=False, allow_null=True)
    q3_target = serializers.DecimalField(max_digits=15, decimal_places=2, required=False, allow_null=True)
    q4_target = serializers.DecimalField(max_digits=15, decimal_places=2, required=False, allow_null=True)
    
    class Meta:
        model = Indicator
        fields = [
            'id', 'deliverable', 'deliverable_name', 'name', 'description',
            'measurement_type', 'unit', 'baseline_value', 'baseline_year',
            'target_value', 'target_year', 'target_boolean', 'is_cumulative',
            'q1_target', 'q2_target', 'q3_target', 'q4_target', 'order'
        ]

class IndicatorCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating indicators"""
    
    class Meta:
        model = Indicator
        fields = [
            'id', 'deliverable', 'name', 'description', 'measurement_type',
            'unit', 'baseline_value', 'baseline_year', 'target_value', 'target_year',
            'target_boolean', 'is_cumulative', 'order'
        ]
    
    def validate_target_value(self, value):
        if value is None or value <= 0:
            raise serializers.ValidationError("Target value must be greater than 0")
        return value
    
    def validate(self, data):
        # For binary indicators, target_boolean is required
        if data.get('measurement_type') == 'binary' and 'target_boolean' not in data:
            raise serializers.ValidationError({"target_boolean": "Target boolean is required for binary indicators"})
        return data

class IndicatorWithProgressSerializer(IndicatorSerializer):
    """Indicator serializer with quarterly progress for a specific activity"""
    quarterly_progress = serializers.SerializerMethodField()
    
    class Meta(IndicatorSerializer.Meta):
        fields = IndicatorSerializer.Meta.fields + ['quarterly_progress']
    
    def get_quarterly_progress(self, obj):
        activity_id = self.context.get('activity_id')
        if activity_id:
            progress = IndicatorQuarterlyProgress.objects.filter(
                indicator=obj,
                activity_id=activity_id
            ).order_by('year', 'quarter')
            return IndicatorQuarterlyProgressSerializer(progress, many=True).data
        return []

# ==================== ProjectActivity Serializers ====================

class ProjectActivityListSerializer(serializers.ModelSerializer):
    """For list views - lightweight with indicators"""
    activity_type_display = serializers.CharField(source='get_activity_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)
    agency_name = serializers.CharField(source='agency.name', read_only=True)
    overall_performance = serializers.SerializerMethodField()
    indicators_count = serializers.SerializerMethodField()
    indicators = serializers.SerializerMethodField()
    
    class Meta:
        model = ProjectActivity
        fields = [
            'id', 'title', 'code', 'activity_type', 'activity_type_display',
            'status', 'status_display', 'department_name', 'agency_name',
            'start_date', 'end_date', 'overall_performance', 'indicators_count',
            'indicators', 'created_at'
        ]
    
    def get_overall_performance(self, obj):
        return obj.overall_annual_performance
    
    def get_indicators_count(self, obj):
        return obj.indicators.count()
    
    def get_indicators(self, obj):
        # Return basic indicator info
        return [{
            'id': ind.id,
            'name': ind.name,
            'target_value': ind.target_value,
            'unit': ind.unit,
            'measurement_type': ind.measurement_type
        } for ind in obj.indicators.all()]


class ProjectActivityDetailSerializer(serializers.ModelSerializer):
    """For detail views - full data with indicators and progress"""
    activity_type_display = serializers.CharField(source='get_activity_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    funding_source_display = serializers.CharField(source='get_funding_source_display', read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)
    agency_name = serializers.CharField(source='agency.name', read_only=True)
    
    # Include full indicator data with quarterly progress
    indicators = serializers.SerializerMethodField()
    
    class Meta:
        model = ProjectActivity
        fields = [
            'id', 'title', 'description', 'code', 'activity_type', 'activity_type_display',
            'department', 'department_name', 'agency', 'agency_name',
            'funding_source', 'funding_source_display', 'budget',
            'program_goal', 'status', 'status_display', 'latitude', 'longitude',
            'location_address', 'location_description', 'start_date', 'end_date',
            'indicators', 'created_by', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_by', 'created_at', 'updated_at']
    
    def get_indicators(self, obj):
        """Get all indicators with their quarterly progress"""
        from .models import IndicatorQuarterlyProgress
        
        indicators_data = []
        for indicator in obj.indicators.all():
            # Get quarterly progress for this indicator and activity
            quarters = IndicatorQuarterlyProgress.objects.filter(
                activity=obj,
                indicator=indicator
            ).order_by('year', 'quarter')
            
            quarters_data = []
            for q in quarters:
                quarters_data.append({
                    'id': q.id,
                    'quarter': q.quarter,
                    'year': q.year,
                    'target_value': q.indicator.target_value / 4,  # Quarterly target (distributed)
                    'actual_value': q.actual_value,
                    'cumulative_percentage': q.cumulative_percentage,
                    'status': q.status,
                    'staff_comment': q.staff_comment,
                    'expert_rating': q.expert_rating,
                    'expert_comment': q.expert_comment,
                    'expert_recommendations': q.expert_recommendations,
                    'data_accuracy': q.data_accuracy,
                    'effort_percentage': q.effort_percentage
                })
            
            indicators_data.append({
                'id': indicator.id,
                'name': indicator.name,
                'description': indicator.description,
                'measurement_type': indicator.measurement_type,
                'unit': indicator.unit,
                'baseline_value': indicator.baseline_value,
                'baseline_year': indicator.baseline_year,
                'target_value': indicator.target_value,
                'target_year': indicator.target_year,
                'is_cumulative': indicator.is_cumulative,
                'quarters': quarters_data
            })
        
        return indicators_data


class ProjectActivityCreateUpdateSerializer(serializers.ModelSerializer):
    
    class Meta:
        model = ProjectActivity
        fields = [
            'id', 'title', 'description', 'code', 'activity_type',
            'department', 'agency', 'indicators', 'funding_source', 'budget',
            'program_goal', 'status', 'latitude', 'longitude',
            'location_address', 'location_description', 'start_date', 'end_date'
        ]
    
    # main/serializers.py - Update ProjectActivityCreateUpdateSerializer

    def create(self, validated_data):
        from datetime import date
        from main.models import IndicatorQuarterlyProgress
        
        indicators = validated_data.pop('indicators', [])
        validated_data['created_by'] = self.context['request'].user
        activity = super().create(validated_data)
        
        if indicators:
            activity.indicators.set(indicators)
            current_year = date.today().year
            
            for indicator in indicators:
                # Get quarterly targets from indicator if set
                q1_target = indicator.q1_target or (indicator.target_value / 4)
                q2_target = indicator.q2_target or (indicator.target_value / 4)
                q3_target = indicator.q3_target or (indicator.target_value / 4)
                q4_target = indicator.q4_target or (indicator.target_value / 4)
                
                # Verify sum equals total target (optional warning)
                total_target = q1_target + q2_target + q3_target + q4_target
                if abs(total_target - indicator.target_value) > 0.01:
                    # Log warning but don't block creation
                    pass
                
                for quarter, quarterly_target in [(1, q1_target), (2, q2_target), (3, q3_target), (4, q4_target)]:
                    IndicatorQuarterlyProgress.objects.create(
                        activity=activity,
                        indicator=indicator,
                        quarter=quarter,
                        year=current_year,
                        quarterly_target=quarterly_target,
                        status='draft'
                    )
        
        return activity

# ==================== Quarterly Progress Serializers ====================

# main/serializers.py - Update IndicatorQuarterlyProgressSerializer

class IndicatorQuarterlyProgressSerializer(serializers.ModelSerializer):
    indicator_name = serializers.CharField(source='indicator.name', read_only=True)
    activity_title = serializers.CharField(source='activity.title', read_only=True)
    quarter_display = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    auto_rating_display = serializers.SerializerMethodField()
    expert_rating_display = serializers.SerializerMethodField()
    
    # Add target values from the indicator
    annual_target = serializers.SerializerMethodField()
    quarterly_target = serializers.SerializerMethodField()
    unit_of_measure = serializers.CharField(source='indicator.unit', read_only=True)
    measurement_type = serializers.CharField(source='indicator.measurement_type', read_only=True)
    rejected_by_name = serializers.CharField(source='rejected_by.full_name', read_only=True)
    
    class Meta:
        model = IndicatorQuarterlyProgress
        fields = [
            'id', 'activity', 'activity_title', 'indicator', 'indicator_name',
            'quarter', 'quarter_display', 'year', 'actual_value', 'actual_boolean',
            'cumulative_actual', 'cumulative_percentage', 'auto_rating', 'auto_rating_display',
            'status', 'status_display', 'submitted_at', 'approved_at',
            'expert_assessed', 'expert_rating', 'expert_rating_display',
            'expert_comment', 'expert_recommendations', 'data_accuracy',
            'effort_percentage', 'staff_comment', 'progress_images', 'created_at',
            'annual_target', 'quarterly_target', 'unit_of_measure', 'measurement_type',
            'rejection_reason', 'rejection_category',
            'rejected_by', 'rejected_by_name', 'rejected_at',
        ]
        read_only_fields = [
            'cumulative_actual', 'cumulative_percentage', 'auto_rating', 'created_at',
            'rejected_by', 'rejected_at',
        ]
    
    def get_quarter_display(self, obj):
        return f"Q{obj.quarter} ({obj.year})"
    
    def get_auto_rating_display(self, obj):
        ratings = {1: 'Poor', 2: 'Fair', 3: 'Good', 4: 'Very Good', 5: 'Excellent'}
        return ratings.get(obj.auto_rating) if obj.auto_rating else None
    
    def get_expert_rating_display(self, obj):
        ratings = {1: 'Poor', 2: 'Fair', 3: 'Good', 4: 'Very Good', 5: 'Excellent'}
        return ratings.get(obj.expert_rating) if obj.expert_rating else None
    
    def get_annual_target(self, obj):
        """Get the annual target from the indicator"""
        return float(obj.indicator.target_value) if obj.indicator.target_value else 0
    
    def get_quarterly_target(self, obj):
        """Calculate quarterly target (annual target / 4)"""
        if obj.indicator.target_value:
            return float(obj.indicator.target_value) / 4
        return 0

class DeliveryOfficerProgressSerializer(serializers.ModelSerializer):
    """DO can read rejection history; only actual_value/boolean/comment/images/status are writable."""
    rejected_by_name = serializers.CharField(source='rejected_by.full_name', read_only=True)

    class Meta:
        model = IndicatorQuarterlyProgress
        fields = [
            'id', 'actual_value', 'actual_boolean', 'staff_comment',
            'progress_images', 'status',
            'rejection_reason', 'rejection_category',
            'rejected_by', 'rejected_by_name', 'rejected_at',
        ]
        read_only_fields = [
            'rejection_reason', 'rejection_category', 'rejected_by', 'rejected_at',
        ]

    def update(self, instance, validated_data):
        if 'actual_value' in validated_data or 'actual_boolean' in validated_data:
            validated_data['status'] = 'submitted'
            validated_data['submitted_at'] = timezone.now()
        return super().update(instance, validated_data)
    

class DeliveryOfficerActivityUpdateSerializer(serializers.ModelSerializer):
    """Delivery Officer can update location and basic info (readonly for other fields)"""
    
    class Meta:
        model = ProjectActivity
        fields = [
            'id', 'title', 'description', 'latitude', 'longitude', 
            'location_address', 'location_description'
        ]
        read_only_fields = ['title', 'description']  # Keep these read-only, only location is editable


class DirectorApprovalSerializer(serializers.ModelSerializer):
    """Director approve/reject with structured rejection fields."""
    rejection_reason = serializers.CharField(required=False, allow_blank=True)
    rejection_category = serializers.ChoiceField(
        choices=REJECTION_CATEGORY_CHOICES, required=False, allow_blank=True
    )

    class Meta:
        model = IndicatorQuarterlyProgress
        fields = [
            'id', 'status', 'approved_by', 'approved_at',
            'rejection_reason', 'rejection_category',
        ]
        read_only_fields = ['approved_by', 'approved_at']

    def validate(self, data):
        status_value = data.get('status')
        if status_value == 'rejected':
            category = data.get('rejection_category', '')
            reason = data.get('rejection_reason', '')
            if not category:
                raise serializers.ValidationError(
                    {'rejection_category': 'A rejection category is required.'}
                )
            if category == 'other' and not reason.strip():
                raise serializers.ValidationError(
                    {'rejection_reason': 'A detailed reason is required when category is "Other".'}
                )
        return data

    def update(self, instance, validated_data):
        status_value = validated_data.get('status')

        if status_value == 'rejected':
            instance.rejection_reason = validated_data.get('rejection_reason', '') or ''
            instance.rejection_category = validated_data.get('rejection_category', '') or ''
            instance.rejected_by = self.context['request'].user
            instance.rejected_at = timezone.now()
            # Rewrite to draft so the DO can act on it
            instance.status = 'draft'
            instance.save()
            return instance

        if status_value == 'approved':
            instance.approved_at = timezone.now()
            instance.approved_by = self.context['request'].user
            instance.status = 'approved'
            instance.save()
            return instance

        return super().update(instance, validated_data)

class ExpertAssessmentSerializer(serializers.ModelSerializer):
    """For sector experts - assessment only"""
    class Meta:
        model = IndicatorQuarterlyProgress
        fields = [
            'id', 'expert_rating', 'expert_comment', 'expert_recommendations',
            'data_accuracy', 'effort_percentage', 'status'
        ]
    
    def update(self, instance, validated_data):
        validated_data['expert_assessed'] = True
        validated_data['expert_assessed_at'] = timezone.now()
        validated_data['expert_assessed_by'] = self.context['request'].user
        validated_data['status'] = 'assessed'
        return super().update(instance, validated_data)

# ==================== Annual Summary Serializers ====================

class IndicatorAnnualSummarySerializer(serializers.ModelSerializer):
    indicator_name = serializers.CharField(source='indicator.name', read_only=True)
    activity_title = serializers.CharField(source='activity.title', read_only=True)
    overall_rating_display = serializers.SerializerMethodField()
    
    class Meta:
        model = IndicatorAnnualSummary
        fields = [
            'id', 'indicator', 'indicator_name', 'activity', 'activity_title',
            'year', 'annual_target', 'annual_actual', 'q1_achievement',
            'q2_achievement', 'q3_achievement', 'q4_achievement',
            'average_quarterly_achievement', 'year_end_percentage',
            'auto_rating', 'expert_rating', 'overall_rating', 'overall_rating_display',
            'expert_annual_comment', 'expert_annual_recommendations'
        ]
    
    def get_overall_rating_display(self, obj):
        ratings = {1: 'Poor', 2: 'Fair', 3: 'Good', 4: 'Very Good', 5: 'Excellent'}
        return ratings.get(int(obj.overall_rating)) if obj.overall_rating else None

class DeliverableAnnualReportSerializer(serializers.ModelSerializer):
    deliverable_name = serializers.CharField(source='deliverable.name', read_only=True)
    
    class Meta:
        model = DeliverableAnnualReport
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']

class FederalPriorityAreaAnnualReportSerializer(serializers.ModelSerializer):
    priority_area_name = serializers.CharField(source='federal_priority_area.name', read_only=True)
    
    class Meta:
        model = FederalPriorityAreaAnnualReport
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']