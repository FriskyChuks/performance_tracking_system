# accounts/middleware.py
from django.utils.deprecation import MiddlewareMixin
from .models import ActivityLog

class ActivityLogMiddleware(MiddlewareMixin):
    """Middleware to log user activities automatically"""
    
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
        return response

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
                    from django.http import JsonResponse
                    return JsonResponse(
                        {'error': 'You do not have permission to access this resource'},
                        status=403
                    )
        
        response = self.get_response(request)
        return response

# Utility function for logging activities
def log_activity(user, action, description, request=None):
    """Helper function to log user activities"""
    ip_address = None
    user_agent = ''
    
    if request:
        ip_address = getattr(request, '_ip_address', None)
        user_agent = getattr(request, '_user_agent', '')
    
    ActivityLog.objects.create(
        user=user,
        action=action,
        description=description,
        ip_address=ip_address,
        user_agent=user_agent
    )