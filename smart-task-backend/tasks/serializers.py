from datetime import date

from rest_framework import serializers

from .models import Task


def suggest_priority(due_date: date | None) -> str:
    if due_date is None:
        return Task.Priority.MEDIUM

    delta_days = (due_date - date.today()).days

    if delta_days <= 1:
        return Task.Priority.HIGH
    if delta_days <= 3:
        return Task.Priority.MEDIUM
    return Task.Priority.LOW


class TaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = [
            "id",
            "title",
            "description",
            "due_date",
            "priority",
            "status",
            "is_important",
            "category",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate_title(self, value: str) -> str:
        value = (value or "").strip()
        if not value:
            raise serializers.ValidationError("Title is required.")
        return value

    def create(self, validated_data):
        request = self.context.get("request")
        if request is None or request.user.is_anonymous:
            raise serializers.ValidationError("Authentication required.")

        if not validated_data.get("priority"):
            validated_data["priority"] = suggest_priority(validated_data.get("due_date"))

        return Task.objects.create(user=request.user, **validated_data)

    def update(self, instance, validated_data):
        if "priority" not in validated_data and "due_date" in validated_data:
            validated_data["priority"] = suggest_priority(validated_data.get("due_date"))
        return super().update(instance, validated_data)
