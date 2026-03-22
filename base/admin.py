from django.contrib import admin
from .models import (
    Grade,
    Subject,
    Chapter,
    Concept,
    Question,
    Student_progress,
    Studentprofile,
    Attempt,
    Material,
    Result,
)

# Register your models here.
admin.site.register(Grade)
admin.site.register(Subject)
admin.site.register(Chapter)
admin.site.register(Concept)
admin.site.register(Question)
admin.site.register(Student_progress)
admin.site.register(Studentprofile)
admin.site.register(Attempt)
admin.site.register(Material)
admin.site.register(Result)
