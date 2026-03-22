"""
URL configuration for myproject project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path
from base import views
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import RedirectView
from rest_framework_simplejwt.views import(
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    path('', RedirectView.as_view(url='/api/grade/', permanent=False)),
    path('admin/', admin.site.urls),
    #নিচের দুটি লাইন যোগ হইয়েছে (jwt token এর জন্য )
    path('api/login/',TokenObtainPairView.as_view(),name='token_obtain_pair'),
    path('api/token/refresh/',TokenRefreshView.as_view(),name='token_refresh'),
    path('api/grade/',views.get_grades),#see all class
    path('api/subjects/<int:grade_id>/',views.get_sub_by_grade), #see sub by specipic class
    path('api/chapters/<int:subject_id>/',views.get_chapter_by_subject),#see all chapter
    path('api/questions/<int:concept_id>/',views.get_question_by_chapter), 
    path('api/concepts/<int:chapter_id>/',views.get_concept_by_chapter),
    path('api/concept/<int:concept_id>/', views.get_concept_detail),
    path('api/submit/',views.submit_answer),
    path('api/register/',views.register_user), 
    path('api/dashboard/summary/', views.student_dashboard_summary),
    path('api/recommendations/next/', views.recommendations_next),
    path('api/results/', views.list_results),
    path('api/teacher/results/', views.teacher_upsert_result),
    path('api/materials/', views.list_materials),
    path('api/teacher/materials/', views.teacher_upload_material),
    path('api/teacher/questions/generate/', views.teacher_generate_questions),
    path('api/teacher/questions/bulk_create/', views.teacher_bulk_create_questions),
    
    

]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
