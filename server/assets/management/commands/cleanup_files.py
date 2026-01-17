"""
Management command to clean up pending file deletions.
Run this periodically via cron or task scheduler.

Usage:
    python manage.py cleanup_files
    python manage.py cleanup_files --batch-size 500
    python manage.py cleanup_files --max-attempts 5
"""
from django.core.management.base import BaseCommand
from django.core.files.storage import default_storage
from assets.models import PendingFileDeletion


class Command(BaseCommand):
    help = 'Process queued file deletions from storage'

    def add_arguments(self, parser):
        parser.add_argument(
            '--batch-size',
            type=int,
            default=100,
            help='Number of files to process (default: 100, max: 1000)'
        )
        parser.add_argument(
            '--max-attempts',
            type=int,
            default=3,
            help='Skip files that have failed this many times (default: 3)'
        )

    def handle(self, *args, **options):
        batch_size = min(options['batch_size'], 1000)
        max_attempts = options['max_attempts']

        self.stdout.write(f'Processing up to {batch_size} pending file deletions...')

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
                self.stdout.write(self.style.SUCCESS(f'✓ Deleted: {item.file_path}'))

            except Exception as e:
                # Failed - increment attempts and log error
                item.attempts += 1
                item.last_error = str(e)[:500]  # Truncate error

                # If max attempts reached, delete the queue entry (give up)
                if item.attempts >= max_attempts:
                    item.delete()
                    skipped_count += 1
                    self.stdout.write(self.style.WARNING(f'⚠ Skipped (max attempts): {item.file_path}'))
                else:
                    item.save()
                    failed_count += 1
                    self.stdout.write(self.style.ERROR(f'✗ Failed (attempt {item.attempts}): {item.file_path} - {str(e)[:100]}'))

        # Get remaining queue size
        remaining = PendingFileDeletion.objects.count()

        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS('=' * 60))
        self.stdout.write(f'Processed: {total_processed}')
        self.stdout.write(self.style.SUCCESS(f'Deleted: {success_count}'))
        self.stdout.write(self.style.WARNING(f'Failed: {failed_count}'))
        self.stdout.write(self.style.ERROR(f'Skipped: {skipped_count}'))
        self.stdout.write(f'Remaining in queue: {remaining}')
        self.stdout.write(self.style.SUCCESS('=' * 60))

        if remaining > 0:
            self.stdout.write(f'\n💡 Tip: Run again to process remaining {remaining} files')
