from datetime import date, timedelta

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.core.mail import send_mail

from tasks.models import Task


class Command(BaseCommand):
    help = "Send email reminders for tasks due tomorrow (and overdue tasks)."

    def add_arguments(self, parser):
        parser.add_argument(
            "--include-overdue",
            action="store_true",
            default=False,
            help="Include overdue tasks in the reminder email.",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            default=False,
            help="Do not send emails; just print what would be sent.",
        )

    def handle(self, *args, **options):
        include_overdue = bool(options.get("include_overdue"))
        dry_run = bool(options.get("dry_run"))

        today = date.today()
        tomorrow = today + timedelta(days=1)

        active_statuses = [Task.Status.PENDING, Task.Status.IN_PROGRESS]

        User = get_user_model()

        users = User.objects.all().only("id", "email", "username", "is_active")
        sent = 0
        skipped = 0

        for user in users:
            if not getattr(user, "is_active", True):
                skipped += 1
                continue

            email = (getattr(user, "email", "") or "").strip()
            if not email:
                skipped += 1
                continue

            due_today_qs = Task.objects.filter(
                user=user,
                status__in=active_statuses,
                due_date=today,
            ).order_by("-is_important", "-created_at")

            due_tomorrow_qs = Task.objects.filter(
                user=user,
                status__in=active_statuses,
                due_date=tomorrow,
            ).order_by("-is_important", "-created_at")

            overdue_qs = Task.objects.none()
            if include_overdue:
                overdue_qs = Task.objects.filter(
                    user=user,
                    status__in=active_statuses,
                    due_date__lt=today,
                ).order_by("due_date", "-is_important", "-created_at")

            if due_today_qs.count() == 0 and due_tomorrow_qs.count() == 0 and overdue_qs.count() == 0:
                skipped += 1
                continue

            lines = []
            lines.append(f"Hello {getattr(user, 'username', '')},")
            lines.append("")

            if due_today_qs.exists():
                lines.append(f"Due today ({today.isoformat()}): {due_today_qs.count()} task(s)")
                for t in due_today_qs:
                    lines.append(f"- {t.title} [priority: {t.priority}, status: {t.status}]")
                lines.append("")

            if due_tomorrow_qs.exists():
                lines.append(f"Reminder: You have {due_tomorrow_qs.count()} task(s) due tomorrow ({tomorrow.isoformat()}).")
                for t in due_tomorrow_qs:
                    if t.priority == Task.Priority.HIGH:
                        lines.append(f"- {t.title} [HIGH priority] (Recommended: complete today)")
                    else:
                        lines.append(f"- {t.title} [priority: {t.priority}, status: {t.status}]")
                lines.append("")

            if include_overdue and overdue_qs.exists():
                lines.append(f"Overdue: You have {overdue_qs.count()} overdue task(s).")
                for t in overdue_qs:
                    dd = t.due_date.isoformat() if t.due_date else "N/A"
                    lines.append(f"- {t.title} (due: {dd}) [priority: {t.priority}, status: {t.status}]")
                lines.append("")

            lines.append("Thanks,")
            lines.append("Smart Task Team")

            subject = "[Smart Task] Due Date Reminder"
            message = "\n".join(lines)

            if dry_run:
                self.stdout.write(self.style.WARNING(f"DRY RUN: would send to {email}\n{message}\n"))
                sent += 1
                continue

            send_mail(
                subject=subject,
                message=message,
                from_email=getattr(settings, "DEFAULT_FROM_EMAIL", None),
                recipient_list=[email],
                fail_silently=False,
            )
            sent += 1

        self.stdout.write(self.style.SUCCESS(f"Done. Sent: {sent}, Skipped: {skipped}"))
