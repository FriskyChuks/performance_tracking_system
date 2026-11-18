# main/models.py
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.conf import settings

REJECTION_CATEGORY_CHOICES = [
    ('incomplete_data', 'Incomplete Data'),
    ('inaccurate_data', 'Inaccurate Data'),
    ('needs_clarification', 'Needs Clarification'),
    ('deadline_missed', 'Deadline Missed'),
    ('quality_issues', 'Quality Issues'),
    ('other', 'Other'),
]

class FederalPriorityArea(models.Model):
    """Federal Government Priority Areas (8 total, Ministry focuses on 3)"""
    name = models.CharField(max_length=250, unique=True)
    description = models.TextField(blank=True)
    code = models.CharField(max_length=50, unique=True, blank=True)
    is_primary_for_ministry = models.BooleanField(default=False, 
        help_text="Is this a primary focus area for the Ministry?")
    order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.name
    
    class Meta:
        ordering = ['order', 'name']
        verbose_name_plural = "Federal Priority Areas"

class Department(models.Model):
    """Ministry department (e.g., Forestry, Climate Change)"""
    name = models.CharField(max_length=250, unique=True)
    description = models.TextField(blank=True)
    code = models.CharField(max_length=50, unique=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.name
    
    class Meta:
        ordering = ['name']

class Agency(models.Model):
    """Agency under ministry (e.g., NOSDRA, NESREA)"""
    name = models.CharField(max_length=250, unique=True)
    description = models.TextField(blank=True)
    code = models.CharField(max_length=50, unique=True, blank=True)
    website = models.URLField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.name
    
    class Meta:
        ordering = ['name']
        verbose_name_plural = "Agencies"

class Deliverable(models.Model):
    """Ministry Deliverables (tied to Federal Priority Areas for reporting)"""
    federal_priority_area = models.ForeignKey(
        FederalPriorityArea, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='deliverables',
        help_text="Which Federal Priority Area does this deliverable support?"
    )
    name = models.CharField(max_length=500)
    description = models.TextField(blank=True)
    code = models.CharField(max_length=100, unique=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.name
    
    class Meta:
        ordering = ['name']

class Indicator(models.Model):
    """Indicators that measure success for a Deliverable"""
    
    MEASUREMENT_TYPES = [
        ('numeric', 'Numeric (e.g., count, tons)'),
        ('percentage', 'Percentage (%)'),
        ('currency', 'Currency (₦, $)'),
        ('ratio', 'Ratio'),
        ('binary', 'Yes/No'),
    ]
    
    deliverable = models.ForeignKey(Deliverable, on_delete=models.CASCADE, related_name='indicators')
    name = models.CharField(max_length=500)
    description = models.TextField(blank=True)
    measurement_type = models.CharField(max_length=20, choices=MEASUREMENT_TYPES, default='numeric')
    unit = models.CharField(max_length=100, blank=True, help_text="e.g., sites, hectares, tons, %")
    
    # Baseline and target
    baseline_value = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    baseline_year = models.IntegerField(null=True, blank=True)
    target_value = models.DecimalField(max_digits=15, decimal_places=2)
    target_year = models.IntegerField()
    
    # For binary indicators
    target_boolean = models.BooleanField(default=True, help_text="Target state for Yes/No indicators")
    
    is_cumulative = models.BooleanField(default=True, 
        help_text="Is this indicator cumulative (e.g., total restored) or periodic (e.g., quarterly achievement)?")
    
    order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Add custom quarterly targets (optional)
    q1_target = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    q2_target = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    q3_target = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    q4_target = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    
    def get_quarterly_target(self, quarter):
        """Get target for a specific quarter"""
        quarter_map = {1: self.q1_target, 2: self.q2_target, 3: self.q3_target, 4: self.q4_target}
        if quarter_map.get(quarter):
            return quarter_map[quarter]
        return self.target_value / 4  # Default distribution
    
    def __str__(self):
        return f"{self.deliverable.name} - {self.name}"
    
    class Meta:
        ordering = ['deliverable', 'order', 'name']

class ProjectActivity(models.Model):
    """Project or Program that implements Indicators"""
    
    ACTIVITY_TYPES = [
        ('project', 'Project (Sponsored/Packaged)'),
        ('program', 'Program (Ongoing Initiative)'),
    ]
    
    FUNDING_SOURCES = [
        ('world_bank', 'World Bank'),
        ('eu', 'European Union'),
        ('un', 'United Nations'),
        ('afdb', 'African Development Bank'),
        ('internal', 'Internal/FGN'),
        ('private', 'Private Sector'),
        ('other', 'Other'),
        ('n/a', 'Not Applicable'),
    ]
    
    STATUS_CHOICES = [
        ('planning', 'Planning'),
        ('ongoing', 'Ongoing'),
        ('completed', 'Completed'),
        ('on_hold', 'On Hold'),
        ('cancelled', 'Cancelled'),
    ]
    
    # Relationships
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, blank=True, related_name='activities')
    agency = models.ForeignKey(Agency, on_delete=models.SET_NULL, null=True, blank=True, related_name='activities')
    indicators = models.ManyToManyField(Indicator, blank=True, related_name='activities')
    
    # Activity details
    activity_type = models.CharField(max_length=20, choices=ACTIVITY_TYPES)
    title = models.CharField(max_length=500)
    description = models.TextField()
    code = models.CharField(max_length=100, unique=True, blank=True, help_text="Project/Program code")
    
    # For Project type
    funding_source = models.CharField(max_length=50, choices=FUNDING_SOURCES, blank=True, null=True)
    budget = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    
    # For Program type
    program_goal = models.TextField(blank=True, help_text="Overall goal of the program")
    
    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='planning')
    
    # Geolocation
    latitude = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    longitude = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    location_address = models.CharField(max_length=500, blank=True)
    location_description = models.TextField(blank=True, help_text="Directions or additional location info")
    
    # Timeline
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    
    # Tracking
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='created_activities')
    updated_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='updated_activities')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        type_label = "Project" if self.activity_type == 'project' else "Program"
        return f"{type_label}: {self.title}"
    
    @property
    def display_type(self):
        return "Project" if self.activity_type == 'project' else "Program"
    
    @property
    def completion_percentage(self):
        """Calculate completion percentage based on timeline"""
        from datetime import date
        if not self.end_date:
            return 0
        today = date.today()
        if today < self.start_date:
            return 0
        if today > self.end_date:
            return 100
        total_days = (self.end_date - self.start_date).days
        elapsed_days = (today - self.start_date).days
        if total_days > 0:
            return round((elapsed_days / total_days) * 100, 1)
        return 0
    
    @property
    def overall_annual_performance(self):
        """Get overall performance across all indicators for current year"""
        from datetime import date
        current_year = date.today().year
        summaries = IndicatorAnnualSummary.objects.filter(
            activity=self,
            year=current_year
        )
        if summaries.exists():
            avg = summaries.aggregate(models.Avg('year_end_percentage'))['year_end_percentage__avg']
            return round(avg, 1) if avg else 0
        return 0
    
    class Meta:
        ordering = ['-created_at']
        verbose_name_plural = "Project Activities"
    
    # Add the method HERE - at the same indentation level as your other methods
    def create_quarterly_progress(self, year=None):
        """Create quarterly progress records for all indicators"""
        from datetime import date
        from .models import IndicatorQuarterlyProgress  # Import here to avoid circular import
        
        if year is None:
            year = date.today().year
        
        for indicator in self.indicators.all():
            for quarter in range(1, 5):
                IndicatorQuarterlyProgress.objects.get_or_create(
                    activity=self,
                    indicator=indicator,
                    quarter=quarter,
                    year=year,
                    defaults={
                        'target_value': indicator.target_value / 4 if indicator.target_value else 0,
                        'unit_of_measure': indicator.unit,
                        'status': 'draft'
                    }
                )

