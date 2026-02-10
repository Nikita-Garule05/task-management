from datetime import date, timedelta

from django.conf import settings
from django.core.mail import send_mail
from django.db.models import Count, Q
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Task
from .serializers import TaskSerializer


class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=["get"], url_path="all")
    def all(self, request):
        qs = self.get_queryset()
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def _send_high_priority_due_tomorrow_email(self, task: Task):
        if task.due_date is None:
            return

        if task.priority != Task.Priority.HIGH:
            return

        if task.status not in {Task.Status.PENDING, Task.Status.IN_PROGRESS}:
            return

        tomorrow = date.today() + timedelta(days=1)
        if task.due_date != tomorrow:
            return

        email = (getattr(task.user, "email", "") or "").strip()
        if not email:
            return

        send_mail(
            subject="[Smart Task] High Priority Task Due Tomorrow",
            message=(
                f"Hello {getattr(task.user, 'username', '')},\n\n"
                f"High priority reminder: this task is due tomorrow ({tomorrow.isoformat()}).\n"
                f"Recommended: complete it today.\n\n"
                f"- {task.title}\n\n"
                "Thanks,\nSmart Task Team"
            ),
            from_email=getattr(settings, "DEFAULT_FROM_EMAIL", None),
            recipient_list=[email],
            fail_silently=True,
        )

    def perform_create(self, serializer):
        task = serializer.save()
        self._send_high_priority_due_tomorrow_email(task)

    def perform_update(self, serializer):
        instance = self.get_object()
        prev_status = instance.status
        prev_due_date = instance.due_date
        prev_priority = instance.priority

        updated = serializer.save()

        next_due_date = updated.due_date
        next_priority = updated.priority
        if prev_due_date != next_due_date or prev_priority != next_priority or prev_status != updated.status:
            self._send_high_priority_due_tomorrow_email(updated)

        next_status = updated.status
        if prev_status != Task.Status.COMPLETED and next_status == Task.Status.COMPLETED:
            email = (getattr(updated.user, "email", "") or "").strip()
            if email:
                send_mail(
                    subject="[Smart Task] Task Completed",
                    message=f"Hello {getattr(updated.user, 'username', '')},\n\nYour task is completed:\n- {updated.title}\n\nThanks,\nSmart Task Team",
                    from_email=getattr(settings, "DEFAULT_FROM_EMAIL", None),
                    recipient_list=[email],
                    fail_silently=True,
                )

    def get_queryset(self):
        if self.request.user.is_staff or self.request.user.is_superuser:
            qs = Task.objects.all()
        else:
            qs = Task.objects.filter(user=self.request.user)

        status_param = self.request.query_params.get("status")
        if status_param:
            qs = qs.filter(status=status_param)

        priority_param = self.request.query_params.get("priority")
        if priority_param:
            qs = qs.filter(priority=priority_param)

        category_param = self.request.query_params.get("category")
        if category_param:
            qs = qs.filter(category__iexact=category_param)

        important_param = self.request.query_params.get("important")
        if important_param is not None:
            important_param = important_param.strip().lower()
            if important_param in {"1", "true", "yes"}:
                qs = qs.filter(is_important=True)
            elif important_param in {"0", "false", "no"}:
                qs = qs.filter(is_important=False)

        search = self.request.query_params.get("search")
        if search:
            qs = qs.filter(Q(title__icontains=search) | Q(description__icontains=search))

        ordering = self.request.query_params.get("ordering")
        allowed_ordering = {"due_date", "-due_date", "created_at", "-created_at"}
        if ordering in allowed_ordering:
            qs = qs.order_by(ordering)
        else:
            qs = qs.order_by("-is_important", "status", "due_date", "-created_at")

        return qs

    @action(detail=False, methods=["get"], url_path="reminders")
    def reminders(self, request):
        qs = Task.objects.filter(user=request.user)

        today = date.today()
        tomorrow = today + timedelta(days=1)

        active_statuses = [Task.Status.PENDING, Task.Status.IN_PROGRESS]

        overdue_qs = qs.filter(status__in=active_statuses, due_date__lt=today).order_by("due_date", "-is_important", "-created_at")
        due_tomorrow_qs = qs.filter(status__in=active_statuses, due_date=tomorrow).order_by("-is_important", "-created_at")

        return Response(
            {
                "date": {
                    "today": today.isoformat(),
                    "tomorrow": tomorrow.isoformat(),
                },
                "counts": {
                    "overdue": overdue_qs.count(),
                    "due_tomorrow": due_tomorrow_qs.count(),
                },
                "overdue": TaskSerializer(overdue_qs, many=True).data,
                "due_tomorrow": TaskSerializer(due_tomorrow_qs, many=True).data,
            },
            status=status.HTTP_200_OK,
        )

    @action(detail=False, methods=["get"], url_path="insights")
    def insights(self, request):
        qs = Task.objects.filter(user=request.user)

        total = qs.count()
        completed = qs.filter(status=Task.Status.COMPLETED).count()
        pending = qs.filter(status=Task.Status.PENDING).count()
        in_progress = qs.filter(status=Task.Status.IN_PROGRESS).count()

        progress_pct = 0
        if total:
            progress_pct = round((completed / total) * 100)

        today = date.today()
        tomorrow = today + timedelta(days=1)
        next_7 = today + timedelta(days=7)

        active_statuses = [Task.Status.PENDING, Task.Status.IN_PROGRESS]

        overdue = qs.filter(status__in=active_statuses, due_date__lt=today).count()
        due_tomorrow = qs.filter(status__in=active_statuses, due_date=tomorrow).count()
        due_soon = qs.filter(status__in=active_statuses, due_date__gte=today, due_date__lte=next_7).count()

        high_priority_active = qs.filter(status__in=active_statuses, priority=Task.Priority.HIGH).count()

        suggestions = []
        if overdue:
            suggestions.append(f"You have {overdue} overdue tasks. Complete them first.")
        if due_tomorrow:
            suggestions.append(f"Reminder: {due_tomorrow} tasks are due tomorrow.")
        if not overdue and high_priority_active:
            suggestions.append(f"Today's focus: {high_priority_active} high priority tasks.")
        if total and completed == total:
            suggestions.append("Great job! All tasks are completed.")

        return Response(
            {
                "counts": {
                    "total": total,
                    "completed": completed,
                    "pending": pending,
                    "in_progress": in_progress,
                },
                "progress_pct": progress_pct,
                "reminders": {
                    "overdue": overdue,
                    "due_tomorrow": due_tomorrow,
                    "due_soon_7_days": due_soon,
                },
                "suggestions": suggestions,
            },
            status=status.HTTP_200_OK,
        )

    @action(detail=False, methods=["get"], url_path="analytics")
    def analytics(self, request):
        qs = Task.objects.filter(user=request.user)

        by_status = dict(qs.values("status").annotate(count=Count("id")).values_list("status", "count"))
        by_priority = dict(qs.values("priority").annotate(count=Count("id")).values_list("priority", "count"))

        today = date.today()
        next_7 = today + timedelta(days=7)

        active_statuses = [Task.Status.PENDING, Task.Status.IN_PROGRESS]

        overdue_count = qs.filter(status__in=active_statuses, due_date__lt=today).count()
        due_soon_count = qs.filter(
            status__in=active_statuses,
            due_date__gte=today,
            due_date__lte=next_7,
        ).count()

        return Response(
            {
                "total": qs.count(),
                "by_status": {
                    Task.Status.PENDING: by_status.get(Task.Status.PENDING, 0),
                    Task.Status.IN_PROGRESS: by_status.get(Task.Status.IN_PROGRESS, 0),
                    Task.Status.COMPLETED: by_status.get(Task.Status.COMPLETED, 0),
                },
                "by_priority": {
                    Task.Priority.HIGH: by_priority.get(Task.Priority.HIGH, 0),
                    Task.Priority.MEDIUM: by_priority.get(Task.Priority.MEDIUM, 0),
                    Task.Priority.LOW: by_priority.get(Task.Priority.LOW, 0),
                },
                "overdue_pending": overdue_count,
                "due_soon_pending": due_soon_count,
            },
            status=status.HTTP_200_OK,
        )
