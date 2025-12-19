from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from .models import Image
from .utils.client_validator import validate_client_id
import uuid
import os


@csrf_exempt
@require_http_methods(["POST"])
def upload_image(request):
    """
    Upload an image to Cloudflare R2 bucket and return its URL.
    
    Expected: POST request with 'image' file in multipart/form-data
    Optional: 'name' and 'description' fields
    Returns: JSON with image URL and metadata
    """
    try:
        # Check if image file is present
        if 'image' not in request.FILES:
            return JsonResponse({
                'success': False,
                'error': 'No image file provided. Please send a file with key "image".'
            }, status=400)
        
        image_file = request.FILES['image']
        
        # Get name, description, and client_id from POST data
        name = request.POST.get('name', None)
        description = request.POST.get('description', None)
        client_id = request.POST.get('client_id', None)

        # client_id is required
        if not client_id:
            return JsonResponse({
                'success': False,
                'error': 'client_id is required'
            }, status=400)
        
        # Validate client_id against remote API
        is_valid, error_message = validate_client_id(client_id)
        if not is_valid:
            return JsonResponse({
                'success': False,
                'error': error_message
            }, status=403)
        
        # Validate file type (basic check)
        allowed_extensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp']
        file_ext = os.path.splitext(image_file.name)[1].lower()
        
        if file_ext not in allowed_extensions:
            return JsonResponse({
                'success': False,
                'error': f'Invalid file type. Allowed: {", ".join(allowed_extensions)}'
            }, status=400)

        # If the upload is bigger than server threshold, try server-side compression
        from django.conf import settings as django_settings
        try:
            max_mb = float(getattr(django_settings, 'IMAGE_MAX_UPLOAD_MB', 1))
        except Exception:
            max_mb = 1.0

        compressed_flag = False
        if getattr(image_file, 'size', 0) > max_mb * 1024 * 1024:
            from .utils.compress_image import compress_image_file
            compressed = compress_image_file(
                image_file,
                max_size_mb=max_mb,
                initial_quality=getattr(django_settings, 'IMAGE_COMPRESSION_QUALITY', 80),
                min_quality=getattr(django_settings, 'IMAGE_COMPRESSION_MIN_QUALITY', 45),
            )
            # If compressed, replace the file and update extension used
            if compressed is not None and compressed is not image_file:
                image_file = compressed
                file_ext = os.path.splitext(getattr(image_file, 'name', image_file.name))[1].lower()
                compressed_flag = True

        # Generate unique filename for storage
        unique_filename = f"{uuid.uuid4()}{file_ext}"
        original_filename = getattr(image_file, 'original_name', None) or image_file.name  # Always capture before overwrite
        image_file.name = unique_filename  # Force unique name for ImageField

        # Save metadata to database, store image file using ImageField
        image_obj = Image.objects.create(
            filename=unique_filename,
            image=image_file,
            original_filename=original_filename,
            client_id=client_id,
            name=name,
            description=description,
            size=image_file.size
        )

        return JsonResponse({
            'success': True,
            'id': image_obj.id,
            'url': image_obj.image.url if image_obj.image else None,
            'filename': unique_filename,
            'original_filename': original_filename,
            'client_id': client_id,
            'name': name,
            'description': description,
            'size': image_file.size,
            'compressed': compressed_flag,
            'uploaded_at': image_obj.uploaded_at.isoformat()
        }, status=201)
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': f'Upload failed: {str(e)}'
        }, status=500)


@csrf_exempt
@require_http_methods(["GET"])
def list_images(request):
    """
    List images from the database with filtering, search, sorting, and pagination.
    
    Query parameters:
    - client_id: Filter by client ID
    - search: Search in name, description, filename
    - sort_by: Field to sort by (uploaded_at, name, size) - default: -uploaded_at
    - page: Page number (default: 1)
    - page_size: Items per page (default: 20, max: 100)
    
    Returns: JSON with paginated list of images and metadata
    """
    try:
        # Get query parameters
        client_id = request.GET.get('client_id', '').strip()
        search = request.GET.get('search', '').strip()
        sort_by = request.GET.get('sort_by', '-uploaded_at')
        page = int(request.GET.get('page', 1))
        page_size = min(int(request.GET.get('page_size', 20)), 100)
        
        # Start with all images
        queryset = Image.objects.all()
        
        # Apply client_id filter
        if client_id:
            queryset = queryset.filter(client_id__iexact=client_id)
        
        # Apply search filter
        if search:
            from django.db.models import Q
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(description__icontains=search) |
                Q(filename__icontains=search) |
                Q(original_filename__icontains=search)
            )
        
        # Apply sorting
        valid_sort_fields = ['uploaded_at', '-uploaded_at', 'name', '-name', 'size', '-size', 'client_id', '-client_id']
        if sort_by in valid_sort_fields:
            queryset = queryset.order_by(sort_by)
        else:
            queryset = queryset.order_by('-uploaded_at')
        
        # Get total count before pagination
        total_count = queryset.count()
        
        # Calculate pagination
        start_idx = (page - 1) * page_size
        end_idx = start_idx + page_size
        total_pages = (total_count + page_size - 1) // page_size
        
        # Get paginated images
        images = queryset[start_idx:end_idx]
        
        image_list = []
        for img in images:
            image_list.append({
                'id': img.id,
                'filename': img.filename,
                'url': img.image.url if img.image else None,
                'original_filename': img.original_filename,
                'client_id': img.client_id,
                'name': img.name,
                'description': img.description,
                'size': img.size,
                'uploaded_at': img.uploaded_at.isoformat()
            })
        
        return JsonResponse({
            'success': True,
            'images': image_list,
            'pagination': {
                'page': page,
                'page_size': page_size,
                'total_count': total_count,
                'total_pages': total_pages,
                'has_next': page < total_pages,
                'has_previous': page > 1
            },
            'filters': {
                'client_id': client_id,
                'search': search,
                'sort_by': sort_by
            }
        }, status=200)
        
    except ValueError as e:
        return JsonResponse({
            'success': False,
            'error': f'Invalid parameter: {str(e)}'
        }, status=400)
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': f'Failed to list images: {str(e)}'
        }, status=500)