class IndicatorQuarterlyProgress(models.Model):
    """Quarterly progress tracking for an Indicator within a ProjectActivity"""
    
    QUARTER_CHOICES = [
        (1, 'Q1 (Jan - Mar)'),
        (2, 'Q2 (Apr - Jun)'),
        (3, 'Q3 (Jul - Sep)'),
        (4, 'Q4 (Oct - Dec)'),
    ]
    
    STATUS_CHOICES = [
        ('draft', 'Draft (Staff Working)'),
        ('submitted', 'Submitted for Review'),
        ('approved', 'Approved by Director'),
        ('rejected', 'Rejected'),
        ('assessed', 'Assessed by Expert'),
    ]
    
    RATING_CHOICES = [
        (1, 'Poor'),
        (2, 'Fair'),
        (3, 'Good'),
        (4, 'Very Good'),
        (5, 'Excellent'),
    ]
    
    activity = models.ForeignKey(ProjectActivity, on_delete=models.CASCADE, related_name='quarterly_progress')
    indicator = models.ForeignKey(Indicator, on_delete=models.CASCADE, related_name='quarterly_progress')
    quarter = models.IntegerField(choices=QUARTER_CHOICES)
    year = models.IntegerField()
    
    # Actual achievement for this quarter
    actual_value = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    actual_boolean = models.BooleanField(null=True, blank=True, help_text="For binary indicators")
    
    # Cumulative progress (auto-calculated from previous quarters + current)
    cumulative_actual = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    cumulative_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    
    # Automated performance rating based on cumulative_percentage
    auto_rating = models.IntegerField(choices=RATING_CHOICES, null=True, blank=True, editable=False)
    
    # Status tracking
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    submitted_at = models.DateTimeField(null=True, blank=True)
    approved_at = models.DateTimeField(null=True, blank=True)
    approved_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_indicator_progress')
        # Rejection history (append-only — never cleared on resubmission)
    rejection_reason = models.TextField(blank=True)
    rejection_category = models.CharField(
        max_length=30,
        choices=REJECTION_CATEGORY_CHOICES,
        blank=True,
    )
    rejected_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='rejected_indicator_progress',
    )
    rejected_at = models.DateTimeField(null=True, blank=True)
    
    # Expert assessment (done after approval)
    expert_assessed = models.BooleanField(default=False)
    expert_assessed_at = models.DateTimeField(null=True, blank=True)
    expert_assessed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='expert_assessed_progress')
    expert_rating = models.IntegerField(choices=RATING_CHOICES, null=True, blank=True)
    expert_comment = models.TextField(blank=True)
    expert_recommendations = models.TextField(blank=True)
    
    # Data accuracy assessment
    DATA_ACCURACY_CHOICES = [
        ('available', 'Data Available - Verified'),
        ('not_available', 'Data Not Available'),
        ('inaccurate', 'Data Not Accurate'),
        ('not_verifiable', 'Data Not Verifiable'),
    ]
    data_accuracy = models.CharField(max_length=20, choices=DATA_ACCURACY_CHOICES, null=True, blank=True)
    effort_percentage = models.IntegerField(null=True, blank=True, help_text="Efforts towards achieving goals (%)")
    
    # Progress images
    progress_images = models.ManyToManyField('engagement.ProjectImage', blank=True, related_name='indicator_progress')
    supporting_documents = models.ManyToManyField('engagement.QuarterlyDocument', blank=True)
    
    # Staff comments
    staff_comment = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='updated_indicator_progress')
    # Add quarterly target field
    quarterly_target = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True,help_text="Target for this specific quarter")
    
    @property
    def annual_target(self):
        """Get the annual target from the indicator"""
        return self.indicator.target_value if self.indicator else 0

    class Meta:
        unique_together = ['activity', 'indicator', 'quarter', 'year']
        ordering = ['year', 'quarter']
    
    def save(self, *args, **kwargs):
        # Calculate cumulative progress if indicator is cumulative
        if self.indicator.is_cumulative:
            # Get all previous quarters' actual values
            previous_progress = IndicatorQuarterlyProgress.objects.filter(
                activity=self.activity,
                indicator=self.indicator,
                year__lt=self.year
            ) | IndicatorQuarterlyProgress.objects.filter(
                activity=self.activity,
                indicator=self.indicator,
                year=self.year,
                quarter__lt=self.quarter
            )
            
            cumulative_sum = sum(p.actual_value or 0 for p in previous_progress)
            if self.actual_value:
                self.cumulative_actual = cumulative_sum + self.actual_value
            else:
                self.cumulative_actual = cumulative_sum
            
            # Calculate cumulative percentage against target
            if self.indicator.target_value and self.indicator.target_value > 0:
                self.cumulative_percentage = (self.cumulative_actual / self.indicator.target_value) * 100
        else:
            # For non-cumulative indicators, just use current quarter's value
            self.cumulative_actual = self.actual_value or 0
            if self.indicator.target_value and self.indicator.target_value > 0:
                self.cumulative_percentage = (self.cumulative_actual / self.indicator.target_value) * 100
        
        # Auto-calculate rating based on cumulative_percentage
        if self.cumulative_percentage >= 90:
            self.auto_rating = 5
        elif self.cumulative_percentage >= 75:
            self.auto_rating = 4
        elif self.cumulative_percentage >= 60:
            self.auto_rating = 3
        elif self.cumulative_percentage >= 40:
            self.auto_rating = 2
        else:
            self.auto_rating = 1
        
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.activity.title} - {self.indicator.name} - {self.year} Q{self.quarter}"

