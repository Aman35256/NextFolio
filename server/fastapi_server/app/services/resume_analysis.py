import logging
from collections import Counter
from datetime import datetime

logger = logging.getLogger("nextfolio.resume_analysis")

SKILL_NORMALIZATIONS = {
    "js": "JavaScript",
    "ts": "TypeScript",
    "node": "Node.js",
    "react": "React",
    "vue": "Vue",
    "angular": "Angular",
    "python": "Python",
    "java": "Java",
    "c#": "C#",
    "c++": "C++",
    "sql": "SQL",
    "mysql": "MySQL",
    "postgres": "PostgreSQL",
    "mongodb": "MongoDB",
    "redis": "Redis",
    "docker": "Docker",
    "kubernetes": "Kubernetes",
    "aws": "AWS",
    "azure": "Azure",
    "gcp": "Google Cloud",
    "git": "Git",
    "linux": "Linux",
}

SKILL_MAPPINGS = {
    "frontend": ["React", "Vue", "Angular", "Svelte", "TypeScript", "JavaScript", "HTML", "CSS", "SCSS", "Tailwind", "Bootstrap", "Next.js", "Remix"],
    "backend": ["Node.js", "Express", "Django", "Flask", "FastAPI", "Spring Boot", "Java", "Python", "C#", "PHP", "Ruby", "Go", "Rust"],
    "database": ["MySQL", "PostgreSQL", "MongoDB", "Redis", "SQL", "Cassandra", "DynamoDB", "Firebase", "SQLite", "Oracle"],
    "devops": ["Docker", "Kubernetes", "CI/CD", "Jenkins", "GitHub Actions", "AWS", "Azure", "Google Cloud", "GCP", "Terraform", "Ansible", "Linux"],
    "mobile": ["React Native", "Flutter", "Swift", "Kotlin", "Objective-C", "Xamarin"],
    "tools": ["Git", "GitHub", "GitLab", "Jira", "Figma", "VSCode", "IntelliJ", "Postman", "Webpack", "Vite"],
    "soft": ["Leadership", "Communication", "Problem Solving", "Teamwork", "Mentoring", "Project Management", "Agile", "Scrum"],
    "languages": ["English", "Spanish", "French", "German", "Mandarin", "Japanese", "Hindi", "Arabic"]
}

POTENTIAL_JOB_SKILLS = [
    "react", "vue", "angular", "svelte", "typescript", "javascript",
    "node", "express", "django", "flask", "fastapi", "spring boot",
    "java", "python", "c#", "go", "rust", "mysql", "postgresql",
    "mongodb", "redis", "sql", "docker", "kubernetes", "aws",
    "azure", "gcp", "git", "linux", "rest api", "graphql"
]

def normalize_skill(skill: str) -> str:
    if not isinstance(skill, str):
        return ""
    stripped = skill.strip()
    return SKILL_NORMALIZATIONS.get(stripped.lower(), stripped)

def unique(items: list) -> list:
    seen = set()
    return [x for x in items if x and not (x in seen or seen.add(x))]

def normalize_resume_data(parsed: dict) -> dict:
    parsed = parsed or {}
    personal = parsed.get("personal") or {}
    return {
        "personal": {
            "fullName": personal.get("fullName") or "",
            "email": personal.get("email") or "",
            "phone": personal.get("phone") or "",
            "location": personal.get("location") or "",
            "summary": personal.get("summary") or "",
        },
        "experience": parsed.get("experience") if isinstance(parsed.get("experience"), list) else [],
        "education": parsed.get("education") if isinstance(parsed.get("education"), list) else [],
        "skills": [s for s in (parsed.get("skills") or []) if isinstance(s, str) and s.strip()],
        "certifications": parsed.get("certifications") if isinstance(parsed.get("certifications"), list) else [],
        "projects": parsed.get("projects") if isinstance(parsed.get("projects"), list) else [],
        "yearsOfExperience": parsed.get("yearsOfExperience") or 0,
    }

