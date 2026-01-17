from django.contrib import admin
from .models import Image, PendingFileDeletion


@admin.register(Image)
class ImageAdmin(admin.ModelAdmin):
    list_display = ('id', 'filename', 'client_id', 'name', 'size', 'uploaded_at')
    list_filter = ('client_id', 'uploaded_at')
    search_fields = ('filename', 'original_filename', 'name', 'client_id', 'description')
    readonly_fields = ('uploaded_at',)


@admin.register(PendingFileDeletion)
class PendingFileDeletionAdmin(admin.ModelAdmin):
    list_display = ('id', 'file_path', 'client_id', 'queued_at', 'attempts', 'last_error_short')
    list_filter = ('attempts', 'queued_at')
    search_fields = ('file_path', 'client_id')
    readonly_fields = ('queued_at',)
    
    def last_error_short(self, obj):
        """Show truncated error message"""
        if obj.last_error:
            return obj.last_error[:100] + ('...' if len(obj.last_error) > 100 else '')
        return '-'
    last_error_short.short_description = 'Last Error'
