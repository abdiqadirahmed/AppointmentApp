"""
APScheduler jobs for automated appointment reminders.
Run this with: python scheduler.py (or integrate into Django's AppConfig.ready())
"""
import os
import sys
import django

# Setup Django
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'appointmentapp.settings')
django.setup()

from datetime import date, datetime, timedelta
from apscheduler.schedulers.blocking import BlockingScheduler
from django.core.mail import send_mail
from django.conf import settings
from appointments.models import Appointment


scheduler = BlockingScheduler()


def send_reminder_emails():
    """Send 24-hour and 1-hour reminders for upcoming appointments."""
    now = datetime.now()
    politician = getattr(settings, 'POLITICIAN_NAME', 'The Office')

    # 24-hour reminders
    tomorrow = (now + timedelta(hours=24)).date()
    appointments_24h = Appointment.objects.filter(
        date=tomorrow,
        status='approved',
        reminder_24h_sent=False
    )
    for appt in appointments_24h:
        try:
            send_mail(
                subject=f"⏰ Reminder: Your appointment is TOMORROW — {appt.date.strftime('%B %d')}",
                message=f"""Dear {appt.name},

This is a friendly reminder that your appointment is scheduled for TOMORROW.

📅 Date: {appt.date.strftime('%A, %B %d, %Y')}
🕐 Time: {appt.time_slot.strftime('%I:%M %p')}
📋 Purpose: {appt.purpose}

Please arrive 10 minutes early. If you need to cancel or reschedule, contact our office as soon as possible.

Office of {politician}
""",
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[appt.email],
                fail_silently=True,
            )
            appt.reminder_24h_sent = True
            appt.save(update_fields=['reminder_24h_sent'])
            print(f"  ✓ 24h reminder sent to {appt.email}")
        except Exception as e:
            print(f"  ✗ Failed for {appt.email}: {e}")

    # 1-hour reminders
    one_hour_later = now + timedelta(hours=1)
    appointments_1h = Appointment.objects.filter(
        date=one_hour_later.date(),
        status='approved',
        reminder_1h_sent=False
    )
    for appt in appointments_1h:
        appt_dt = datetime.combine(appt.date, appt.time_slot)
        if abs((appt_dt - one_hour_later).total_seconds()) <= 1800:  # within 30-min window
            try:
                send_mail(
                    subject=f"⏰ Your appointment is in 1 HOUR — {appt.time_slot.strftime('%I:%M %p')}",
                    message=f"""Dear {appt.name},

Your appointment is in approximately 1 hour. Please prepare to head over.

🕐 Time: {appt.time_slot.strftime('%I:%M %p')}
📋 Purpose: {appt.purpose}

Office of {politician}
""",
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[appt.email],
                    fail_silently=True,
                )
                appt.reminder_1h_sent = True
                appt.save(update_fields=['reminder_1h_sent'])
                print(f"  ✓ 1h reminder sent to {appt.email}")
            except Exception as e:
                print(f"  ✗ Failed for {appt.email}: {e}")


@scheduler.scheduled_job('interval', minutes=30, id='reminder_job')
def reminder_job():
    print(f"[{datetime.now().strftime('%H:%M')}] Running reminder check...")
    send_reminder_emails()


if __name__ == '__main__':
    print("🗓  Appointment Reminder Scheduler started.")
    print("   Checking every 30 minutes for upcoming appointments...\n")
    scheduler.start()
