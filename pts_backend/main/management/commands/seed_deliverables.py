from django.core.management.base import BaseCommand
from main.models import PriorityArea, Deliverable


class Command(BaseCommand):
    help = "Seed deliverables"

    def handle(self, *args, **kwargs):

        def get_pa(name):
            try:
                return PriorityArea.objects.get(name=name)
            except PriorityArea.DoesNotExist:
                self.stdout.write(self.style.ERROR(f"Missing: {name}"))
                return None

        data = {
            "Boost Agriculture To Achieve Food Security": [
                ("Provision of Livelihood Enhancement Scheme", "1000000", "beneficiaries"),
                ("Expansion of Irrigation Infrastructure", "50000", "hectares"),
                ("Increase Local Food Production", "20", "%"),
            ],
            "Reform The Economy To Deliver Sustained And Inclusive Growth": [
                ("Improve Ease of Doing Business Ranking", "Top 100", "rank"),
                ("SME Support Programs", "500000", "businesses"),
            ],
        }

        for priority_name, items in data.items():
            pa = get_pa(priority_name)
            if not pa:
                continue

            for name, target, unit in items:
                obj, created = Deliverable.objects.get_or_create(
                    priority_area=pa,
                    name=name,
                    defaults={
                        "target_value": target,
                        "unit": unit
                    }
                )

                if created:
                    self.stdout.write(self.style.SUCCESS(f"Created: {name}"))
                else:
                    self.stdout.write(f"Exists: {name}")

        self.stdout.write(self.style.SUCCESS("✅ Deliverables seeded"))