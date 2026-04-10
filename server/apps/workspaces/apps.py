from django.apps import AppConfig


class WorkspacesConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.workspaces"
    label = "apps_workspaces"

    def ready(self):
        import apps.workspaces.signals
