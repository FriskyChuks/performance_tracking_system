"""
Aggregation layer for all report endpoints.
Reads directly from IndicatorQuarterlyProgress so no annual-cache is required.
Adds `flags` to each row so the frontend doesn't re-derive risk rules.
"""
from decimal import Decimal
from django.db.models import Sum, Count, Avg, Q, Max, F
from django.utils import timezone
from main.models import (
    FederalPriorityArea, Deliverable, Indicator,
    ProjectActivity, IndicatorQuarterlyProgress,
)

STAFF_APPROVED_STATUSES = ('approved', 'assessed')


def _dec(v):
    if v is None:
        return 0.0
    if isinstance(v, Decimal):
        return float(v)
    try:
        return float(v)
    except (TypeError, ValueError):
        return 0.0


def _achievement_pct(actual, target):
    if not target:
        return 0.0
    return round((actual / target) * 100, 1)


def _elapsed_pct(year):
    """% of the fiscal year that has passed."""
    today = timezone.now().date()
    if today.year < year:
        return 0.0
    if today.year > year:
        return 100.0
    # 365-day model
    start = timezone.datetime(year, 1, 1).date()
    elapsed_days = (today - start).days
    return round(min(elapsed_days / 365 * 100, 100), 1)


def _flags(achievement_pct, elapsed_pct, statuses, has_data):
    flags = []
    if not has_data:
        flags.append('no_approved_data')
    if elapsed_pct > 0 and achievement_pct < elapsed_pct - 15:
        flags.append('behind_schedule')
    if statuses.get('draft', 0) > 0 and elapsed_pct > 25:
        flags.append('stale_drafts')
    if statuses.get('submitted', 0) > 0 and elapsed_pct > 50:
        flags.append('pending_reviews')
    return flags


def _status_counts(qs):
    agg = qs.values('status').annotate(c=Count('id'))
    return {row['status']: row['c'] for row in agg}


# ============================================================
# 1. Summary
# ============================================================

def summary(year):
    elapsed = _elapsed_pct(year)

    qs = IndicatorQuarterlyProgress.objects.filter(year=year)
    staff_qs = qs.filter(status__in=STAFF_APPROVED_STATUSES)

    # Annual target = sum of indicator targets across distinct indicators present
    indicator_targets = (
        staff_qs.values('indicator_id')
        .annotate(t=Max('indicator__target_value'))
        .aggregate(total=Sum('t'))['total']
    )
    annual_target = _dec(indicator_targets)
    annual_actual = _dec(staff_qs.aggregate(s=Sum('actual_value'))['s'])
    achievement = _achievement_pct(annual_actual, annual_target)

    # Projected year-end based on pace
    projected = 0.0
    if elapsed > 0 and achievement > 0:
        projected = round(min(achievement / (elapsed / 100), 200), 1)

    statuses = _status_counts(qs)
    flags = _flags(achievement, elapsed, statuses, has_data=annual_actual > 0)

    # Per priority area
    pas = FederalPriorityArea.objects.all().order_by('order', 'name')
    pa_rows = []
    for pa in pas:
        pa_rows.append(_priority_area_row(pa, year, elapsed))

    # Quarterly trend
    trend = _quarterly_trend(year)

    return {
        'year': year,
        'elapsed_pct': elapsed,
        'overall': {
            'annual_target': annual_target,
            'annual_actual': annual_actual,
            'achievement_pct': achievement,
            'projected_year_end_pct': projected,
            'activities_count': ProjectActivity.objects.filter(
                quarterly_progress__year=year
            ).distinct().count(),
            'indicators_count': (
                staff_qs.values('indicator_id').distinct().count()
            ),
            'status_counts': statuses,
            'flags': flags,
        },
        'priority_areas': pa_rows,
        'quarterly_trend': trend,
    }


# ============================================================
# 2. Priority Areas
# ============================================================

