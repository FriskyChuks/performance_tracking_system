from django.core.management import call_command
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Seed all data"

    def handle(self, *args, **kwargs):
        call_command("seed_departments")
        call_command("seed_agencies")
        call_command("seed_priority_areas")
        call_command("seed_deliverables")

        self.stdout.write(self.style.SUCCESS("✅ All data seeded"))