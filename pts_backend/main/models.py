# main/models.py
from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator

class Ministry(models.Model):
    title = models.CharField(max_length=250, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.title
    
    class Meta:
        ordering = ['title']

class PriorityArea(models.Model):
    ministry = models.ForeignKey(Ministry, on_delete=models.CASCADE, related_name='priority_areas')
    title = models.CharField(max_length=250)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['ministry', 'title']
    
    def __str__(self):
        return f"{self.ministry.title} - {self.title}"
    
    class Meta:
        ordering = ['ministry', 'title']

class Deliverable(models.Model):
    priority_area = models.ForeignKey(PriorityArea, on_delete=models.CASCADE, related_name='deliverables')
    title = models.CharField(max_length=250)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['priority_area', 'title']
    
    def __str__(self):
        return f"{self.priority_area.title} - {self.title}"
    
    class Meta:
        ordering = ['priority_area', 'title']

class Project(models.Model):
    QUARTER_CHOICES = [
        (1, 'Q1'),
        (2, 'Q2'),
        (3, 'Q3'),
        (4, 'Q4'),
    ]
    
    PERFORMANCE_RATING_CHOICES = [
        (1, 'Poor'),
        (2, 'Fair'),
        (3, 'Good'),
        (4, 'Very Good'),
        (5, 'Excellent'),
    ]
    
    PERFORMANCE_TYPE_CHOICES = [
        ('target', 'Target'),
        ('actual', 'Actual'),
        ('baseline', 'Baseline'),
    ]
    
    deliverable = models.ForeignKey(Deliverable, on_delete=models.CASCADE, related_name='projects')
    outcome = models.CharField(max_length=500)
    indicator = models.CharField(max_length=500)
    year = models.IntegerField(validators=[MinValueValidator(2000), MaxValueValidator(2100)])
    quarter = models.IntegerField(choices=QUARTER_CHOICES)
    baseline_data = models.CharField(max_length=500, blank=True, null=True)
    target_data = models.CharField(max_length=500, blank=True, null=True)
    actual_data = models.IntegerField(blank=True, null=True)
    performance_rating = models.IntegerField(
        choices=PERFORMANCE_RATING_CHOICES,
        blank=True,
        null=True
    )
    performance_comment = models.TextField(blank=True)
    performance_historics = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0
    )
    target_historics = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0
    )
    performance_type = models.CharField(
        max_length=50,
        choices=PERFORMANCE_TYPE_CHOICES,
        default='actual'
    )
    
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_projects'
    )
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='updated_projects'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.outcome} - {self.year} Q{self.quarter}"
    
    class Meta:
        ordering = ['-year', '-quarter', 'deliverable']
        unique_together = ['deliverable', 'year', 'quarter']