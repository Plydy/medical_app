from django.contrib.auth.models import User
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from accounts.models import Profile

from .models import Appointment
from .serializers import AppointmentSerializer, DoctorMiniSerializer
from .permissions import IsOwnerPatientOrDoctor


class DoctorListView(generics.ListAPIView):
    serializer_class = DoctorMiniSerializer

    def get_queryset(self):
        return (
            User.objects
            .filter(profile__role=Profile.Role.DOCTOR)
            .order_by("username")
        )


class AppointmentListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = AppointmentSerializer

    def get_queryset(self):
        user = self.request.user
        qs = Appointment.objects.all()

        if user.is_superuser:
            return qs

        if user.is_staff:
            return qs.filter(doctor=user)

        patient = getattr(user, "patient", None)
        if patient:
            return qs.filter(patient=patient)

        return Appointment.objects.none()

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["request"] = self.request
        return ctx


class AppointmentDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated, IsOwnerPatientOrDoctor]
    serializer_class = AppointmentSerializer
    queryset = Appointment.objects.all()

    def perform_update(self, serializer):
        # пациенту дадим менять только scheduled_at/reason (status отдельно сделаем позже)
        serializer.save()

    def perform_destroy(self, instance):
        # вместо удаления — мягкая отмена
        instance.status = Appointment.STATUS_CANCELLED
        instance.save()

from rest_framework.views import APIView
from rest_framework import status

class AppointmentCancelView(APIView):
    permission_classes = [IsAuthenticated, IsOwnerPatientOrDoctor]

    def patch(self, request, pk):
        appt = Appointment.objects.get(pk=pk)

        # проверка прав объектно
        self.check_object_permissions(request, appt)

        if appt.status != Appointment.STATUS_SCHEDULED:
            return Response({"detail": "Only scheduled appointments can be cancelled."}, status=status.HTTP_400_BAD_REQUEST)

        appt.status = Appointment.STATUS_CANCELLED
        appt.save(update_fields=["status", "updated_at"])
        return Response(AppointmentSerializer(appt, context={"request": request}).data)


class AppointmentCompleteView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        appt = Appointment.objects.get(pk=pk)

        # завершать может доктор (владелец) или админ
        if not (request.user.is_superuser or (request.user.is_staff and appt.doctor_id == request.user.id)):
            return Response({"detail": "Not allowed."}, status=status.HTTP_403_FORBIDDEN)

        if appt.status != Appointment.STATUS_SCHEDULED:
            return Response({"detail": "Only scheduled appointments can be completed."}, status=status.HTTP_400_BAD_REQUEST)

        appt.status = Appointment.STATUS_COMPLETED
        appt.save(update_fields=["status", "updated_at"])
        return Response(AppointmentSerializer(appt, context={"request": request}).data)
