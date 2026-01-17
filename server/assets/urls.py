from django.urls import path
from . import views

urlpatterns = [
    path('upload/', views.upload_image, name='upload_image'),
    path('list/', views.list_images, name='list_images'),
    path('stats/', views.get_stats, name='get_stats'),
    path('update/<int:image_id>/', views.update_image, name='update_image'),
    path('delete/<int:image_id>/', views.delete_image, name='delete_image'),
    path('validate-client/', views.validate_client, name='validate_client'),
    
    # Bulk operations
    path('bulk-delete/', views.bulk_delete_images, name='bulk_delete_images'),
    path('clients/', views.list_clients, name='list_clients'),
    path('clients/<str:client_id>/delete-all/', views.bulk_delete_by_client, name='bulk_delete_by_client'),
    
    # Background cleanup endpoints
    path('cleanup/run/', views.cleanup_pending_deletions, name='cleanup_pending_deletions'),
    path('cleanup/stats/', views.get_deletion_queue_stats, name='get_deletion_queue_stats'),
]
