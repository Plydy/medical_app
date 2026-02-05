from rest_framework.permissions import BasePermission


class IsOwnerPatientOrDoctor(BasePermission):
    """
    Patient видит только свои.
    Doctor (is_staff=True) видит только свои.
    Superuser видит всё.
    """

    def has_object_permission(self, request, view, obj):
        if request.user.is_superuser:
            return True

        # doctor
        if request.user.is_staff and obj.doctor_id == request.user.id:
            return True

        # patient
        patient = getattr(request.user, "patient", None)
        if patient and obj.patient_id == patient.id:
            return True

        return False
