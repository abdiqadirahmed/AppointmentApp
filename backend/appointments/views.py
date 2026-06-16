import random
import string
from datetime import date, time, datetime, timedelta
from django.conf import settings
from django.core.mail import send_mail
from django.db.models import Count, Q
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Appointment, Availability, BlockedDate
from .serializers import (
    AppointmentSerializer, PublicAppointmentSerializer,
    AppointmentStatusUpdateSerializer, AvailabilitySerializer, BlockedDateSerializer
)


# ─────────────────────────────────────────────
#  AUTH
# ─────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    from django.contrib.auth import authenticate
    username = request.data.get('username')
    password = request.data.get('password')
    user = authenticate(username=username, password=password)
    if not user:
        return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
    if not user.is_staff:
        return Response({'error': 'Admin access only'}, status=status.HTTP_403_FORBIDDEN)
    refresh = RefreshToken.for_user(user)
    return Response({
        'access': str(refresh.access_token),
        'refresh': str(refresh),
        'user': {'id': user.id, 'username': user.username, 'name': user.get_full_name() or user.username}
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    try:
        refresh_token = request.data.get('refresh')
        token = RefreshToken(refresh_token)
        token.blacklist()
    except Exception:
        pass
    return Response({'message': 'Logged out successfully'})


# ─────────────────────────────────────────────
#  CAPTCHA
# ─────────────────────────────────────────────

_captcha_store = {}  # In-memory store for dev; use Redis/cache in production

@api_view(['GET'])
@permission_classes([AllowAny])
def get_captcha(request):
    a = random.randint(1, 12)
    b = random.randint(1, 12)
    answer = a + b
    token = ''.join(random.choices(string.ascii_letters + string.digits, k=16))
    _captcha_store[token] = str(answer)
    return Response({'question': f"What is {a} + {b}?", 'token': token})


@api_view(['POST'])
@permission_classes([AllowAny])
def verify_captcha(request):
    token = request.data.get('token')
    answer = request.data.get('answer', '').strip()
    expected = _captcha_store.get(token)
    if not expected or answer != expected:
        return Response({'valid': False}, status=status.HTTP_400_BAD_REQUEST)
    del _captcha_store[token]
    return Response({'valid': True})


# ─────────────────────────────────────────────
#  SLOTS (Public)
# ─────────────────────────────────────────────

def generate_slots(avail, booked_times):
    """Generate available time slots for a given Availability config."""
    slots = []
    current = datetime.combine(date.today(), avail.start_time)
    end = datetime.combine(date.today(), avail.end_time)
    step = timedelta(minutes=avail.slot_duration + avail.buffer_time)

    while current + timedelta(minutes=avail.slot_duration) <= end:
        slot_time = current.time()

        # Skip lunch break
        if avail.lunch_start and avail.lunch_end:
            if avail.lunch_start <= slot_time < avail.lunch_end:
                current += timedelta(minutes=avail.slot_duration)
                continue

        is_available = slot_time not in booked_times
        slots.append({
            'time': slot_time.strftime('%H:%M'),
            'available': is_available,
            'label': current.strftime('%I:%M %p'),
        })
        current += step

    return slots


@api_view(['GET'])
@permission_classes([AllowAny])
def get_slots(request):
    date_str = request.query_params.get('date')
    if not date_str:
        return Response({'error': 'date parameter required (YYYY-MM-DD)'}, status=400)

    try:
        booking_date = date.fromisoformat(date_str)
    except ValueError:
        return Response({'error': 'Invalid date format'}, status=400)

    if booking_date < date.today():
        return Response({'slots': [], 'blocked': False, 'reason': 'Past date'})

    # Blocked date?
    blocked = BlockedDate.objects.filter(date=booking_date).first()
    if blocked:
        return Response({'slots': [], 'blocked': True, 'reason': blocked.reason or 'Unavailable'})

    # Day availability
    day_of_week = booking_date.weekday()
    try:
        avail = Availability.objects.get(day_of_week=day_of_week)
    except Availability.DoesNotExist:
        return Response({'slots': [], 'blocked': True, 'reason': 'Not configured'})

    if not avail.is_active:
        return Response({'slots': [], 'blocked': True, 'reason': 'Not a working day'})

    # Booked times
    booked = Appointment.objects.filter(
        date=booking_date, status__in=['pending', 'approved']
    ).values_list('time_slot', flat=True)
    booked_times = set(booked)

    slots = generate_slots(avail, booked_times)
    booked_count = len([s for s in slots if not s['available']])
    total = len(slots)

    return Response({
        'slots': slots,
        'blocked': False,
        'day_name': avail.get_day_of_week_display(),
        'working_hours': f"{avail.start_time.strftime('%I:%M %p')} – {avail.end_time.strftime('%I:%M %p')}",
        'max_per_day': avail.max_per_day,
        'booked_count': booked_count,
        'total_slots': total,
    })


# ─────────────────────────────────────────────
#  PUBLIC BOOKING
# ─────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([AllowAny])
def create_appointment(request):
    serializer = PublicAppointmentSerializer(data=request.data)
    if serializer.is_valid():
        appointment = serializer.save()
        # Send confirmation email (async-friendly)
        _send_confirmation_email(appointment)
        return Response({
            'message': 'Appointment request submitted successfully! You will receive a confirmation email shortly.',
            'id': appointment.id,
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


def _send_confirmation_email(appointment):
    try:
        print(f"DEBUG: Attempting to send email to {appointment.email}")
        politician = getattr(settings, 'POLITICIAN_NAME', 'The Office')
        send_mail(
            subject=f"Appointment Request Received — {appointment.date.strftime('%B %d, %Y')}",
            message=f"""Dear {appointment.name},

Your appointment request has been received and is pending review.

📅 Date: {appointment.date.strftime('%A, %B %d, %Y')}
🕐 Time: {appointment.time_slot.strftime('%I:%M %p')}
📋 Purpose: {appointment.purpose}
🔖 Status: Pending Approval

You will be notified once your appointment is confirmed.

Office of {politician}
""",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[appointment.email],
        )
        print(f"DEBUG: Email sent successfully to {appointment.email}")
        appointment.confirmation_sent = True
        appointment.save(update_fields=['confirmation_sent'])
    except Exception as e:
        print(f"ERROR sending confirmation email: {e}")


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_create_appointment(request):
    """Admin endpoint to manually book an appointment."""
    serializer = AppointmentSerializer(data=request.data)
    if serializer.is_valid():
        appointment = serializer.save()
        _send_confirmation_email(appointment)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ─────────────────────────────────────────────
#  ADMIN — APPOINTMENTS
# ─────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_appointments(request):
    qs = Appointment.objects.all()
    # Filters
    status_filter = request.query_params.get('status')
    date_filter = request.query_params.get('date')
    priority_filter = request.query_params.get('priority')
    search = request.query_params.get('search')

    if status_filter:
        qs = qs.filter(status=status_filter)
    if date_filter:
        qs = qs.filter(date=date_filter)
    if priority_filter:
        qs = qs.filter(priority=priority_filter)
    if search:
        qs = qs.filter(Q(name__icontains=search) | Q(email__icontains=search) | Q(purpose__icontains=search))

    serializer = AppointmentSerializer(qs, many=True)
    return Response({'results': serializer.data, 'count': qs.count()})


@api_view(['GET', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def appointment_detail(request, pk):
    try:
        appointment = Appointment.objects.get(pk=pk)
    except Appointment.DoesNotExist:
        return Response({'error': 'Not found'}, status=404)

    if request.method == 'GET':
        return Response(AppointmentSerializer(appointment).data)

    elif request.method == 'PATCH':
        serializer = AppointmentStatusUpdateSerializer(appointment, data=request.data, partial=True)
        if serializer.is_valid():
            updated = serializer.save()
            # Notify citizen of status change
            _send_status_email(updated)
            return Response(AppointmentSerializer(updated).data)
        return Response(serializer.errors, status=400)

    elif request.method == 'DELETE':
        appointment.delete()
        return Response({'message': 'Appointment deleted'}, status=204)


def _send_status_email(appointment):
    try:
        politician = getattr(settings, 'POLITICIAN_NAME', 'The Office')
        status_msgs = {
            'approved': f"✅ Your appointment on {appointment.date.strftime('%B %d, %Y')} at {appointment.time_slot.strftime('%I:%M %p')} has been APPROVED. Please arrive 10 minutes early.",
            'cancelled': f"❌ Your appointment on {appointment.date.strftime('%B %d, %Y')} has been CANCELLED. Please contact our office to reschedule.",
            'rescheduled': f"🔄 Your appointment has been RESCHEDULED to {appointment.rescheduled_date} at {appointment.rescheduled_time}.",
            'completed': f"✅ Thank you for your visit on {appointment.date.strftime('%B %d, %Y')}. Your appointment has been marked as completed.",
        }
        msg = status_msgs.get(appointment.status)
        if not msg:
            return
        send_mail(
            subject=f"Appointment Update — {appointment.get_status_display()}",
            message=f"Dear {appointment.name},\n\n{msg}\n\n{('Notes: ' + appointment.admin_notes) if appointment.admin_notes else ''}\n\nOffice of {politician}",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[appointment.email],
        )
    except Exception as e:
        print(f"ERROR sending status email: {e}")


# ─────────────────────────────────────────────
#  ADMIN — AVAILABILITY
# ─────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([AllowAny])
def list_availability(request):
    avail = Availability.objects.all()
    return Response(AvailabilitySerializer(avail, many=True).data)


@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def update_availability(request, day):
    avail, _ = Availability.objects.get_or_create(day_of_week=day)
    serializer = AvailabilitySerializer(avail, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=400)


# ─────────────────────────────────────────────
#  ADMIN — BLOCKED DATES
# ─────────────────────────────────────────────

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def blocked_dates_view(request):
    if request.method == 'GET':
        blocked = BlockedDate.objects.all()
        return Response(BlockedDateSerializer(blocked, many=True).data)
    serializer = BlockedDateSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=201)
    return Response(serializer.errors, status=400)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_blocked_date(request, pk):
    try:
        BlockedDate.objects.get(pk=pk).delete()
        return Response({'message': 'Unblocked'}, status=204)
    except BlockedDate.DoesNotExist:
        return Response({'error': 'Not found'}, status=404)


# ─────────────────────────────────────────────
#  ANALYTICS
# ─────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def analytics_view(request):
    from django.utils import timezone
    today = date.today()
    this_month_start = today.replace(day=1)

    total = Appointment.objects.count()
    pending = Appointment.objects.filter(status='pending').count()
    approved = Appointment.objects.filter(status='approved').count()
    cancelled = Appointment.objects.filter(status='cancelled').count()
    completed = Appointment.objects.filter(status='completed').count()
    today_count = Appointment.objects.filter(date=today).count()
    this_month = Appointment.objects.filter(date__gte=this_month_start).count()
    vip_count = Appointment.objects.filter(priority='vip').count()

    # Busiest days of week
    by_day = (Appointment.objects
              .values('date')
              .annotate(count=Count('id'))
              .order_by('-count')[:7])

    # Last 7 days trend
    trend = []
    for i in range(6, -1, -1):
        d = today - timedelta(days=i)
        count = Appointment.objects.filter(date=d).count()
        trend.append({'date': d.isoformat(), 'count': count, 'label': d.strftime('%a')})

    approval_rate = round((approved / total * 100), 1) if total > 0 else 0

    return Response({
        'total': total,
        'pending': pending,
        'approved': approved,
        'cancelled': cancelled,
        'completed': completed,
        'today': today_count,
        'this_month': this_month,
        'vip_count': vip_count,
        'approval_rate': approval_rate,
        'trend': trend,
        'busiest_days': list(by_day),
    })


# ─────────────────────────────────────────────
#  CALENDAR DATA
# ─────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def calendar_data(request):
    """Return appointment counts per date for a given month."""
    year = int(request.query_params.get('year', date.today().year))
    month = int(request.query_params.get('month', date.today().month))

    appointments = (Appointment.objects
                    .filter(date__year=year, date__month=month)
                    .values('date', 'status', 'priority', 'name', 'time_slot', 'id'))

    blocked = BlockedDate.objects.filter(date__year=year, date__month=month)
    availability = Availability.objects.filter(is_active=True).values_list('day_of_week', flat=True)

    return Response({
        'appointments': list(appointments),
        'blocked_dates': BlockedDateSerializer(blocked, many=True).data,
        'active_days': list(availability),
    })
