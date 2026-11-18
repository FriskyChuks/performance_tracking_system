from django.core.management.base import BaseCommand
from main.models import FederalPriorityArea


class Command(BaseCommand):
    help = "Seed federal priority areas"

    def handle(self, *args, **kwargs):
        data = [
            ("Reform The Economy To Deliver Sustained And Inclusive Growth", "ECON", False, 1),
            ("Strengthen National Security For Peace And Prosperity", "SEC", False, 2),
            ("Boost Agriculture To Achieve Food Security", "AGRIC", True, 3),
            ("Unlock Energy And Natural Resources For Sustainable Development", "ENERGY", True, 4),
            ("Enhance Infrastructure And Transportation As Enablers For Growth", "INFRA", False, 5),
            ("Focus On Education, Health, And Social Investment As Essential Pillars Of Development", "SOCIAL", False, 6),
            ("Accelerate Diversification Through Industrialisation, Digitisation, Creative Arts, Manufacturing, And Innovation", "DIVERSIFY", False, 7),
            ("Improve Governance For Effective Service Delivery", "GOV", True, 8),
        ]

        for name, code, is_primary, order in data:
            obj, created = FederalPriorityArea.objects.get_or_create(
                name=name,
                defaults={
                    "code": code,
                    "is_primary_for_ministry": is_primary,
                    "order": order,
                    "description": name  # optional placeholder
                }
            )

            if created:
                self.stdout.write(self.style.SUCCESS(f"Created: {name}"))
            else:
                self.stdout.write(f"Exists: {name}")

        self.stdout.write(self.style.SUCCESS("✅ Federal Priority Areas seeded"))