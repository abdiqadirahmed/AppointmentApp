from rest_framework import serializers
from .models import Appointment, Availability, BlockedDate


class AvailabilitySerializer(serializers.ModelSerializer):
    day_name = serializers.CharField(source='get_day_of_week_display', read_only=True)

    class Meta:
        model = Availability
        fields = '__all__'


class BlockedDateSerializer(serializers.ModelSerializer):
    class Meta:
        model = BlockedDate
        fields = '__all__'


class AppointmentSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)

    class Meta:
        model = Appointment
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'confirmation_sent',
                            'reminder_24h_sent', 'reminder_1h_sent']

    def validate(self, data):
        date = data.get('date')
        time_slot = data.get('time_slot')

        if date and time_slot:
            # Check if this slot is already taken by another appointment (not cancelled)
            exists = Appointment.objects.filter(
                date=date,
                time_slot=time_slot
            ).exclude(status='cancelled').exists()

            if exists:
                raise serializers.ValidationError(
                    "This booking date and time is not available. Please choose another date and time."
                )
        return data


class PublicAppointmentSerializer(serializers.ModelSerializer):
    """Serializer for public booking — limited fields only."""

    class Meta:
        model = Appointment
        fields = ['name', 'phone', 'email', 'purpose', 'organization',
                  'date', 'time_slot', 'priority']

    def validate(self, data):
        from datetime import date as date_cls, datetime
        from .models import BlockedDate, Availability

        booking_date = data['date']
        time_slot = data['time_slot']

        # Must not be in the past
        if booking_date < date_cls.today():
            raise serializers.ValidationError("Cannot book appointments in the past.")

        # Check blocked date
        if BlockedDate.objects.filter(date=booking_date).exists():
            raise serializers.ValidationError("This date is not available for bookings.")

        # Check day availability
        day_of_week = booking_date.weekday()  # Monday=0, Sunday=6
        try:
            avail = Availability.objects.get(day_of_week=day_of_week)
        except Availability.DoesNotExist:
            raise serializers.ValidationError("No availability configured for this day.")

        if not avail.is_active:
            raise serializers.ValidationError("This day of the week is not available.")

        # Check max per day
        existing_count = Appointment.objects.filter(
            date=booking_date,
            status__in=['pending', 'approved']
        ).count()
        if existing_count >= avail.max_per_day:
            raise serializers.ValidationError("This day is fully booked. Please choose another date.")

        # Check slot not already taken
        if Appointment.objects.filter(date=booking_date, time_slot=time_slot,
                                      status__in=['pending', 'approved']).exists():
            raise serializers.ValidationError("This booking date and time is not available. Please choose another date and time.")

        return data


class AppointmentStatusUpdateSerializer(serializers.ModelSerializer):
    """Admin-only serializer for updating appointment status."""

    class Meta:
        model = Appointment
        fields = ['status', 'admin_notes', 'rescheduled_date', 'rescheduled_time']
