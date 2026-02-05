from django.urls import path
from .views import PatientListView, MeView, RegisterView

urlpatterns = [
    path("patients/", PatientListView.as_view()),
    path("me/", MeView.as_view()),
    path("auth/register/", RegisterView.as_view()),
]