def _priority_area_row(pa, year, elapsed):
    qs = IndicatorQuarterlyProgress.objects.filter(
        year=year,
        status__in=STAFF_APPROVED_STATUSES,
        indicator__deliverable__federal_priority_area=pa,
    )
    target = _dec(
        qs.values('indicator_id')
        .annotate(t=Max('indicator__target_value'))
        .aggregate(total=Sum('t'))['total']
    )
    actual = _dec(qs.aggregate(s=Sum('actual_value'))['s'])
    achievement = _achievement_pct(actual, target)
    statuses = _status_counts(
        IndicatorQuarterlyProgress.objects.filter(
            year=year,
            indicator__deliverable__federal_priority_area=pa,
        )
    )
    return {
        'id': pa.id,
        'name': pa.name,
        'is_primary_for_ministry': pa.is_primary_for_ministry,
        'deliverables_count': Deliverable.objects.filter(
            federal_priority_area=pa
        ).count(),
        'indicators_count': Indicator.objects.filter(
            deliverable__federal_priority_area=pa
        ).count(),
        'annual_target': target,
        'annual_actual': actual,
        'achievement_pct': achievement,
        'status_counts': statuses,
        'flags': _flags(achievement, elapsed, statuses, has_data=actual > 0),
    }


def priority_areas(year):
    elapsed = _elapsed_pct(year)
    pas = FederalPriorityArea.objects.all().order_by('order', 'name')
    return {
        'year': year,
        'elapsed_pct': elapsed,
        'rows': [_priority_area_row(pa, year, elapsed) for pa in pas],
    }


# ============================================================
# 3. Deliverables
# ============================================================

def deliverables(year, priority_area_id=None):
    elapsed = _elapsed_pct(year)
    dqs = Deliverable.objects.all().select_related('federal_priority_area')
    if priority_area_id:
        dqs = dqs.filter(federal_priority_area_id=priority_area_id)

    rows = []
    for d in dqs:
        qs = IndicatorQuarterlyProgress.objects.filter(
            year=year,
            status__in=STAFF_APPROVED_STATUSES,
            indicator__deliverable=d,
        )
        target = _dec(
            qs.values('indicator_id')
            .annotate(t=Max('indicator__target_value'))
            .aggregate(total=Sum('t'))['total']
        )
        actual = _dec(qs.aggregate(s=Sum('actual_value'))['s'])
        achievement = _achievement_pct(actual, target)
        statuses = _status_counts(
            IndicatorQuarterlyProgress.objects.filter(
                year=year, indicator__deliverable=d
            )
        )
        rows.append({
            'id': d.id,
            'name': d.name,
            'federal_priority_area_id': d.federal_priority_area_id,
            'federal_priority_area_name': (
                d.federal_priority_area.name if d.federal_priority_area else None
            ),
            'indicators_count': Indicator.objects.filter(deliverable=d).count(),
            'annual_target': target,
            'annual_actual': actual,
            'achievement_pct': achievement,
            'status_counts': statuses,
            'flags': _flags(achievement, elapsed, statuses, has_data=actual > 0),
        })
    return {'year': year, 'elapsed_pct': elapsed, 'rows': rows}


# ============================================================
# 4/5. Departments & Agencies
# ============================================================

def _org_report(year, kind, org_id=None):
    from main.models import Department, Agency
    elapsed = _elapsed_pct(year)

    Model = Department if kind == 'department' else Agency
    fk = f'{kind}_id'

    org_qs = Model.objects.all()
    if org_id:
        org_qs = org_qs.filter(id=org_id)

    rows = []
    for org in org_qs:
        filter_kwargs = {f'activity__{fk}': org.id}
        qs = IndicatorQuarterlyProgress.objects.filter(
            year=year,
            status__in=STAFF_APPROVED_STATUSES,
            **filter_kwargs,
        )
        target = _dec(
            qs.values('indicator_id')
            .annotate(t=Max('indicator__target_value'))
            .aggregate(total=Sum('t'))['total']
        )
        actual = _dec(qs.aggregate(s=Sum('actual_value'))['s'])
        achievement = _achievement_pct(actual, target)
        statuses = _status_counts(
            IndicatorQuarterlyProgress.objects.filter(
                year=year, **filter_kwargs
            )
        )
        rows.append({
            'id': org.id,
            'name': org.name,
            'activities_count': ProjectActivity.objects.filter(
                **{fk: org.id}
            ).count(),
            'annual_target': target,
            'annual_actual': actual,
            'achievement_pct': achievement,
            'status_counts': statuses,
            'flags': _flags(achievement, elapsed, statuses, has_data=actual > 0),
        })
    return {'year': year, 'elapsed_pct': elapsed, 'kind': kind, 'rows': rows}


