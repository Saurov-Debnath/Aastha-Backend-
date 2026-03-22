
from django.db import models
import json
import urllib.request
import urllib.error
from rest_framework.decorators import api_view 
from .models import Grade, Subject, Chapter, Concept, Question, Student_progress, Attempt, Material, Result
from rest_framework.response import Response
from . serializer import (
    Gradeserializer,
    Subjectserializer,
    Chapterserializer,
    Conceptserializer,
    Questionserializer,
    User_Serializer,
    MaterialSerializer,
    ResultSerializer,
)
from rest_framework import status
from rest_framework.permissions import IsAuthenticated# New import for lock and key system
from rest_framework.decorators import permission_classes#New import for lock and key system
from rest_framework.permissions import IsAdminUser
from django.conf import settings
# Create your views here.
@api_view(['Get'])
def get_grades(request):
    grades=Grade.objects.all()
    serializer=Gradeserializer(grades,many=True)
    return Response(serializer.data)
@api_view(['Get'])
def get_sub_by_grade(request,grade_id):
    subjects=Subject.objects.filter(grade_id=grade_id)
    serializer=Subjectserializer(subjects,many=True)
    return Response(serializer.data)

@api_view(['Get'])
def get_question_by_chapter(request, concept_id):
    """
    Questions for a concept.
    Optional query params:
      - difficulty: L1 | L2 | L3
      - limit: integer (default 10)
      - random: 1 to randomize order (default 1)
    """
    qs = Question.objects.filter(concept_id=concept_id)
    difficulty = request.query_params.get("difficulty")
    if difficulty:
        qs = qs.filter(difficulty=difficulty)

    limit_raw = request.query_params.get("limit", "10")
    try:
        limit = max(1, min(int(limit_raw), 50))
    except (TypeError, ValueError):
        limit = 10

    randomize = request.query_params.get("random", "1")
    if randomize in ("1", "true", "True", "yes", "YES"):
        qs = qs.order_by("?")
    else:
        qs = qs.order_by("id")

    qs = qs[:limit]
    serializer = Questionserializer(qs, many=True)
    return Response(serializer.data)
@api_view(['Get'])
def get_chapter_by_subject(request,subject_id):
    chapters=Chapter.objects.filter(subject_id=subject_id)
    serializer=Chapterserializer(chapters,many=True) 
    return Response(serializer.data)
@api_view(['Get'])
def get_concept_by_chapter(request,chapter_id):
    concepts=Concept.objects.filter(chapter_id=chapter_id)
    serializer=Conceptserializer(concepts,many=True)
    return Response(serializer.data)


@api_view(["GET"])
def get_concept_detail(request, concept_id):
    try:
        obj = Concept.objects.get(id=concept_id)
    except Concept.DoesNotExist:
        return Response({"error": "Concept not found"}, status=404)
    return Response(Conceptserializer(obj).data)
@api_view(['POST'])
@permission_classes([IsAuthenticated])#it is that key
def submit_answer(request):
    user=request.user
    question_id=request.data.get('question_id')
    submitted_ans=request.data.get('answer')
    try:
        question=Question.objects.get(id=question_id)
        is_correct=(question.correct_ans==submitted_ans)
        # record attempt for personalization analytics
        Attempt.objects.create(
            user=user,
            question=question,
            concept=question.concept,
            subject=question.concept.chapter.subject,
            difficulty=question.difficulty,
            submitted_ans=submitted_ans or "",
            is_correct=is_correct,
        )
        #updated student progress
        progress,created=Student_progress.objects.get_or_create(user=user,concept=question.concept)
        # Mastery score: recent accuracy (last 20 attempts for this concept)
        recent = Attempt.objects.filter(user=user, concept=question.concept).order_by("-created_at")[:20]
        total = recent.count()
        correct = sum(1 for a in recent if a.is_correct)
        score = round((correct / total) * 100) if total else 0
        progress.score = int(score)
        # Weak if recent accuracy low and at least 5 attempts exist
        progress.is_weak = total >= 5 and score < 60
        progress.save()
        payload = {
            'correct': is_correct,
            'currect_score': progress.score,
            'is_weak': progress.is_weak,
            'user': user.username,
        }
        if not is_correct:
            payload["explanation"] = question.explanation
        return Response(payload)
    except Question.DoesNotExist:
        return Response({'error':'Question not found'}, status=404)
