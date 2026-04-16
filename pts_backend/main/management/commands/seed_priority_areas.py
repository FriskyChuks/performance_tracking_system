from django.core.management.base import BaseCommand
from main.models import PriorityArea


class Command(BaseCommand):
    help = "Seed priority areas"

    def handle(self, *args, **kwargs):
        data = [
            ("Reform The Economy To Deliver Sustained And Inclusive Growth", "trending-up", "emerald", 1),
            ("Strengthen National Security For Peace And Prosperity", "shield-check", "red", 2),
            ("Boost Agriculture To Achieve Food Security", "leaf", "green", 3),
            ("Unlock Energy And Natural Resources For Sustainable Development", "bolt", "yellow", 4),
            ("Enhance Infrastructure And Transportation As Enablers For Growth", "truck", "blue", 5),
            ("Focus On Education, Health, And Social Investment As Essential Pillars Of Development", "heart", "pink", 6),
            ("Accelerate Diversification Through Industrialisation, Digitisation, Creative Arts, Manufacturing, And Innovation", "cpu", "purple", 7),
            ("Improve Governance For Effective Service Delivery", "building", "gray", 8),
        ]

        for name, icon, color, order in data:
            obj, created = PriorityArea.objects.get_or_create(
                name=name,
                defaults={
                    "icon": icon,
                    "color": color,
                    "order": order
                }
            )

            if created:
                self.stdout.write(self.style.SUCCESS(f"Created: {name}"))
            else:
                self.stdout.write(f"Exists: {name}")

        self.stdout.write(self.style.SUCCESS("✅ Priority Areas seeded"))