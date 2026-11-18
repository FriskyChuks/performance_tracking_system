from django.core.management.base import BaseCommand
from main.models import FederalPriorityArea, Deliverable


class Command(BaseCommand):
    help = "Seed deliverables"

    def handle(self, *args, **kwargs):

        def get_fpa(name):
            try:
                return FederalPriorityArea.objects.get(name=name)
            except FederalPriorityArea.DoesNotExist:
                self.stdout.write(self.style.ERROR(f"Missing: {name}"))
                return None

        data = {
            "Boost Agriculture To Achieve Food Security": [
                "Provision of Livelihood Enhancement Scheme",
                "Expansion of Irrigation Infrastructure",
                "Increase Local Food Production",
            ],
            "Reform The Economy To Deliver Sustained And Inclusive Growth": [
                "Improve Ease of Doing Business Ranking",
                "SME Support Programs",
            ],
        }

        for fpa_name, items in data.items():
            fpa = get_fpa(fpa_name)
            if not fpa:
                continue

            for name in items:
                obj, created = Deliverable.objects.get_or_create(
                    name=name,
                    defaults={
                        "federal_priority_area": fpa,
                        "description": name,
                        "code": name[:10].upper().replace(" ", "_")  # simple code generator
                    }
                )

                if created:
                    self.stdout.write(self.style.SUCCESS(f"Created: {name}"))
                else:
                    self.stdout.write(f"Exists: {name}")

        self.stdout.write(self.style.SUCCESS("✅ Deliverables seeded"))