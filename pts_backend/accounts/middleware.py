# accounts/middleware.py
from django.utils.deprecation import MiddlewareMixin
from django.http import JsonResponse
from django.urls import resolve

from .models import ActivityLog


class ActivityLogMiddleware(MiddlewareMixin):
    def process_request(self, request):
        # Store request info for later use
        request._user_agent = request.META.get('HTTP_USER_AGENT', '')
        request._ip_address = self.get_client_ip(request)
        return None
    
    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip
    
    def process_response(self, request, response):
        # Optional: Log certain actions automatically
        return response

    @staticmethod
    def log_activity(user, action, description, request=None):
        """Helper method to log activities"""
        ip_address = request._ip_address if request and hasattr(request, '_ip_address') else None
        user_agent = request._user_agent if request and hasattr(request, '_user_agent') else ''
        
        ActivityLog.objects.create(
            user=user,
            action=action,
            description=description,
            ip_address=ip_address,
            user_agent=user_agent
        )


class DashboardAccessMiddleware:
    """Middleware to restrict dashboard access to authorized users only"""
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        # Check if the request is for dashboard API
        if request.path.startswith('/api/main/') or request.path.startswith('/api/reports/'):
            if request.user.is_authenticated:
                # Check if user has dashboard access
                if not (request.user.can_access_dashboard or request.user.is_staff or request.user.is_superuser):
                    return JsonResponse(
                        {'error': 'You do not have permission to access this resource'},
                        status=403
                    )
        
        response = self.get_response(request)
        return response