# pts_backend/urls.py
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/accounts/', include('accounts.urls')),
    path('api/main/', include('main.urls')),
    path('api/engagement/', include('engagement.urls')),
    path('api/reports/', include('reports.urls')),
    
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)