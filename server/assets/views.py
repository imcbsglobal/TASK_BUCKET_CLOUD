from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from .models import Image, PendingFileDeletion
from .utils.client_validator import validate_client_id
import uuid
import os


def queue_file_for_deletion(file_path, client_id=None):
    """
    Queue a file for deferred deletion.
    Returns immediately without actually deleting the file.
    """
    try:
        PendingFileDeletion.objects.create(
            file_path=file_path,
            client_id=client_id
        )
    except Exception as e:
        # Log error but don't fail the operation
        print(f"Warning: Failed to queue file for deletion: {e}")


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
        
        # N+1 Query Fix: Use only() to select only needed fields
        # This prevents loading unnecessary data and avoids lazy loading issues
        images = queryset.only(
            'id', 'filename', 'image', 'original_filename', 
            'client_id', 'name', 'description', 'size', 'uploaded_at'
        )[start_idx:end_idx]
        
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
    Delete an image from the database instantly.
    File deletion is queued for background processing.
    
    Expected: DELETE request with image_id in URL
    Returns: JSON with success status (instant response)
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
        
        # Queue file for deletion (if exists)
        if image_obj.image:
            queue_file_for_deletion(image_obj.image.name, image_obj.client_id)
        
        # Delete from database immediately
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


@csrf_exempt
@require_http_methods(["POST"])
def bulk_delete_images(request):
    """
    Bulk delete multiple images by their IDs.
    Metadata deleted instantly, files queued for background deletion.
    
    Expected: POST request with JSON body containing 'image_ids' (array of integers)
    Returns: JSON with count of deleted images (instant response)
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
        
        image_ids = data.get('image_ids', [])
        
        if not image_ids or not isinstance(image_ids, list):
            return JsonResponse({
                'success': False,
                'error': 'image_ids must be a non-empty array of integers.'
            }, status=400)
        
        # Convert to integers and validate
        try:
            image_ids = [int(id) for id in image_ids]
        except (ValueError, TypeError):
            return JsonResponse({
                'success': False,
                'error': 'All image_ids must be valid integers.'
            }, status=400)
        
        # Fetch images to delete - use only() and values() for efficiency
        images_to_delete = Image.objects.filter(id__in=image_ids).only('id', 'image', 'client_id')
        found_ids = set(images_to_delete.values_list('id', flat=True))
        not_found_ids = set(image_ids) - found_ids
        
        # Bulk create queue entries (FAST - single SQL operation)
        pending_deletions = []
        for image_obj in images_to_delete.values('image', 'client_id'):
            if image_obj['image']:
                pending_deletions.append(
                    PendingFileDeletion(
                        file_path=image_obj['image'],
                        client_id=image_obj['client_id']
                    )
                )
        
        # Bulk insert all at once
        if pending_deletions:
            PendingFileDeletion.objects.bulk_create(pending_deletions, batch_size=1000)
        
        # Bulk delete from database immediately
        deleted_count, _ = images_to_delete.delete()
        
        response_data = {
            'success': True,
            'deleted_count': deleted_count,
            'requested_count': len(image_ids),
            'message': f'Successfully deleted {deleted_count} images. Files will be cleaned up in background.'
        }
        
        if not_found_ids:
            response_data['not_found_ids'] = list(not_found_ids)
        
        return JsonResponse(response_data, status=200)
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': f'Bulk delete failed: {str(e)}'
        }, status=500)


@csrf_exempt
@require_http_methods(["DELETE"])
def bulk_delete_by_client(request, client_id):
    """
    Delete all images for a specific client_id instantly.
    Metadata deleted immediately, files queued for background cleanup.
    
    Expected: DELETE request with client_id in URL
    Returns: JSON with count of deleted images (instant response)
    """
    try:
        if not client_id:
            return JsonResponse({
                'success': False,
                'error': 'client_id is required.'
            }, status=400)
        
        # Find all images for this client - use only() for efficiency
        images_to_delete = Image.objects.filter(client_id__iexact=client_id).only('id', 'image', 'client_id')
        total_count = images_to_delete.count()
        
        if total_count == 0:
            return JsonResponse({
                'success': True,
                'deleted_count': 0,
                'message': f'No images found for client_id: {client_id}'
            }, status=200)
        
        # Bulk create queue entries (FAST - single SQL query with bulk_create)
        pending_deletions = []
        for image_obj in images_to_delete.values('image', 'client_id'):
            if image_obj['image']:
                pending_deletions.append(
                    PendingFileDeletion(
                        file_path=image_obj['image'],
                        client_id=image_obj['client_id']
                    )
                )
        
        # Bulk insert all at once (fast operation)
        queued_count = 0
        if pending_deletions:
            PendingFileDeletion.objects.bulk_create(pending_deletions, batch_size=1000)
            queued_count = len(pending_deletions)
        
        # Bulk delete from database immediately (fast operation)
        deleted_count, _ = images_to_delete.delete()
        
        response_data = {
            'success': True,
            'client_id': client_id,
            'deleted_count': deleted_count,
            'files_queued': queued_count,
            'message': f'Successfully deleted all {deleted_count} images for client {client_id}. {queued_count} files queued for background cleanup.'
        }
        
        return JsonResponse(response_data, status=200)
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': f'Bulk delete by client failed: {str(e)}'
        }, status=500)


@csrf_exempt
@require_http_methods(["GET"])
def list_clients(request):
    """
    List all unique clients with their image counts and statistics.
    
    Query parameters:
    - search: Search in client_id
    - sort_by: Field to sort by (client_id, count, total_size, latest_upload) - default: -count
    - page: Page number (default: 1)
    - page_size: Items per page (default: 20, max: 100)
    
    Returns: JSON with paginated list of clients with stats
    """
    try:
        from django.db.models import Count, Sum, Max
        
        # Get query parameters
        search = request.GET.get('search', '').strip()
        sort_by = request.GET.get('sort_by', '-count')
        page = int(request.GET.get('page', 1))
        page_size = min(int(request.GET.get('page_size', 20)), 100)
        
        # Aggregate stats by client_id
        queryset = Image.objects.values('client_id').annotate(
            count=Count('id'),
            total_size=Sum('size'),
            latest_upload=Max('uploaded_at'),
            oldest_upload=Max('uploaded_at')  # Using Max as we want the earliest for oldest
        )
        
        # Fix: Get the actual oldest upload
        from django.db.models import Min
        queryset = Image.objects.values('client_id').annotate(
            count=Count('id'),
            total_size=Sum('size'),
            latest_upload=Max('uploaded_at'),
            oldest_upload=Min('uploaded_at')
        )
        
        # Apply search filter
        if search:
            queryset = queryset.filter(client_id__icontains=search)
        
        # Apply sorting
        valid_sort_fields = {
            'client_id': 'client_id',
            '-client_id': '-client_id',
            'count': 'count',
            '-count': '-count',
            'total_size': 'total_size',
            '-total_size': '-total_size',
            'latest_upload': 'latest_upload',
            '-latest_upload': '-latest_upload',
        }
        
        order_field = valid_sort_fields.get(sort_by, '-count')
        queryset = queryset.order_by(order_field)
        
        # Get total count before pagination
        total_count = queryset.count()
        
        # Calculate pagination
        start_idx = (page - 1) * page_size
        end_idx = start_idx + page_size
        total_pages = (total_count + page_size - 1) // page_size
        
        # Get paginated clients
        clients = list(queryset[start_idx:end_idx])
        
        # Format the response
        client_list = []
        for client in clients:
            client_list.append({
                'client_id': client['client_id'],
                'image_count': client['count'],
                'total_size': client['total_size'] or 0,
                'latest_upload': client['latest_upload'].isoformat() if client['latest_upload'] else None,
                'oldest_upload': client['oldest_upload'].isoformat() if client['oldest_upload'] else None,
            })
        
        return JsonResponse({
            'success': True,
            'clients': client_list,
            'pagination': {
                'page': page,
                'page_size': page_size,
                'total_count': total_count,
                'total_pages': total_pages,
                'has_next': page < total_pages,
                'has_previous': page > 1
            },
            'filters': {
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
            'error': f'Failed to list clients: {str(e)}'
        }, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def cleanup_pending_deletions(request):
    """
    Process queued file deletions in background.
    Call this endpoint periodically (cron, scheduled task, or manually).
    
    Query parameters:
    - batch_size: Number of files to process (default: 100, max: 1000)
    - max_attempts: Skip files that have failed this many times (default: 3)
    
    Returns: JSON with cleanup statistics
    """
    try:
        # Get parameters
        batch_size = min(int(request.GET.get('batch_size', 100)), 1000)
        max_attempts = int(request.GET.get('max_attempts', 3))
        
        # Get pending deletions
        pending = PendingFileDeletion.objects.filter(
            attempts__lt=max_attempts
        ).order_by('queued_at')[:batch_size]
        
        total_processed = 0
        success_count = 0
        failed_count = 0
        skipped_count = 0
        
        for item in pending:
            total_processed += 1
            
            try:
                # Try to delete the file
                default_storage.delete(item.file_path)
                # Success - remove from queue
                item.delete()
                success_count += 1
                
            except Exception as e:
                # Failed - increment attempts and log error
                item.attempts += 1
                item.last_error = str(e)[:500]  # Truncate error
                
                # If max attempts reached, delete the queue entry (give up)
                if item.attempts >= max_attempts:
                    item.delete()
                    skipped_count += 1
                else:
                    item.save()
                    failed_count += 1
        
        # Get remaining queue size
        remaining = PendingFileDeletion.objects.count()
        
        return JsonResponse({
            'success': True,
            'processed': total_processed,
            'deleted': success_count,
            'failed': failed_count,
            'skipped': skipped_count,
            'remaining_in_queue': remaining,
            'message': f'Processed {total_processed} files: {success_count} deleted, {failed_count} failed, {skipped_count} skipped'
        }, status=200)
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': f'Cleanup failed: {str(e)}'
        }, status=500)


@csrf_exempt
@require_http_methods(["GET"])
def get_deletion_queue_stats(request):
    """
    Get statistics about the pending deletion queue.
    
    Returns: JSON with queue statistics
    """
    try:
        from django.db.models import Count, Min, Max
        
        total_pending = PendingFileDeletion.objects.count()
        
        if total_pending == 0:
            return JsonResponse({
                'success': True,
                'stats': {
                    'total_pending': 0,
                    'oldest_queued': None,
                    'newest_queued': None,
                    'by_attempts': []
                }
            }, status=200)
        
        # Aggregate by attempt count
        by_attempts = list(
            PendingFileDeletion.objects.values('attempts')
            .annotate(count=Count('id'))
            .order_by('attempts')
        )
        
        # Get oldest and newest
        oldest = PendingFileDeletion.objects.order_by('queued_at').first()
        newest = PendingFileDeletion.objects.order_by('-queued_at').first()
        
        return JsonResponse({
            'success': True,
            'stats': {
                'total_pending': total_pending,
                'oldest_queued': oldest.queued_at.isoformat() if oldest else None,
                'newest_queued': newest.queued_at.isoformat() if newest else None,
                'by_attempts': by_attempts
            }
        }, status=200)
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': f'Failed to get queue stats: {str(e)}'
        }, status=500)

