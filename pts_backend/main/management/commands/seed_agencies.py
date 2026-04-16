from django.core.management.base import BaseCommand
from main.models import Agency


class Command(BaseCommand):
    help = "Seed agencies"

    def handle(self, *args, **kwargs):
        agencies = [
            ("National Environmental Standards and Regulations Enforcement Agency", "NESREA", "Environmental enforcement", "https://nesrea.gov.ng"),
            ("National Oil Spill Detection and Response Agency", "NOSDRA", "Oil spill response", "https://nosdra.gov.ng"),
            ("Forestry Research Institute of Nigeria", "FRIN", "Forestry research", "https://frin.gov.ng"),
            ("National Parks Service", "NPS", "Manages national parks", "https://nigeriaparkservice.gov.ng"),
        ]

        for name, code, desc, website in agencies:
            obj, created = Agency.objects.get_or_create(
                name=name,
                defaults={
                    "code": code,
                    "description": desc,
                    "website": website
                }
            )

            if created:
                self.stdout.write(self.style.SUCCESS(f"Created: {name}"))
            else:
                self.stdout.write(f"Exists: {name}")

        self.stdout.write(self.style.SUCCESS("✅ Agencies seeded"))