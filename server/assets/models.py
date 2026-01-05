from django.db import models


class Image(models.Model):
    """
    Model to store uploaded image metadata.
    """
    filename = models.CharField(max_length=255, unique=True, help_text="Unique filename stored in R2")
    image = models.ImageField(upload_to="images/", help_text="Uploaded image file")
    original_filename = models.CharField(max_length=255, help_text="Original uploaded filename")
    client_id = models.CharField(max_length=100, help_text="Client identifier for the image")
     
    # Optional fields
    name = models.CharField(max_length=255, blank=True, null=True, help_text="Custom name for the image")
    description = models.TextField(blank=True, null=True, help_text="Description of the image")
    
    # Metadata
    size = models.IntegerField(help_text="File size in bytes")
    uploaded_at = models.DateTimeField(auto_now_add=True, help_text="Upload timestamp")
    download_count = models.IntegerField(default=0, help_text="Number of times the image has been downloaded")
    
    class Meta:
        ordering = ['-uploaded_at']
        verbose_name = "Image"
        verbose_name_plural = "Images"
        indexes = [
            # Index for client_id filtering (most common filter)
            models.Index(fields=['client_id'], name='idx_image_client_id'),
            # Index for date-based sorting and filtering
            models.Index(fields=['-uploaded_at'], name='idx_image_uploaded_desc'),
            models.Index(fields=['uploaded_at'], name='idx_image_uploaded_asc'),
            # Index for size sorting
            models.Index(fields=['size'], name='idx_image_size'),
            models.Index(fields=['-size'], name='idx_image_size_desc'),
            # Composite index for client + date (common query pattern)
            models.Index(fields=['client_id', '-uploaded_at'], name='idx_image_client_date'),
            # Index for filename lookups
            models.Index(fields=['filename'], name='idx_image_filename'),
        ]
    
    def __str__(self):
        return self.name if self.name else self.filename
