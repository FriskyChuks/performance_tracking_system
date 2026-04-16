# main/models.py
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.conf import settings

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

class PriorityArea(models.Model):
    """Priority area (e.g., Air Quality, Water Resources, Biodiversity)"""
    name = models.CharField(max_length=250, unique=True)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=50, blank=True, help_text="Icon name for UI")
    color = models.CharField(max_length=20, blank=True, help_text="Color code for UI")
    order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.name
    
    class Meta:
        ordering = ['order', 'name']

class Deliverable(models.Model):
    """Metrics/Deliverables to be achieved for priority areas"""
    priority_area = models.ForeignKey(PriorityArea, on_delete=models.CASCADE, related_name='deliverables')
    name = models.CharField(max_length=500)
    description = models.TextField(blank=True)
    target_value = models.CharField(max_length=250, help_text="Target value to achieve")
    unit = models.CharField(max_length=100, help_text="Unit of measurement (e.g., %, tons, km)")
    deadline = models.DateField(null=True, blank=True)
    is_achieved = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.priority_area.name} - {self.name}"
    
    class Meta:
        ordering = ['priority_area', 'name']

class ProjectInitiative(models.Model):
    """Main entity - can be either a Project (sponsored) or a Program (ongoing)"""
    
    INITIATIVE_TYPES = [
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
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, blank=True, related_name='initiatives')
    agency = models.ForeignKey(Agency, on_delete=models.SET_NULL, null=True, blank=True, related_name='initiatives')
    priority_area = models.ForeignKey(PriorityArea, on_delete=models.SET_NULL, null=True, blank=True, related_name='initiatives')
    deliverables = models.ManyToManyField(Deliverable, blank=True, related_name='initiatives')
    
    # Initiative details
    initiative_type = models.CharField(max_length=20, choices=INITIATIVE_TYPES)
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
    
    # Performance metrics
    target_value = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    actual_value = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    unit_of_measure = models.CharField(max_length=100, blank=True)
    progress_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    
    # Performance rating (1-5)
    performance_rating = models.IntegerField(
        choices=[(1, 'Poor'), (2, 'Fair'), (3, 'Good'), (4, 'Very Good'), (5, 'Excellent')],
        null=True, blank=True
    )
    performance_comment = models.TextField(blank=True)
    
    # Tracking
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='created_initiatives')
    updated_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='updated_initiatives')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        type_label = "Project" if self.initiative_type == 'project' else "Program"
        return f"{type_label}: {self.title}"
    
    @property
    def display_type(self):
        return "Project" if self.initiative_type == 'project' else "Program"
    
    @property
    def performance_history(self):
        """Auto-computed performance history from previous data"""
        # This will be implemented to fetch historical performance
        from django.db.models import Avg
        history = ProjectInitiativeHistory.objects.filter(
            initiative=self
        ).order_by('-recorded_date')[:5]
        return history
    
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
    
    class Meta:
        ordering = ['-created_at']

class ProjectInitiativeHistory(models.Model):
    """Historical performance data for initiatives"""
    initiative = models.ForeignKey(ProjectInitiative, on_delete=models.CASCADE, related_name='history_records')
    recorded_date = models.DateField(auto_now_add=True)
    actual_value = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    progress_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    performance_rating = models.IntegerField(null=True, blank=True)
    notes = models.TextField(blank=True)
    # recorded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    
    class Meta:
        ordering = ['-recorded_date']
        verbose_name_plural = "Project Initiative Histories"
    
    def __str__(self):
        return f"{self.initiative.title} - {self.recorded_date}"
    

# Quarterly progress tracking for deliverables within initiatives
class DeliverableQuarter(models.Model):
    """Quarterly progress for a deliverable within an initiative"""
    
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
    
    initiative = models.ForeignKey('ProjectInitiative', on_delete=models.CASCADE, related_name='quarterly_progress')
    deliverable = models.ForeignKey('Deliverable', on_delete=models.CASCADE, related_name='quarterly_progress')
    quarter = models.IntegerField(choices=QUARTER_CHOICES)
    year = models.IntegerField()
    
    # Targets and actuals
    target_value = models.DecimalField(max_digits=15, decimal_places=2)
    actual_value = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    baseline_value = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    unit_of_measure = models.CharField(max_length=100, blank=True)
    
    # Status tracking
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    submitted_at = models.DateTimeField(null=True, blank=True)
    approved_at = models.DateTimeField(null=True, blank=True)
    approved_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_quarters')
    
    # Progress images (staff can upload)
    progress_images = models.ManyToManyField('engagement.ProjectImage', blank=True, related_name='quarter_progress')
    
    # Staff comments for this quarter
    staff_comment = models.TextField(blank=True)
    
    # Auto-calculated fields
    achievement_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='updated_quarters')
    
    class Meta:
        unique_together = ['initiative', 'deliverable', 'quarter', 'year']
        ordering = ['year', 'quarter']
    
    def save(self, *args, **kwargs):
        # Auto-calculate achievement percentage
        if self.target_value and self.target_value > 0 and self.actual_value is not None:
            self.achievement_percentage = (self.actual_value / self.target_value) * 100
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.initiative.title} - {self.deliverable.name} - {self.year} Q{self.quarter}"

class InitiativeAssessment(models.Model):
    """Sector Expert Assessment for an initiative"""
    
    DATA_ACCURACY_CHOICES = [
        ('available', 'Data Available - Verified'),
        ('not_available', 'Data Not Available'),
        ('inaccurate', 'Data Not Accurate'),
        ('not_verifiable', 'Data Not Verifiable'),
    ]
    
    initiative = models.OneToOneField('ProjectInitiative', on_delete=models.CASCADE, related_name='expert_assessment')
    
    # Expert assessment fields
    data_accuracy = models.CharField(max_length=20, choices=DATA_ACCURACY_CHOICES)
    effort_percentage = models.IntegerField(help_text="Efforts towards achieving goals (%)")
    expert_comment = models.TextField()
    expert_rating = models.IntegerField(choices=[(1, 'Poor'), (2, 'Fair'), (3, 'Good'), (4, 'Very Good'), (5, 'Excellent')])
    
    # Recommendations
    recommendations = models.TextField(blank=True, help_text="Recommendations for improvement")
    
    # Tracking
    assessed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='assessments')
    assessed_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Assessment for {self.initiative.title}"

class InitiativeQuarterSummary(models.Model):
    """Annual summary for an initiative (auto-computed)"""
    
    initiative = models.ForeignKey('ProjectInitiative', on_delete=models.CASCADE, related_name='quarterly_summaries')
    year = models.IntegerField()
    
    # Computed fields
    annual_target = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    annual_actual = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    average_achievement = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    overall_rating = models.DecimalField(max_digits=3, decimal_places=1, default=0)
    
    # Status
    is_complete = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        unique_together = ['initiative', 'year']
        ordering = ['-year']
    
    def __str__(self):
        return f"{self.initiative.title} - {self.year} Summary"