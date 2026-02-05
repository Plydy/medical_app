from django.conf import settings
from django.db import models
from django.contrib.auth.models import User

class Profile(models.Model):
    class Role(models.TextChoices):
        PATIENT = "PATIENT", "Patient"
        DOCTOR = "DOCTOR", "Doctor"
        ADMIN = "ADMIN", "Admin"

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="profile"
    )
    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.PATIENT
    )
    phone = models.CharField(max_length=32, blank=True, default="")

    def __str__(self):
        return f"{self.user.username} ({self.role})"

class Patient(models.Model):
     user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="patient")

     def __str__(self):
        return f"Patient({self.user.username})"
