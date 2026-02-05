from django.urls import path
from .views import (
    AppointmentListCreateView,
    AppointmentDetailView,
    DoctorListView,
    AppointmentCancelView,
    AppointmentCompleteView,
)

urlpatterns = [
    path("doctors/", DoctorListView.as_view()),

    path("appointments/", AppointmentListCreateView.as_view()),
    path("appointments/<int:pk>/", AppointmentDetailView.as_view()),

    path("appointments/<int:pk>/cancel/", AppointmentCancelView.as_view()),
    path("appointments/<int:pk>/complete/", AppointmentCompleteView.as_view()),
]
