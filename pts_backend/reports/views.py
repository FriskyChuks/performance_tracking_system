from django.utils import timezone
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status

from .permissions import CanViewReports, CanViewExpertReports
from .serializers import ReportQuerySerializer
from . import services


def _year_from(request):
    y = request.query_params.get('year')
    if y:
        try:
            return int(y)
        except ValueError:
            pass
    return timezone.now().year


class SummaryView(APIView):
    permission_classes = [CanViewReports]
    def get(self, request):
        return Response(services.summary(_year_from(request)))


class PriorityAreasView(APIView):
    permission_classes = [CanViewReports]
    def get(self, request):
        return Response(services.priority_areas(_year_from(request)))


class DeliverablesView(APIView):
    permission_classes = [CanViewReports]
    def get(self, request):
        s = ReportQuerySerializer(data=request.query_params)
        s.is_valid(raise_exception=False)
        pid = s.validated_data.get('priority_area')
        return Response(services.deliverables(_year_from(request), pid))


class DepartmentsView(APIView):
    permission_classes = [CanViewReports]
    def get(self, request):
        dept = request.query_params.get('department')
        try:
            dept = int(dept) if dept else None
        except ValueError:
            dept = None
        return Response(services.departments(_year_from(request), dept))


class AgenciesView(APIView):
    permission_classes = [CanViewReports]
    def get(self, request):
        ag = request.query_params.get('agency')
        try:
            ag = int(ag) if ag else None
        except ValueError:
            ag = None
        return Response(services.agencies(_year_from(request), ag))


class AtRiskActivitiesView(APIView):
    permission_classes = [CanViewReports]
    def get(self, request):
        return Response(services.at_risk_activities(_year_from(request)))


class QuarterlyTrendView(APIView):
    permission_classes = [CanViewReports]
    def get(self, request):
        return Response(services.quarterly_trend(_year_from(request)))


class AssessmentsView(APIView):
    permission_classes = [CanViewExpertReports]
    def get(self, request):
        return Response(services.assessments(_year_from(request)))