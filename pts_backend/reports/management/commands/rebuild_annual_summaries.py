from django.core.management.base import BaseCommand
from django.utils import timezone
from main.models import (
    IndicatorAnnualSummary, DeliverableAnnualReport,
    FederalPriorityAreaAnnualReport, Deliverable,
    FederalPriorityArea, Indicator,
)
from reports.services import (
    deliverables, priority_areas, _quarterly_trend,
)


class Command(BaseCommand):
    help = "Rebuild annual summary caches from IndicatorQuarterlyProgress"

    def add_arguments(self, parser):
        parser.add_argument('--year', type=int, default=None)

    def handle(self, *args, **opts):
        year = opts['year'] or timezone.now().year
        self.stdout.write(f'Rebuilding for {year}…')

        # Deliverable reports
        d = deliverables(year)
        for row in d['rows']:
            DeliverableAnnualReport.objects.update_or_create(
                deliverable_id=row['id'], year=year,
                defaults={
                    'total_indicators': row['indicators_count'],
                    'average_achievement': row['achievement_pct'],
                    'overall_rating': 0,
                },
            )

        # Priority area reports
        pa = priority_areas(year)
        for row in pa['rows']:
            FederalPriorityAreaAnnualReport.objects.update_or_create(
                federal_priority_area_id=row['id'], year=year,
                defaults={
                    'total_deliverables': row['deliverables_count'],
                    'total_indicators': row['indicators_count'],
                    'average_achievement': row['achievement_pct'],
                    'overall_rating': 0,
                },
            )

        self.stdout.write(self.style.SUCCESS('Done.'))