def calculate_years_of_experience(resume: dict) -> float:
    if resume.get("yearsOfExperience"):
        try:
            return float(resume["yearsOfExperience"])
        except (TypeError, ValueError):
            pass
    if resume.get("experience"):
        return max(len(resume["experience"]) * 0.5, 1.0)
    
    years = []
    for edu in resume.get("education", []):
        value = edu.get("year") or edu.get("graduationDate")
        try:
            years.append(int(str(value)[:4]))
        except (TypeError, ValueError):
            continue
    if years:
        return float(max(2026 - max(years), 0))
    return 0.0

def categorize_skills(skills: list) -> dict:
    categorized = {
        "technical": [],
        "frontend": [],
        "backend": [],
        "database": [],
        "devops": [],
        "mobile": [],
        "tools": [],
        "soft": [],
        "languages": [],
    }
    for skill in skills:
        normalized = normalize_skill(skill)
        lower = normalized.lower()
        matched = False
        for category, values in SKILL_MAPPINGS.items():
            if any(value.lower() == lower for value in values):
                if category in ("soft", "languages", "tools"):
                    categorized[category].append(normalized)
                else:
                    categorized["technical"].append(normalized)
                    categorized[category].append(normalized)
                matched = True
                break
        if not matched:
            categorized["technical"].append(normalized)
    return {key: unique(value) for key, value in categorized.items()}

def top_skills(skills: list, count: int = 8) -> list:
    normalized = [normalize_skill(skill) for skill in skills]
    return [skill for skill, _ in Counter(normalized).most_common(count)]

def calculate_ats_score(resume: dict) -> int:
    score = 0
    total = 110
    personal = resume.get("personal", {})
    if personal.get("fullName"):
        score += 5
    if personal.get("email"):
        score += 5
    if personal.get("phone"):
        score += 5
    if personal.get("location"):
        score += 5
    score += min(len(resume.get("experience", [])) * 8, 25)
    score += min(len(resume.get("education", [])) * 7.5, 15)
    
    skill_count = len(resume.get("skills", []))
    if skill_count >= 10:
        score += 20
    elif skill_count >= 6:
        score += 15
    elif skill_count >= 3:
        score += 10
    elif skill_count > 0:
        score += 5
        
    score += min(len(resume.get("certifications", [])) * 5, 10)
    if len(personal.get("summary", "")) > 50:
        score += 10
    score += min(len(resume.get("projects", [])) * 5, 10)
    return round((score / total) * 100)

def profile_strength(resume: dict) -> int:
    personal = resume.get("personal", {})
    checks = [
        bool(personal.get("fullName")),
        bool(personal.get("email")),
        bool(resume.get("experience")),
        bool(resume.get("education")),
        len(resume.get("skills", [])) >= 5,
        bool(resume.get("certifications")),
        bool(resume.get("projects")),
        len(personal.get("summary", "")) > 50,
    ]
    return round((sum(1 for check in checks if check) / len(checks)) * 100)

def skill_recommendations(resume: dict) -> list:
    skills = resume.get("skills", [])
    lower_skills = [skill.lower() for skill in skills]
    technical = ["Git", "REST API", "SQL", "Linux", "Docker", "CI/CD", "AWS", "Cloud"]
    soft = ["Communication", "Problem Solving", "Leadership", "Teamwork", "Project Management"]
    
    missing_tech = [skill for skill in technical if not any(skill.lower() in existing for existing in lower_skills)]
    missing_soft = [skill for skill in soft if not any(skill.lower() in existing for existing in lower_skills)]
    
    recommendations = []
    if missing_tech:
        recommendations.append({"category": "Technical Skills", "skills": missing_tech[:3], "priority": "high"})
    if missing_soft:
        recommendations.append({"category": "Soft Skills", "skills": missing_soft[:2], "priority": "medium"})
    return recommendations

def hunting_recommendations(skills: list) -> list:
    in_demand = [
        "TypeScript", "React", "Node.js", "Python", "AWS", "Docker", "Kubernetes",
        "PostgreSQL", "MongoDB", "SQL", "Git", "REST API", "GraphQL", "Next.js",
        "Vue", "Angular", "C#", "Java", "Spring Boot", "FastAPI", "Django"
    ]
    current = [normalize_skill(skill).lower() for skill in skills]
    missing = [skill for skill in in_demand if skill.lower() not in current]
    
    recommendations = [
        {"skill": skill, "reason": "High demand in current job market", "priority": "high"}
        for skill in missing[:3]
    ]
    if not any(any(word in skill.lower() for word in ["leadership", "communication", "teamwork"]) for skill in skills):
        recommendations.append({
            "skill": "Communication",
            "reason": "Essential soft skill for any role",
            "priority": "medium",
        })
    return recommendations

