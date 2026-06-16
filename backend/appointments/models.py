from django.db import models
from django.contrib.auth.models import User


class Availability(models.Model):
    """Weekly availability schedule per day of week."""
    DAY_CHOICES = [
        (0, 'Monday'), (1, 'Tuesday'), (2, 'Wednesday'),
        (3, 'Thursday'), (4, 'Friday'), (5, 'Saturday'), (6, 'Sunday'),
    ]
    day_of_week = models.IntegerField(choices=DAY_CHOICES, unique=True)
    is_active = models.BooleanField(default=True)
    start_time = models.TimeField(default='08:00')
    end_time = models.TimeField(default='17:00')
    slot_duration = models.IntegerField(default=30, help_text="Minutes per appointment slot")
    buffer_time = models.IntegerField(default=10, help_text="Buffer minutes between slots")
    max_per_day = models.IntegerField(default=10, help_text="Maximum appointments per day")
    lunch_start = models.TimeField(null=True, blank=True, help_text="Lunch break start (optional)")
    lunch_end = models.TimeField(null=True, blank=True, help_text="Lunch break end (optional)")

    class Meta:
        ordering = ['day_of_week']

    def __str__(self):
        return f"{self.get_day_of_week_display()} — {'Active' if self.is_active else 'Inactive'}"


class BlockedDate(models.Model):
    """Dates blocked by admin (travel, events, holidays)."""
    date = models.DateField(unique=True)
    reason = models.CharField(max_length=255, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['date']

    def __str__(self):
        return f"Blocked: {self.date} — {self.reason}"


class Appointment(models.Model):
    """A citizen appointment request."""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('cancelled', 'Cancelled'),
        ('rescheduled', 'Rescheduled'),
        ('completed', 'Completed'),
    ]
    PRIORITY_CHOICES = [
        ('normal', 'Normal'),
        ('vip', 'VIP / Priority'),
    ]

    # Citizen info
    name = models.CharField(max_length=200)
    phone = models.CharField(max_length=30)
    email = models.EmailField()
    purpose = models.TextField(help_text="Purpose / agenda of the meeting")
    organization = models.CharField(max_length=200, blank=True, default='')

    # Scheduling
    date = models.DateField()
    time_slot = models.TimeField()
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='normal')
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='pending')

    # Admin notes
    admin_notes = models.TextField(blank=True, default='')
    rescheduled_date = models.DateField(null=True, blank=True)
    rescheduled_time = models.TimeField(null=True, blank=True)

    # Notifications
    confirmation_sent = models.BooleanField(default=False)
    reminder_24h_sent = models.BooleanField(default=False)
    reminder_1h_sent = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date', 'time_slot']

    def __str__(self):
        return f"{self.name} — {self.date} {self.time_slot} [{self.status}]"
