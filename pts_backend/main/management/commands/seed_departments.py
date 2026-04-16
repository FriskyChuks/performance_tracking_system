from django.core.management.base import BaseCommand
from main.models import Department


class Command(BaseCommand):
    help = "Seed departments"

    def handle(self, *args, **kwargs):
        departments = [
            ("Climate Change", "DCC", "Handles climate policy and mitigation"),
            ("Forestry", "FOR", "Manages forest resources"),
            ("Erosion, Flood and Coastal Zone Management", "EFCZM", "Handles erosion and flood control"),
            ("Pollution Control and Environmental Health", "PCEH", "Regulates pollution"),
            ("Environmental Assessment", "EIA", "Conducts impact assessments"),
            ("Planning, Research and Statistics", "PRS", "Handles planning and data"),
            ("Finance and Accounts", "FIN", "Manages finances"),
            ("Human Resources Management", "HRM", "Manages staff"),
            ("General Services", "GS", "Handles logistics"),
        ]

        for name, code, desc in departments:
            obj, created = Department.objects.get_or_create(
                name=name,
                defaults={"code": code, "description": desc}
            )

            if created:
                self.stdout.write(self.style.SUCCESS(f"Created: {name}"))
            else:
                self.stdout.write(f"Exists: {name}")

        self.stdout.write(self.style.SUCCESS("✅ Departments seeded"))