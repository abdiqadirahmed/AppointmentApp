from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    # Auth
    path('auth/login/', views.login_view, name='login'),
    path('auth/logout/', views.logout_view, name='logout'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # Captcha
    path('captcha/', views.get_captcha, name='get_captcha'),
    path('captcha/verify/', views.verify_captcha, name='verify_captcha'),

    # Public
    path('slots/', views.get_slots, name='get_slots'),
    path('appointments/', views.create_appointment, name='create_appointment'),

    # Admin — Appointments
    path('admin/appointments/', views.list_appointments, name='list_appointments'),
    path('admin/appointments/create/', views.admin_create_appointment, name='admin_create_appointment'),
    path('admin/appointments/<int:pk>/', views.appointment_detail, name='appointment_detail'),

    # Admin — Calendar
    path('admin/calendar/', views.calendar_data, name='calendar_data'),

    # Admin — Availability
    path('admin/availability/', views.list_availability, name='list_availability'),
    path('admin/availability/<int:day>/', views.update_availability, name='update_availability'),

    # Admin — Blocked Dates
    path('admin/blocked-dates/', views.blocked_dates_view, name='blocked_dates'),
    path('admin/blocked-dates/<int:pk>/', views.delete_blocked_date, name='delete_blocked_date'),

    # Analytics
    path('admin/analytics/', views.analytics_view, name='analytics'),
]