@csrf_exempt
@require_http_methods(["PUT"])
def update_image(request, image_id):
    """
    Update image metadata (name, description).
    
    Expected: PUT request with JSON body containing 'name' and/or 'description'
    Returns: JSON with updated image data
    """
    try:
        # Get the image from database
        try:
            image_obj = Image.objects.get(id=image_id)
        except Image.DoesNotExist:
            return JsonResponse({
                'success': False,
                'error': f'Image with id {image_id} not found.'
            }, status=404)
        
        # Parse JSON body
        import json
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({
                'success': False,
                'error': 'Invalid JSON in request body.'
            }, status=400)
        
        # Update fields if provided
        if 'name' in data:
            image_obj.name = data['name']
        if 'description' in data:
            image_obj.description = data['description']
        if 'client_id' in data:
            image_obj.client_id = data['client_id']
        
        image_obj.save()
        
        return JsonResponse({
            'success': True,
            'id': image_obj.id,
            'filename': image_obj.filename,
            'url': image_obj.image.url if image_obj.image else None,
            'original_filename': image_obj.original_filename,
            'client_id': image_obj.client_id,
            'name': image_obj.name,
            'description': image_obj.description,
            'size': image_obj.size,
            'uploaded_at': image_obj.uploaded_at.isoformat()
        }, status=200)
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': f'Update failed: {str(e)}'
        }, status=500)


@csrf_exempt
@require_http_methods(["GET"])
def get_stats(request):
    """
    Get statistics about uploaded images.
    
    Returns: JSON with overall stats and breakdown by client_id
    """
    try:
        from django.db.models import Count, Sum
        
        # Overall stats
        total_images = Image.objects.count()
        total_size = Image.objects.aggregate(Sum('size'))['size__sum'] or 0
        
        # Stats by client_id
        client_stats = Image.objects.values('client_id').annotate(
            count=Count('id'),
            total_size=Sum('size')
        ).order_by('-count')
        
        # Count unique client IDs from the aggregated groups (handles empty strings correctly)
        unique_clients_count = client_stats.count()
        
        return JsonResponse({
            'success': True,
            'stats': {
                'total_images': total_images,
                'total_size': total_size,
                'unique_clients': unique_clients_count,
                'by_client': list(client_stats)
            }
        }, status=200)
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': f'Failed to get stats: {str(e)}'
        }, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def validate_client(request):
    """
    Validate a client ID against the remote API.
    
    Expected: POST request with JSON body containing 'client_id'
    Returns: JSON with validation result
    """
    try:
        import json
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({
                'success': False,
                'error': 'Invalid JSON in request body.'
            }, status=400)
        
        client_id = data.get('client_id', '').strip()
        
        if not client_id:
            return JsonResponse({
                'success': False,
                'valid': False,
                'error': 'client_id is required'
            }, status=400)
        
        is_valid, error_message = validate_client_id(client_id)
        
        if is_valid:
            return JsonResponse({
                'success': True,
                'valid': True,
                'message': 'Client ID is valid'
            }, status=200)
        else:
            return JsonResponse({
                'success': True,
                'valid': False,
                'error': error_message
            }, status=200)
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': f'Validation failed: {str(e)}'
        }, status=500)


@csrf_exempt
@require_http_methods(["DELETE"])
def delete_image(request, image_id):
    """
    Delete an image from the database and Cloudflare R2 storage.
    
    Expected: DELETE request with image_id in URL
    Returns: JSON with success status
    """
    try:
        # Get the image from database
        try:
            image_obj = Image.objects.get(id=image_id)
        except Image.DoesNotExist:
            return JsonResponse({
                'success': False,
                'error': f'Image with id {image_id} not found.'
            }, status=404)
        
        # Delete file from storage
        if image_obj.image:
            try:
                if default_storage.exists(image_obj.image.name):
                    default_storage.delete(image_obj.image.name)
            except Exception as storage_error:
                # Continue with DB deletion even if storage deletion fails
                print(f"Warning: Could not delete file from storage: {storage_error}")
        
        # Delete from database
        image_obj.delete()
        
        return JsonResponse({
            'success': True,
            'message': f'Image {image_id} deleted successfully.'
        }, status=200)
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': f'Delete failed: {str(e)}'
        }, status=500)