class IndicatorAnnualSummary(models.Model):
    """Annual summary for an Indicator (auto-computed)"""
    
    RATING_CHOICES = [
        (1, 'Poor'),
        (2, 'Fair'),
        (3, 'Good'),
        (4, 'Very Good'),
        (5, 'Excellent'),
    ]
    
    indicator = models.ForeignKey(Indicator, on_delete=models.CASCADE, related_name='annual_summaries')
    activity = models.ForeignKey(ProjectActivity, on_delete=models.CASCADE, related_name='indicator_annual_summaries')
    year = models.IntegerField()
    
    # Computed fields
    annual_target = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    annual_actual = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    q1_achievement = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    q2_achievement = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    q3_achievement = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    q4_achievement = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    average_quarterly_achievement = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    year_end_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    
    # Ratings
    auto_rating = models.IntegerField(choices=RATING_CHOICES, null=True, blank=True)
    expert_rating = models.IntegerField(choices=RATING_CHOICES, null=True, blank=True)
    overall_rating = models.DecimalField(max_digits=3, decimal_places=1, default=0)
    
    # Expert summary for the year
    expert_annual_comment = models.TextField(blank=True)
    expert_annual_recommendations = models.TextField(blank=True)
    
    # Status
    is_complete = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        unique_together = ['indicator', 'activity', 'year']
        ordering = ['-year']
    
    def save(self, *args, **kwargs):
        # Calculate overall rating (average of auto and expert if both exist)
        ratings = []
        if self.auto_rating:
            ratings.append(self.auto_rating)
        if self.expert_rating:
            ratings.append(self.expert_rating)
        if ratings:
            self.overall_rating = sum(ratings) / len(ratings)
        else:
            self.overall_rating = 0
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.indicator.name} - {self.activity.title} - {self.year}"

