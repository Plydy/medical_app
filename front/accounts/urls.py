from django.urls import path
from .views import PatientListView, MeView, RegisterView
from .views import bootstrap_admin

urlpatterns = [
    path("patients/", PatientListView.as_view()),
    path("me/", MeView.as_view()),
    path("auth/register/", RegisterView.as_view()),
]