def departments(year, department_id=None):
    return _org_report(year, 'department', department_id)


def agencies(year, agency_id=None):
    return _org_report(year, 'agency', agency_id)


# ============================================================
# 6. At-risk activities
# ============================================================

def at_risk_activities(year):
    elapsed = _elapsed_pct(year)
    activities = ProjectActivity.objects.filter(
        quarterly_progress__year=year
    ).distinct()

    rows = []
    for a in activities:
        qs = IndicatorQuarterlyProgress.objects.filter(
            year=year, activity=a,
        )
        approved_qs = qs.filter(status__in=STAFF_APPROVED_STATUSES)
        target = _dec(
            approved_qs.values('indicator_id')
            .annotate(t=Max('indicator__target_value'))
            .aggregate(total=Sum('t'))['total']
        )
        actual = _dec(approved_qs.aggregate(s=Sum('actual_value'))['s'])
        achievement = _achievement_pct(actual, target)
        statuses = _status_counts(qs)

        flags = []
        if achievement < elapsed - 15:
            flags.append('behind_schedule')
        if statuses.get('draft', 0) > 0 and elapsed > 25:
            flags.append('stale_drafts')
        if statuses.get('submitted', 0) > 0 and elapsed > 50:
            flags.append('pending_reviews')
        if actual == 0 and elapsed > 25:
            flags.append('no_actuals')

        if flags:  # only include at-risk
            rows.append({
                'id': a.id,
                'title': a.title,
                'activity_type': a.activity_type,
                'status': a.status,
                'department_name': a.department.name if a.department else None,
                'agency_name': a.agency.name if a.agency else None,
                'achievement_pct': achievement,
                'status_counts': statuses,
                'flags': flags,
            })

    rows.sort(key=lambda r: (r['achievement_pct'], -len(r['flags'])))
    return {'year': year, 'elapsed_pct': elapsed, 'rows': rows}


# ============================================================
# 7. Quarterly trend
# ============================================================

def _quarterly_trend(year):
    trend = []
    for q in (1, 2, 3, 4):
        qs = IndicatorQuarterlyProgress.objects.filter(
            year=year, quarter=q, status__in=STAFF_APPROVED_STATUSES
        )
        target = _dec(
            qs.values('indicator_id')
            .annotate(t=Max('indicator__target_value'))
            .aggregate(total=Sum('t'))['total']
        )
        actual = _dec(qs.aggregate(s=Sum('actual_value'))['s'])
        trend.append({
            'quarter': f'Q{q}',
            'quarter_num': q,
            'target': target,
            'actual': actual,
            'achievement_pct': _achievement_pct(actual, target),
        })
    return trend


def quarterly_trend(year):
    return {'year': year, 'series': _quarterly_trend(year)}


# ============================================================
# 8. Assessments
# ============================================================

def assessments(year):
    qs = IndicatorQuarterlyProgress.objects.filter(
        year=year, status='assessed'
    ).select_related('indicator', 'activity')

    accuracy_breakdown = {
        row['data_accuracy']: row['c']
        for row in qs.values('data_accuracy').annotate(c=Count('id'))
    }

    ratings = (
        qs.values('expert_rating')
        .annotate(c=Count('id'))
        .order_by('expert_rating')
    )
    rating_breakdown = {
        str(row['expert_rating']): row['c']
        for row in ratings
        if row['expert_rating'] is not None
    }

    flagged = []
    for row in qs.filter(
        Q(data_accuracy__in=['inaccurate', 'not_verifiable'])
        | Q(effort_percentage__lt=50)
    ):
        flagged.append({
            'id': row.id,
            'activity_title': row.activity.title,
            'indicator_name': row.indicator.name,
            'quarter': row.quarter,
            'data_accuracy': row.data_accuracy,
            'effort_percentage': row.effort_percentage,
            'expert_rating': row.expert_rating,
            'expert_comment': row.expert_comment,
        })

    return {
        'year': year,
        'accuracy_breakdown': accuracy_breakdown,
        'rating_breakdown': rating_breakdown,
        'flagged': flagged,
        'totals': {
            'assessed_count': qs.count(),
            'flagged_count': len(flagged),
        },
    }