class DeliverableAnnualReport(models.Model):
    """Annual report for a Deliverable, aggregating all its Indicators"""
    
    RATING_CHOICES = [
        (1, 'Poor'),
        (2, 'Fair'),
        (3, 'Good'),
        (4, 'Very Good'),
        (5, 'Excellent'),
    ]
    
    deliverable = models.ForeignKey(Deliverable, on_delete=models.CASCADE, related_name='annual_reports')
    year = models.IntegerField()
    
    # Aggregated metrics
    total_indicators = models.IntegerField(default=0)
    completed_indicators = models.IntegerField(default=0)
    average_achievement = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    overall_rating = models.DecimalField(max_digits=3, decimal_places=1, default=0)
    
    # Federal reporting
    federal_priority_area_contribution = models.TextField(blank=True, 
        help_text="How has this deliverable contributed to Federal Priority Areas?")
    
    # Narrative
    summary = models.TextField(blank=True)
    challenges = models.TextField(blank=True)
    recommendations = models.TextField(blank=True)
    next_year_priorities = models.TextField(blank=True)
    
    # Status
    is_finalized = models.BooleanField(default=False)
    finalized_at = models.DateTimeField(null=True, blank=True)
    finalized_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='finalized_reports')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['deliverable', 'year']
        ordering = ['-year']
    
    def __str__(self):
        return f"{self.deliverable.name} - {self.year} Report"

class FederalPriorityAreaAnnualReport(models.Model):
    """Annual report for Federal Priority Areas (for reporting up to FG)"""
    
    federal_priority_area = models.ForeignKey(FederalPriorityArea, on_delete=models.CASCADE, related_name='annual_reports')
    year = models.IntegerField()
    
    # Aggregated from deliverables under this priority area
    total_deliverables = models.IntegerField(default=0)
    total_indicators = models.IntegerField(default=0)
    average_achievement = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    overall_rating = models.DecimalField(max_digits=3, decimal_places=1, default=0)
    
    # Ministry contribution narrative
    ministry_contribution = models.TextField(blank=True, 
        help_text="How has the Ministry contributed to this Federal Priority Area?")
    key_achievements = models.TextField(blank=True)
    challenges_and_gaps = models.TextField(blank=True)
    
    # Status
    is_submitted_to_fg = models.BooleanField(default=False)
    submitted_to_fg_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['federal_priority_area', 'year']
        ordering = ['-year']
    
    def __str__(self):
        return f"{self.federal_priority_area.name} - {self.year} Report"