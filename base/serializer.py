from rest_framework import serializers
from .models import Grade, Subject, Chapter, Concept, Question, Material, Result
from django.contrib.auth.models import User
class User_Serializer(serializers.ModelSerializer):
    password=serializers.CharField(write_only=True)
    class Meta:
        model=User
        fields=['username','email','password']
    def create(self,validated_data):
        user=User.objects.create_user(
            username=validated_data["username"],
            email=validated_data.get("email", ""),
            password=validated_data["password"],
        )
        return user
class Gradeserializer(serializers.ModelSerializer):
    class Meta:
        model=Grade
        fields='__all__'
class Subjectserializer(serializers.ModelSerializer):
    class Meta:
        model=Subject
        fields='__all__' 
class Chapterserializer(serializers.ModelSerializer):
    class Meta:
        model=Chapter
        fields='__all__'
class Conceptserializer(serializers.ModelSerializer):
    class Meta:
        model=Concept
        fields='__all__'               
class Questionserializer(serializers.ModelSerializer):
    class Meta:
        model=Question
        fields='__all__'#সব তথ্য (প্রশ্ন ,উত্তর ,অপশন ) দেখাবে                                                                                                                 


class MaterialSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = Material
        fields = ["id", "title", "concept", "topic", "difficulty", "year", "file", "file_url", "created_at"]
        read_only_fields = ["id", "file_url", "created_at"]

    def get_file_url(self, obj):
        request = self.context.get("request")
        if not obj.file:
            return None
        if request:
            return request.build_absolute_uri(obj.file.url)
        return obj.file.url


class ResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = Result
        fields = ["id", "user", "test_name", "subject", "marks", "max_marks", "taken_on"]
        read_only_fields = ["id"]

