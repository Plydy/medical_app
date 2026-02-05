from django.contrib.auth.models import User
from datetime import timedelta
from django.utils import timezone
from rest_framework import serializers
from .models import Appointment


class DoctorMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "username", "first_name", "last_name")


SLOT = timedelta(hours=1)

class AppointmentSerializer(serializers.ModelSerializer):
    doctor_id = serializers.IntegerField(write_only=True, required=True)

    class Meta:
        model = Appointment
        fields = ("id", "patient", "doctor", "doctor_id", "scheduled_at", "reason", "status", "created_at", "updated_at")
        read_only_fields = ("id", "patient", "doctor", "status", "created_at", "updated_at")

    def validate(self, attrs):
        scheduled_at = attrs.get("scheduled_at")
        doctor_id = attrs.get("doctor_id")

        if scheduled_at < timezone.now():
            raise serializers.ValidationError({"scheduled_at": "Нельзя записаться в прошлое."})

        exists_same = Appointment.objects.filter(
            doctor_id=doctor_id,
            scheduled_at=scheduled_at,
            status=Appointment.STATUS_SCHEDULED,
        ).exists()
        if exists_same:
            raise serializers.ValidationError({"scheduled_at": "Этот слот уже занят у врача."})

        day_start = scheduled_at.replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)

        existing_times = list(
            Appointment.objects.filter(
                doctor_id=doctor_id,
                scheduled_at__gte=day_start,
                scheduled_at__lt=day_end,
                status=Appointment.STATUS_SCHEDULED,
            ).values_list("scheduled_at", flat=True)
        )

        if not existing_times:
            return attrs

        allowed = any(
            (scheduled_at == t - SLOT) or (scheduled_at == t + SLOT)
            for t in existing_times
        )
        if not allowed:
            raise serializers.ValidationError({
                "scheduled_at": "Нужно выбирать слот рядом с существующей записью (±1 час), чтобы не было больших разрывов."
            })

        return attrs

    def create(self, validated_data):
        request = self.context["request"]
        doctor_id = validated_data.pop("doctor_id")

        # patient профиль должен существовать
        patient = getattr(request.user, "patient", None)
        if patient is None:
            raise serializers.ValidationError("Current user has no patient profile.")

        return Appointment.objects.create(
            patient=patient,
            doctor_id=doctor_id,
            **validated_data,
        )