@api_view(['POST'])
def register_user(request):
    serializer=User_Serializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response({
            'message':'Congratulations Your Account Is Ready  ',
            'user':serializer.data
        },status=status.HTTP_201_CREATED)
    return Response(serializer.errors,status=status.HTTP_404_BAD_REQUEST)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def student_dashboard_summary(request):
    """
    Minimal dashboard summary for the React home page.
    """
    total = Student_progress.objects.filter(user=request.user).count()
    avg_score = (
        Student_progress.objects.filter(user=request.user).aggregate(models.Avg("score"))["score__avg"]
        or 0
    )
    weak = Student_progress.objects.filter(user=request.user, is_weak=True).count()
    recent_results = Result.objects.filter(user=request.user).order_by("-taken_on")[:5]
    return Response(
        {
            "progress": {
                "concepts_tracked": total,
                "average_score": round(float(avg_score), 2),
                "weak_concepts": weak,
            },
            "recent_results": ResultSerializer(recent_results, many=True).data,
        }
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def list_results(request):
    results = Result.objects.filter(user=request.user).order_by("taken_on", "id")
    return Response(ResultSerializer(results, many=True).data)


@api_view(["POST"])
@permission_classes([IsAdminUser])
def teacher_upsert_result(request):
    """
    Teacher-only: create/update a student's result.
    POST body: { user, test_name, subject, marks, max_marks, taken_on }
    """
    serializer = ResultSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def list_materials(request):
    qs = Material.objects.all()
    concept_id = request.query_params.get("concept_id")
    topic = request.query_params.get("topic")
    difficulty = request.query_params.get("difficulty")
    year = request.query_params.get("year")
    if concept_id:
        try:
            qs = qs.filter(concept_id=int(concept_id))
        except ValueError:
            pass
    if topic:
        qs = qs.filter(topic=topic)
    if difficulty:
        qs = qs.filter(difficulty=difficulty)
    if year:
        try:
            qs = qs.filter(year=int(year))
        except ValueError:
            pass

    serializer = MaterialSerializer(qs, many=True, context={"request": request})
    return Response(serializer.data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def recommendations_next(request):
    """
    Personalized recommendations (no external AI).

    Query params:
      - subject_id: optional, focus on one subject
      - concept_id: optional, return recommendations around one concept (after quiz)
    """
    user = request.user
    subject_id = request.query_params.get("subject_id")
    concept_id = request.query_params.get("concept_id")

    subj_qs = Subject.objects.all()
    if subject_id:
        try:
            subj_qs = subj_qs.filter(id=int(subject_id))
        except ValueError:
            pass

    def concept_payload(c: Concept):
        prog = Student_progress.objects.filter(user=user, concept=c).first()
        score = prog.score if prog else 0
        is_weak = prog.is_weak if prog else False
        notes = Material.objects.filter(concept=c).order_by("-created_at")[:3]
        return {
            "id": c.id,
            "title": c.title,
            "chapter_id": c.chapter_id,
            "subject_id": c.chapter.subject_id,
            "mastery_score": score,
            "is_weak": is_weak,
            "video_url": c.vedio_url,
            "pdf_notes": MaterialSerializer(notes, many=True, context={"request": request}).data,
        }

    subjects_out = []
    for s in subj_qs:
        # Weak concepts first (based on Student_progress)
        weak_qs = (
            Student_progress.objects.filter(user=user, is_weak=True, concept__chapter__subject=s)
            .select_related("concept", "concept__chapter")
            .order_by("score", "-last_attempted")[:5]
        )
        weak_concepts = [concept_payload(p.concept) for p in weak_qs]

        # Next best concept: lowest mastery among attempted concepts in this subject,
        # otherwise first concept in syllabus order.
        attempted = (
            Student_progress.objects.filter(user=user, concept__chapter__subject=s)
            .select_related("concept", "concept__chapter")
            .order_by("score", "-last_attempted")
            .first()
        )
        if attempted:
            next_concept = concept_payload(attempted.concept)
        else:
            first = (
                Concept.objects.filter(chapter__subject=s)
                .select_related("chapter")
                .order_by("chapter__order", "id")
                .first()
            )
            next_concept = concept_payload(first) if first else None

        subjects_out.append(
            {
                "id": s.id,
                "name": s.name,
                "weak_concepts": weak_concepts,
                "next_concept": next_concept,
            }
        )

    around_concept = None
    if concept_id:
        try:
            c = Concept.objects.get(id=int(concept_id))
            around_concept = concept_payload(c)
        except (ValueError, Concept.DoesNotExist):
            around_concept = None

    return Response(
        {
            "user": user.username,
            "around_concept": around_concept,
            "subjects": subjects_out,
        }
    )


def _normalize_ws(s: str) -> str:
    return " ".join((s or "").strip().split())

def _contains_bengali_script(s: str) -> bool:
    # Bengali Unicode block: U+0980–U+09FF
    return any("\u0980" <= ch <= "\u09ff" for ch in (s or ""))


def _validate_generated_question(q: dict) -> list[str]:
    errors: list[str] = []
    required = ["difficulty", "question", "options", "correct_index", "explanation"]
    for k in required:
        if k not in q:
            errors.append(f"Missing field: {k}")
    if errors:
        return errors

    difficulty = str(q.get("difficulty"))
    if difficulty not in ("L1", "L2", "L3"):
        errors.append("difficulty must be one of L1, L2, L3")

    question_text = _normalize_ws(str(q.get("question", "")))
    if len(question_text) < 8:
        errors.append("question too short")

    options = q.get("options")
    if not isinstance(options, list) or len(options) != 4:
        errors.append("options must be a list of 4 strings")
    else:
        norm_opts = [_normalize_ws(str(o)) for o in options]
        if any(len(o) < 1 for o in norm_opts):
            errors.append("options cannot be empty")
        if len(set(norm_opts)) != 4:
            errors.append("options must be distinct")

    try:
        ci = int(q.get("correct_index"))
    except Exception:
        errors.append("correct_index must be an integer 0..3")
        ci = -1
    if ci not in (0, 1, 2, 3):
        errors.append("correct_index must be 0..3")

    explanation = _normalize_ws(str(q.get("explanation", "")))
    if len(explanation) < 5:
        errors.append("explanation too short")

    return errors


def _call_gemini(prompt: str) -> tuple[bool, str]:
    """
    Calls Gemini generateContent API using API key in settings.
    Returns: (ok, text_or_error)
    """
    api_key = getattr(settings, "GEMINI_API_KEY", "") or ""
    if not api_key:
        return False, "Server missing GEMINI_API_KEY environment variable."

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={api_key}"
    body = {
        "contents": [
            {
                "role": "user",
                "parts": [{"text": prompt}],
            }
        ],
        "generationConfig": {
            "temperature": 0.4,
            "topP": 0.9,
            "maxOutputTokens": 4096,
        },
    }

    data = json.dumps(body).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            raw = resp.read().decode("utf-8", errors="replace")
    except urllib.error.HTTPError as e:
        try:
            err = e.read().decode("utf-8", errors="replace")
        except Exception:
            err = str(e)
        return False, f"Gemini HTTP {e.code}: {err[:800]}"
    except Exception as e:
        return False, f"Gemini request failed: {e!r}"

    try:
        parsed = json.loads(raw)
        # candidates[0].content.parts[0].text
        text = (
            parsed.get("candidates", [{}])[0]
            .get("content", {})
            .get("parts", [{}])[0]
            .get("text", "")
        )
        text = text if isinstance(text, str) else ""
        return True, text
    except Exception:
        return False, f"Unexpected Gemini response: {raw[:800]}"


@api_view(["POST"])
@permission_classes([IsAdminUser])
def teacher_generate_questions(request):
    """
    Teacher-only: generate concept-based MCQs using Gemini (drafts).
    Body:
      { concept_id, easy_count, medium_count, hard_count, language? }
    """
    concept_id = request.data.get("concept_id")
    try:
        concept = Concept.objects.select_related("chapter__subject", "chapter__subject__grade").get(
            id=int(concept_id)
        )
    except Exception:
        return Response({"error": "Invalid concept_id"}, status=400)

    def _int(name: str, default: int) -> int:
        raw = request.data.get(name, default)
        try:
            return max(0, min(int(raw), 50))
        except Exception:
            return default

    easy = _int("easy_count", 10)
    med = _int("medium_count", 10)
    hard = _int("hard_count", 10)
    language = request.data.get("language", "English")
    language = language if language in ("English", "Bangla") else "English"

    prompt = f"""
You are an expert exam question writer.
Generate multiple-choice questions (MCQ) for the following syllabus concept.

Grade: {concept.chapter.subject.grade.name}
Subject: {concept.chapter.subject.name}
Chapter: {concept.chapter.name}
Concept: {concept.title}

Constraints:
- Create exactly {easy} easy (L1), {med} medium (L2), {hard} hard (L3) questions.
- Language: {language}
- If Language is English: write ONLY in English. Do NOT use Bangla/Bengali script at all.
- Each question must have 4 options and exactly 1 correct option.
- Avoid trick questions; ensure clarity and syllabus alignment.
- Explanation should justify why the correct option is correct (1-3 sentences).

Output ONLY valid JSON in this exact shape:
{{
  "questions": [
    {{
      "difficulty": "L1|L2|L3",
      "question": "text",
      "options": ["A", "B", "C", "D"],
      "correct_index": 0,
      "explanation": "text"
    }}
  ]
}}
No markdown. No extra text.
""".strip()

    ok, text = _call_gemini(prompt)
    if not ok:
        return Response({"error": text}, status=502)

    try:
        payload = json.loads(text)
        items = payload.get("questions", [])
        if not isinstance(items, list):
            raise ValueError("questions is not a list")
    except Exception:
        # try to recover if model returned extra text around JSON
        start = text.find("{")
        end = text.rfind("}")
        if start != -1 and end != -1 and end > start:
            try:
                payload = json.loads(text[start : end + 1])
                items = payload.get("questions", [])
            except Exception:
                return Response({"error": "Gemini returned invalid JSON."}, status=502)
        else:
            return Response({"error": "Gemini returned invalid JSON."}, status=502)

    out = []
    errors = []
    for i, q in enumerate(items):
        if not isinstance(q, dict):
            errors.append({"index": i, "errors": ["question item must be an object"]})
            continue
        errs = _validate_generated_question(q)
        if errs:
            errors.append({"index": i, "errors": errs})
            continue
        opts = [_normalize_ws(str(o)) for o in q["options"]]
        ci = int(q["correct_index"])
        question_text = _normalize_ws(q["question"])
        explanation_text = _normalize_ws(q["explanation"])
        if language == "English":
            combined = " ".join([question_text, explanation_text, " ".join(opts)])
            if _contains_bengali_script(combined):
                errors.append(
                    {
                        "index": i,
                        "errors": [
                            "Output contains Bangla/Bengali script but language=English. Regenerate."
                        ],
                    }
                )
                continue
        out.append(
            {
                "difficulty": q["difficulty"],
                "question": question_text,
                "option1": opts[0],
                "option2": opts[1],
                "option3": opts[2],
                "option4": opts[3],
                "correct_ans": opts[ci],
                "explanation": explanation_text,
            }
        )

    # soft-check counts (do not fail hard; teacher can regenerate)
    def _count(d: str) -> int:
        return sum(1 for x in out if x["difficulty"] == d)

    meta = {
        "requested": {"L1": easy, "L2": med, "L3": hard},
        "generated": {"L1": _count("L1"), "L2": _count("L2"), "L3": _count("L3")},
    }

    return Response(
        {
            "concept": {
                "id": concept.id,
                "title": concept.title,
                "chapter": concept.chapter.name,
                "subject": concept.chapter.subject.name,
                "grade": concept.chapter.subject.grade.name,
            },
            "meta": meta,
            "questions": out,
            "validation_errors": errors,
            "raw": text,
        }
    )


@api_view(["POST"])
@permission_classes([IsAdminUser])
def teacher_bulk_create_questions(request):
    """
    Teacher-only: bulk insert questions for a concept.
    Body: { concept_id, questions: [ {difficulty, question, option1..4, correct_ans, explanation} ] }
    """
    concept_id = request.data.get("concept_id")
    try:
        concept = Concept.objects.get(id=int(concept_id))
    except Exception:
        return Response({"error": "Invalid concept_id"}, status=400)

    questions = request.data.get("questions", [])
    if not isinstance(questions, list) or len(questions) == 0:
        return Response({"error": "questions must be a non-empty list"}, status=400)

    created = []
    errors = []

    for i, q in enumerate(questions):
        if not isinstance(q, dict):
            errors.append({"index": i, "errors": ["item must be an object"]})
            continue
        difficulty = q.get("difficulty")
        if difficulty not in ("L1", "L2", "L3"):
            errors.append({"index": i, "errors": ["difficulty must be L1/L2/L3"]})
            continue
        option1 = _normalize_ws(str(q.get("option1", "")))
        option2 = _normalize_ws(str(q.get("option2", "")))
        option3 = _normalize_ws(str(q.get("option3", "")))
        option4 = _normalize_ws(str(q.get("option4", "")))
        opts = [option1, option2, option3, option4]
        if any(not o for o in opts) or len(set(opts)) != 4:
            errors.append({"index": i, "errors": ["options must be 4 distinct non-empty strings"]})
            continue
        correct_ans = _normalize_ws(str(q.get("correct_ans", "")))
        if correct_ans not in opts:
            errors.append({"index": i, "errors": ["correct_ans must match one of the options"]})
            continue

        question_text = _normalize_ws(str(q.get("question", "")))
        explanation = _normalize_ws(str(q.get("explanation", "")))
        if len(question_text) < 8:
            errors.append({"index": i, "errors": ["question too short"]})
            continue
        if len(explanation) < 5:
            errors.append({"index": i, "errors": ["explanation too short"]})
            continue

        obj = Question.objects.create(
            concept=concept,
            difficulty=difficulty,
            question=question_text,
            correct_ans=correct_ans,
            option1=option1,
            option2=option2,
            option3=option3,
            option4=option4,
            explanation=explanation,
        )
        created.append(obj.id)

    return Response({"created_ids": created, "created_count": len(created), "errors": errors})


@api_view(["POST"])
@permission_classes([IsAdminUser])
def teacher_upload_material(request):
    """
    Teacher-only: upload a material file (PDF/image).
    Form-data: title, topic, difficulty, year (optional), file
    """
    serializer = MaterialSerializer(data=request.data, context={"request": request})
    if serializer.is_valid():
        obj = serializer.save(uploaded_by=request.user)
        return Response(MaterialSerializer(obj, context={"request": request}).data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)




