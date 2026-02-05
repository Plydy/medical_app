from rest_framework import serializers
from .models import Patient, Profile
from django.db import transaction
from django.contrib.auth import get_user_model

User = get_user_model()

class PatientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Patient
        fields = ("id", "user")


class PatientMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = Patient
        fields = ("id",)


class MeSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()
    phone = serializers.SerializerMethodField()
    patient = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ("id", "username", "email", "first_name", "last_name", "role", "phone", "patient")

    def get_role(self, obj):
        profile = getattr(obj, "profile", None)
        return profile.role if profile else None

    def get_phone(self, obj):
        profile = getattr(obj, "profile", None)
        return profile.phone if profile else ""

    def get_patient(self, obj):
        patient = getattr(obj, "patient", None)
        if not patient:
            return None
        return PatientMiniSerializer(patient).data


User = get_user_model()

class RegisterSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True, min_length=6)
    email = serializers.EmailField(required=False, allow_blank=True)
    first_name = serializers.CharField(required=False, allow_blank=True)
    last_name = serializers.CharField(required=False, allow_blank=True)
    phone = serializers.CharField(required=False, allow_blank=True)

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Username already exists")
        return value

    @transaction.atomic
    def create(self, validated_data):
        password = validated_data.pop("password")
        phone = validated_data.pop("phone", "")

        user = User(**validated_data)
        user.set_password(password)
        user.save()

        # если модель Patient реально нужна
        Patient.objects.get_or_create(user=user)

        # профиль
        Profile.objects.update_or_create(
            user=user,
            defaults={
                "role": Profile.Role.PATIENT,
                "phone": phone,
            }
        )

        return user

