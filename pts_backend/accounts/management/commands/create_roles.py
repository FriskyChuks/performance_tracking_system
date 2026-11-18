# yourapp/management/commands/create_roles.py
from django.core.management.base import BaseCommand
from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType
from main.models import ProjectActivity, Indicator, Deliverable, FederalPriorityArea, Department, Agency, IndicatorQuarterlyProgress

class Command(BaseCommand):
    help = 'Create user roles/groups'

    def handle(self, *args, **kwargs):
        roles = {
            'project_admin': {
                'description': 'Can create and manage all activities, departments, agencies',
                'models': [ProjectActivity, Indicator, Deliverable, FederalPriorityArea, Department, Agency]
            },
            'delivery_officer': {
                'description': 'Can update progress and upload images',
                'models': [IndicatorQuarterlyProgress]
            },
            'director': {
                'description': 'Can approve or reject submissions',
                'models': [IndicatorQuarterlyProgress]
            },
            'sector_expert': {
                'description': 'Can assess approved quarters',
                'models': [IndicatorQuarterlyProgress]
            },
        }
        
        for role_name, role_info in roles.items():
            group, created = Group.objects.get_or_create(name=role_name)
            if created:
                self.stdout.write(f'Created role: {role_name}')
            else:
                self.stdout.write(f'Role already exists: {role_name}')
        
        self.stdout.write(self.style.SUCCESS('Successfully created all roles'))