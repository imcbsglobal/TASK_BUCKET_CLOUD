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
    List all images from the database with their metadata.
    
    Returns: JSON with list of images including name, description, URL, etc.
    """
    try:
        # Get all images from database
        images = Image.objects.all()
        
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
            'count': len(image_list),
            'images': image_list
        }, status=200)
        
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
