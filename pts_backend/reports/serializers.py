from rest_framework import serializers

class ReportQuerySerializer(serializers.Serializer):
    year = serializers.IntegerField(required=False, min_value=2000, max_value=2100)
    priority_area = serializers.IntegerField(required=False, allow_null=True)
    department = serializers.IntegerField(required=False, allow_null=True)
    agency = serializers.IntegerField(required=False, allow_null=True)