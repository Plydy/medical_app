from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone


class Appointment(models.Model):
    STATUS_SCHEDULED = "scheduled"
    STATUS_CANCELLED = "cancelled"
    STATUS_COMPLETED = "completed"

    STATUS_CHOICES = [
        (STATUS_SCHEDULED, "Scheduled"),
        (STATUS_CANCELLED, "Cancelled"),
        (STATUS_COMPLETED, "Completed"),
    ]

    patient = models.ForeignKey(
        "accounts.Patient",
        on_delete=models.CASCADE,
        related_name="appointments",
    )
    doctor = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name="doctor_appointments",
        help_text="Пока что doctor = User (обычно is_staff=True). Роли сделаем позже.",
    )
    scheduled_at = models.DateTimeField()
    reason = models.CharField(max_length=255, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_SCHEDULED)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-scheduled_at"]
        indexes = [
            models.Index(fields=["doctor", "scheduled_at"]),
            models.Index(fields=["patient", "scheduled_at"]),
        ]

    def clean(self):
        if self.scheduled_at and self.scheduled_at < timezone.now():
            raise ValueError("scheduled_at must be in the future")

    def __str__(self):
        return f"{self.patient_id} -> {self.doctor_id} @ {self.scheduled_at}"