def resume_summary(resume: dict, ats_score: int) -> dict:
    strengths = []
    improvements = []
    if ats_score >= 80:
        strengths.append("Excellent ATS score")
    if len(resume.get("skills", [])) >= 8:
        strengths.append("Diverse skill set")
    if len(resume.get("experience", [])) >= 3:
        strengths.append("Strong work history")
    if resume.get("education"):
        strengths.append("Educational background")
    if len(resume.get("projects", [])) >= 2:
        strengths.append("Project portfolio")
        
    personal = resume.get("personal", {})
    if not personal.get("phone"):
        improvements.append("Add phone number")
    if not personal.get("summary"):
        improvements.append("Add professional summary")
    if len(resume.get("skills", [])) < 5:
        improvements.append("Add more technical skills")
    if not resume.get("certifications"):
        improvements.append("Add certifications or credentials")
    if len(resume.get("projects", [])) < 2:
        improvements.append("Showcase your projects")
        
    rating = "Excellent" if ats_score >= 80 else "Good" if ats_score >= 60 else "Fair" if ats_score >= 40 else "Needs Work"
    return {"strengths": strengths[:3], "improvements": improvements[:3], "overallRating": rating}

def resume_analyze(payload: dict) -> dict:
    resume = normalize_resume_data(payload.get("resumeData"))
    years = calculate_years_of_experience(resume)
    resume["yearsOfExperience"] = years
    categories = categorize_skills(resume["skills"])
    top = top_skills(resume["skills"], 8)
    ats = calculate_ats_score(resume)
    strength = profile_strength(resume)
    
    missing = [
        {"skill": skill, "category": rec["category"], "priority": rec["priority"]}
        for rec in skill_recommendations(resume)
        for skill in rec["skills"]
    ]
    summary = resume_summary(resume, ats)
    skill_hunting = hunting_recommendations(resume["skills"])
    headline = f"{top[0]} Professional with {years:g} years of experience" if top else "Job Seeker"
    
    profile_data = {
        "fullName": resume["personal"]["fullName"] or "Profile",
        "email": resume["personal"]["email"] or "",
        "phone": resume["personal"]["phone"] or "",
        "location": resume["personal"]["location"] or "",
        "headline": headline,
        "summary": resume["personal"]["summary"] or "",
        "atsScore": ats,
        "profileStrength": strength,
        "allSkills": resume["skills"],
        "topSkills": top,
        "skillCategories": categories,
        "experience": resume["experience"],
        "education": resume["education"],
        "certifications": resume["certifications"],
        "missingSkills": missing,
        "yearsOfExperience": years,
        "skillCount": len(resume["skills"]),
        "projectCount": len(resume["projects"]),
    }
    
    return {
        "profileData": profile_data,
        "profilePayload": {
            "fullName": profile_data["fullName"],
            "headline": profile_data["headline"],
            "location": profile_data["location"],
            "email": profile_data["email"],
            "phone": profile_data["phone"],
            "yearsOfExperience": years,
            "skills": resume["skills"],
            "topSkills": top,
            "skillCategories": categories,
            "experience": resume["experience"],
            "education": resume["education"],
            "certifications": resume["certifications"],
            "projects": resume["projects"],
        },
        "atsScore": ats,
        "missingSkills": missing[:5],
        "skillsGraph": categories,
        "resumeSummary": summary,
        "skillRecommendations": skill_hunting[:3],
        "profileStrength": strength,
        "metrics": {
            "atsScore": ats,
            "profileStrength": strength,
            "skillCount": len(resume["skills"]),
            "projectCount": len(resume["projects"]),
        },
        "recommendations": {
            "missing": missing[:5],
            "skillHunting": skill_hunting[:3],
            "summary": summary,
        },
    }
