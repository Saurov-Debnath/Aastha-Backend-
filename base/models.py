from django.db import models
from django.contrib.auth.models import User
from django.dispatch import receiver
from django.db.models.signals import post_save

# Create your models here.
class Grade(models.Model):
    name=models.CharField(max_length=50)
    def __str__(self):
        return self.name
class Subject(models.Model):
    name=models.CharField(max_length=100)
    grade=models.ForeignKey(Grade,on_delete=models.CASCADE,related_name='subjects')
    def __str__(self):
        return f"{self.name}-{self.grade.name}" 

    
class Chapter(models.Model): 
    name=models.CharField(max_length=200)
      
    order=models.IntegerField(default=1)
    subject=models.ForeignKey(Subject,on_delete=models.CASCADE,related_name='chapter')
    def __str__(self):
        return self.name 
class Concept(models.Model):
    chapter=models.ForeignKey(Chapter,on_delete=models.CASCADE,related_name='concepts')
    title=models.CharField(max_length=100)
    vedio_url=models.URLField(blank=True, null=True)
    def __str__(self):
        return self.title
class Question(models.Model):
    LEVEL_CHOICE=[('L1','Easy'),('L2','MEDIUM'),('L3','HARD')]

    concept=models.ForeignKey(Concept,on_delete=models.CASCADE,related_name='questions')
    difficulty=models.CharField(max_length=2,choices=LEVEL_CHOICE)
    question=models.TextField()
    correct_ans=models.CharField(max_length=255)
    option1=models.CharField(max_length=255)
    option2=models.CharField(max_length=255)
    option3=models.CharField(max_length=255)
    option4=models.CharField(max_length=255)
    explanation=models.TextField(help_text='ভুল করলে এটি স্টুডেন্ট কে এটি দেখানো হবে ')
    #question=models.CharField(max_length=255)
    def __str__(self):
        return f"{self. difficulty}-{self.concept.title}"
class Student_progress(models.Model):
    user =models.ForeignKey(User,on_delete=models.CASCADE)
    concept=models.ForeignKey(Concept,on_delete=models.CASCADE)
    is_weak=models.BooleanField(default=False)
    score=models.IntegerField(default=0)
    last_attempted=models.DateTimeField(auto_now=True)     
    def __str__(self):
        return f"{self.user.username}-{self.concept.title}({self.score}%)"
class Studentprofile(models.Model):
    user=models.OneToOneField(User,on_delete=models.CASCADE)#one user one profile
    grade=models.ForeignKey(Grade,on_delete=models.SET_NULL,null=True,blank=True)#what class do he read
    phone_number=models.CharField(max_length=15,blank=True)
    school_name=models.CharField(max_length=100,blank=True)
    Bio=models.CharField(max_length=250,blank=True)
    def __str__(self):
        return f"{self.user.username}'s Profile" 
@receiver(post_save, sender=User)
def create_user_profile(sender,instance,created,**kwargs):
    if created:
        Studentprofile.objects.create(user=instance)
@receiver(post_save,sender=User)
def save_user_profile(sender,instance,**kwargs):
    # Ensure Studentprofile exists (handles legacy users)
    Studentprofile.objects.get_or_create(user=instance)
    instance.studentprofile.save()


class Attempt(models.Model):
    """
    Stores every answered question for personalization analytics.
    """

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="attempts")
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name="attempts")
    concept = models.ForeignKey(Concept, on_delete=models.CASCADE, related_name="attempts")
    # Denormalized subject for faster per-subject analytics
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name="attempts")
    difficulty = models.CharField(max_length=2, choices=Question.LEVEL_CHOICE)
    submitted_ans = models.CharField(max_length=255)
    is_correct = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at", "-id"]

    def __str__(self):
        return f"{self.user.username} • {self.subject.name} • {self.concept.title} • {self.difficulty}"


class Material(models.Model):
    TOPIC_CHOICES = [
        ("MECH", "Mechanics"),
        ("ELEC", "Electricity"),
        ("MAG", "Magnetism"),
        ("OPT", "Optics"),
        ("MOD", "Modern Physics"),
        ("THERM", "Thermodynamics"),
        ("WAVE", "Waves"),
        ("OTHER", "Other"),
    ]
    DIFFICULTY_CHOICES = [
        ("EASY", "Easy"),
        ("MEDIUM", "Medium"),
        ("HARD", "Hard"),
    ]

    title = models.CharField(max_length=200)
    # Optional link to a specific concept for targeted recommendations
    concept = models.ForeignKey(Concept, on_delete=models.SET_NULL, null=True, blank=True, related_name="materials")
    topic = models.CharField(max_length=20, choices=TOPIC_CHOICES)
    difficulty = models.CharField(max_length=10, choices=DIFFICULTY_CHOICES)
    year = models.PositiveIntegerField(blank=True, null=True)
    file = models.FileField(upload_to="materials/")
    uploaded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.title


class Result(models.Model):
    """
    Test results used by the performance tracker chart.
    """

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="results")
    test_name = models.CharField(max_length=200)
    subject = models.CharField(max_length=100, default="Physics")
    marks = models.FloatField()
    max_marks = models.FloatField(default=100)
    taken_on = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["taken_on", "id"]

    def __str__(self):
        return f"{self.user.username} - {self.test_name} ({self.marks}/{self.max_marks})"

