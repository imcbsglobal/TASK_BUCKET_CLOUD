from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from .models import Image
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
        
        # Get optional name and description from POST data
        name = request.POST.get('name', None)
        description = request.POST.get('description', None)
        
        # Validate file type (basic check)
        allowed_extensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp']
        file_ext = os.path.splitext(image_file.name)[1].lower()
        
        if file_ext not in allowed_extensions:
            return JsonResponse({
                'success': False,
                'error': f'Invalid file type. Allowed: {", ".join(allowed_extensions)}'
            }, status=400)
        
        # Generate unique filename to avoid collisions
        unique_filename = f"{uuid.uuid4()}{file_ext}"
        
        # Save to Cloudflare R2 using default storage
        file_path = default_storage.save(unique_filename, ContentFile(image_file.read()))
        
        # Get the full URL
        file_url = default_storage.url(file_path)
        
        # Save metadata to database, store image file using ImageField
        image_obj = Image.objects.create(
            filename=unique_filename,
            image=image_file,
            original_filename=image_file.name,
            name=name,
            description=description,
            size=image_file.size
        )
        
        return JsonResponse({
            'success': True,
            'id': image_obj.id,
            'url': image_obj.image.url if image_obj.image else None,
            'filename': unique_filename,
            'original_filename': image_file.name,
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
