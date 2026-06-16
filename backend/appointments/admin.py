from django.contrib import admin
from .models import Appointment, Availability, BlockedDate


@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = ['name', 'email', 'date', 'time_slot', 'status', 'priority', 'created_at']
    list_filter = ['status', 'priority', 'date']
    search_fields = ['name', 'email', 'phone', 'purpose']
    ordering = ['-date', 'time_slot']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Availability)
class AvailabilityAdmin(admin.ModelAdmin):
    list_display = ['day_of_week', 'is_active', 'start_time', 'end_time',
                    'slot_duration', 'buffer_time', 'max_per_day']
    ordering = ['day_of_week']


@admin.register(BlockedDate)
class BlockedDateAdmin(admin.ModelAdmin):
    list_display = ['date', 'reason', 'created_at']
    ordering = ['date']
