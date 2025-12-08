from django.urls import path
from . import views

urlpatterns = [
    path('upload/', views.upload_image, name='upload_image'),
    path('list/', views.list_images, name='list_images'),
    path('update/<int:image_id>/', views.update_image, name='update_image'),
    path('delete/<int:image_id>/', views.delete_image, name='delete_image'),
]
