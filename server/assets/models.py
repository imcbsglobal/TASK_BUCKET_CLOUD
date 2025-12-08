from django.db import models


class Image(models.Model):
    """
    Model to store uploaded image metadata.
    """
    filename = models.CharField(max_length=255, unique=True, help_text="Unique filename stored in R2")
    image = models.ImageField(upload_to="images/", help_text="Uploaded image file")
    original_filename = models.CharField(max_length=255, help_text="Original uploaded filename")
    
    # Optional fields
    name = models.CharField(max_length=255, blank=True, null=True, help_text="Custom name for the image")
    description = models.TextField(blank=True, null=True, help_text="Description of the image")
    
    # Metadata
    size = models.IntegerField(help_text="File size in bytes")
    uploaded_at = models.DateTimeField(auto_now_add=True, help_text="Upload timestamp")
    
    class Meta:
        ordering = ['-uploaded_at']
        verbose_name = "Image"
        verbose_name_plural = "Images"
    
    def __str__(self):
        return self.name if self.name else self.filename
