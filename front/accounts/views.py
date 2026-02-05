import os

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from django.views.decorators.csrf import csrf_exempt

from django.contrib.auth import get_user_model

from .models import Patient
from .serializers import PatientSerializer, MeSerializer, RegisterSerializer


class PatientListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        patients = Patient.objects.all()
        serializer = PatientSerializer(patients, many=True)
        return Response(serializer.data)


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(MeSerializer(request.user).data)


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        refresh = RefreshToken.for_user(user)

        return Response(
            {
                "user": MeSerializer(user).data,
                "access": str(refresh.access_token),
                "refresh": str(refresh),
            },
            status=status.HTTP_201_CREATED
        )
@csrf_exempt
@api_view(["POST"])
@authentication_classes([])
@permission_classes([AllowAny])
def bootstrap_admin(request):
    token = request.headers.get("X-BOOTSTRAP-TOKEN")
    expected = os.environ.get("ADMIN_BOOTSTRAP_TOKEN")
    if not expected or token != expected:
        return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

    User = get_user_model()

    username = os.environ.get("BOOTSTRAP_ADMIN_USERNAME", "admin")
    email = os.environ.get("BOOTSTRAP_ADMIN_EMAIL", "admin@clinic.com")
    password = os.environ.get("BOOTSTRAP_ADMIN_PASSWORD", "Admin123!")

    # если уже есть admin — просто говорим ок
    u = User.objects.filter(username=username).first()
    if u:
        u.is_staff = True
        u.is_superuser = True
        u.set_password(password)
        u.save()
        return Response({"detail": "Admin fixed/updated", "username": username}, status=200)

    u = User.objects.create_user(username=username, email=email, password=password)
    u.is_staff = True
    u.is_superuser = True
    u.save()
    return Response({"detail": "Admin created", "username": username}, status=201)