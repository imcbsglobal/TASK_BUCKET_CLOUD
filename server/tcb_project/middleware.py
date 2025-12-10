"""
API Key Authentication Middleware for TaskBucket Cloud
Validates the X-API-Key header on all API requests
"""

from django.http import JsonResponse
from django.conf import settings


class APIKeyMiddleware:
    """
    Middleware to validate API key in request headers.
    
    Checks for 'X-API-Key' header and compares against the configured API key.
    Returns 401 Unauthorized if the key is missing or invalid.
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
        # Hardcoded API key for basic authentication
        self.valid_api_key = getattr(settings, 'API_KEY', 'imcbs-secret-key-2025')
        
    def __call__(self, request):
        # Skip API key validation for admin and certain paths
        exempt_paths = [
            '/admin/',
            '/static/',
            '/media/',
        ]
        
        # Check if path is exempt
        if any(request.path.startswith(path) for path in exempt_paths):
            return self.get_response(request)
        
        # Check if this is an API request (starts with /api/)
        if request.path.startswith('/api/'):
            # Get API key from header
            provided_key = request.headers.get('X-API-Key', '')
            
            # Validate API key
            if not provided_key:
                return JsonResponse({
                    'success': False,
                    'error': 'API key is required. Please provide X-API-Key header.'
                }, status=401)
            
            if provided_key != self.valid_api_key:
                return JsonResponse({
                    'success': False,
                    'error': 'Invalid API key. Access denied.'
                }, status=401)
        
        # If validation passed or not an API request, proceed
        response = self.get_response(request)
        return response
