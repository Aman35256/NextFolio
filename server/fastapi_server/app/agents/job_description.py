import json
import logging
from typing import Dict, Any
from app.agents.base import BaseAgent
from app.model_router import model_router

logger = logging.getLogger("nextfolio.job_description")

class JobDescriptionAgent(BaseAgent):
    def __init__(self):
        super().__init__("JobDescriptionAgent", complexity="small")

    def plan(self, payload: Dict[str, Any]) -> str:
        return "Parsing job description text to extract role, company, responsibilities, technical skills, perks, growth, and ATS keywords."

    def reason(self, payload: Dict[str, Any]) -> str:
        return "Analyzing job text structure to map requirements, benefits, growth, and process into a standardized recruiter-ready schema."

    def execute_task(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        text = payload.get("jobDescription", "")
        role = payload.get("role", "")
        company = payload.get("company", "")
        location = payload.get("location", "")
        salary = payload.get("salary", "")
        job_type = payload.get("jobType", "")

        if not text.strip():
            return self.fallback_parse_job(text, role, company, location, salary, job_type)

        template = {
            "role": "Software Engineer (Backend)",
            "companyOverview": {
                "logo": "",
                "name": "Acme Corp",
                "industry": "Software",
                "size": "50-200",
                "website": "https://acme.com",
                "description": "Building next-generation SaaS platforms.",
                "mission": "To make software development effortless.",
                "culture": "Collaborative, remote-first, and growth-oriented."
            },
            "jobSummary": "Looking for a Software Engineer to optimize our backend systems and build new database APIs. You will collaborate with product teams to build scalable infrastructure.",
            "employmentDetails": {
                "employmentType": "Full-time",
                "experience": "3+ years",
                "workMode": "Remote",
                "location": "San Francisco, CA",
                "department": "Engineering",
                "reportingManager": "Engineering Director",
                "salary": "$120,000 - $150,000",
                "workingHours": "40 hours / week",
                "postingDate": "2026-07-02",
                "applicationDeadline": "2026-08-02"
            },
            "responsibilities": [
                "Develop and maintain secure, scalable REST APIs.",
                "Optimize database queries and system performance.",
                "Collaborate with frontend engineers to integrate user-facing elements."
            ],
            "requiredQualifications": {
                "education": "Bachelor's in Computer Science or equivalent experience",
                "experience": "3+ years of professional backend development experience",
                "mandatorySkills": ["Python", "FastAPI", "SQL"],
                "certifications": [],
                "licenses": [],
                "other": []
            },
            "technicalSkills": {
                "programmingLanguages": ["Python", "JavaScript"],
                "frameworks": ["FastAPI", "Django"],
                "libraries": [],
                "databases": ["PostgreSQL", "Redis"],
                "cloud": ["AWS"],
                "devOps": ["Docker", "GitHub Actions"],
                "operatingSystems": ["Linux"],
                "testing": ["pytest"],
                "tools": [],
                "versionControl": ["Git"],
                "aiMl": [],
                "security": [],
                "networking": [],
                "mobile": [],
                "otherTechnologies": []
            },
            "preferredQualifications": [
                "Experience working in startup environments.",
                "AWS Solutions Architect certification."
            ],
            "softSkills": ["Collaboration", "Problem Solving", "Communication", "Ownership"],
            "projects": [
                "Re-architecting database query pipelines",
                "Integrating third-party payment gateways"
            ],
            "techStack": {
                "backend": ["Python", "FastAPI"],
                "frontend": ["React"],
                "database": ["PostgreSQL"],
                "cloud": ["AWS"],
                "ai": [],
                "infrastructure": ["Docker"],
                "testing": ["pytest"],
                "monitoring": ["Datadog"],
                "deployment": ["Vercel"]
            },
            "benefits": [
                "Health Insurance",
                "Remote Work",
                "Paid Leave",
                "Stock Options"
            ],
            "careerGrowth": [
                "Mentorship programs",
                "Learning budget"
            ],
            "hiringProcess": [
                "Resume Screening",
                "Technical Assessment",
                "Technical Interview",
                "Offer"
            ],
            "atsKeywords": ["Python", "FastAPI", "SQL", "AWS", "REST API"],
            "applicationInstructions": {
                "resumeRequired": True,
                "portfolioRequired": False,
                "githubRequired": False,
                "linkedinRequired": True,
                "coverLetterRequired": False,
                "otherDocuments": [],
                "deadline": "2026-08-02",
                "applyLink": "https://acme.com/careers/apply"
            }
        }

        try:
            feedback = payload.get("__retry_feedback__", "")
            prompt = (
                f"Extract all details from this job description according to the schema. "
                f"If information is not explicitly present, use 'Not specified by the employer.' "
                f"or leave arrays empty, do NOT invent facts or URLs. {feedback}\n\nJob Description:\n{text}"
            )
            system = "You are a Job Description Agent. Extract structured JSON metadata from the job text."
            
            res = model_router.generate_structured(
                prompt=prompt,
                schema_template=template,
                system_prompt=system,
                temperature=0.1,
                complexity=self.complexity,
                task_name=self.name
            )
            
            if not res or not isinstance(res, dict) or not res.get("role"):
                raise ValueError("Incomplete or invalid JSON returned by model router")
            
            # Re-verify critical keys
            for key, val in template.items():
                if key not in res:
                    res[key] = val
                    
            return res
        except Exception as e:
            logger.error(f"AI parsing failed, falling back to local heuristic parser: {e}")
            return self.fallback_parse_job(text, role, company, location, salary, job_type)

    def validate(self, output: Dict[str, Any]) -> bool:
        if not output:
            return False
        return bool(output.get("role"))

    def fallback_parse_job(self, text: str, role_hint: str = "", company_hint: str = "", location_hint: str = "", salary_hint: str = "", job_type_hint: str = "") -> dict:
        import re
        import urllib.parse
        
        lines = [line.strip() for line in text.split('\n') if line.strip()]
        
        skills = []
        for word in ["Python", "JavaScript", "React", "Node.js", "Java", "C++", "TypeScript", "SQL", "AWS", "Docker", "Kubernetes", "Git", "Go", "Rust", "FastAPI", "Django", "HTML", "CSS"]:
            if re.search(r'\b' + re.escape(word) + r'\b', text, re.IGNORECASE):
                skills.append(word)
                
        benefits_list = []
        for ben in ["Health Insurance", "Remote Work", "Bonus", "Paid Leave", "Learning Budget", "Flexible Hours", "Stock Options", "Gym", "Wellness"]:
            if re.search(r'\b' + re.escape(ben) + r'\b', text, re.IGNORECASE):
                benefits_list.append(ben)
                
        soft_list = []
        for soft in ["Communication", "Leadership", "Problem Solving", "Critical Thinking", "Teamwork", "Ownership", "Adaptability", "Time Management", "Decision Making", "Collaboration"]:
            if re.search(r'\b' + re.escape(soft) + r'\b', text, re.IGNORECASE):
                soft_list.append(soft)

        role = role_hint or "Software Engineer"
        company = company_hint or "Employer"
        location = location_hint or "Remote"
        salary = salary_hint or "Not specified by the employer."
        job_type = job_type_hint or "Full-time"
        
        education = "Not specified by the employer."
        for degree in ["Bachelor", "Master", "PhD", "B.S.", "M.S.", "Degree"]:
            if degree.lower() in text.lower():
                education = f"Degree in Computer Science or related field"
                break

        resps = []
        for line in lines:
            if any(line.strip().startswith(char) for char in ['-', '*', '•']) or any(w in line.lower() for w in ['responsible for', 'responsibilities', 'key tasks']):
                clean_resp = line.lstrip('-*• ').strip()
                if len(clean_resp) > 10 and len(clean_resp) < 200 and len(resps) < 8:
                    resps.append(clean_resp)

        if not resps:
            resps = ["Execute software development tasks.", "Collaborate with engineering teams.", "Maintain clean, testable code base."]

        summary = f"We are looking for a dedicated {role} to join our team at {company}. "
        summary += f"This is a {job_type} role based in {location}. "
        if skills:
            summary += f"The ideal candidate will have experience in {', '.join(skills[:3])}."
        else:
            summary += "You will work on engineering, designing, and optimizing core product features."

        return {
            "role": role,
            "companyOverview": {
                "logo": "",
                "name": company,
                "industry": "Technology",
                "size": "Not specified by the employer.",
                "website": "Not specified by the employer.",
                "description": f"Innovative tech company hiring a {role}.",
                "mission": "Not specified by the employer.",
                "culture": "Collaborative and product-focused."
            },
            "jobSummary": summary,
            "employmentDetails": {
                "employmentType": job_type,
                "experience": "Not specified by the employer.",
                "workMode": "Remote" if "remote" in location.lower() or "remote" in text.lower() else "On-site",
                "location": location,
                "department": "Engineering",
                "reportingManager": "Engineering Lead",
                "salary": salary,
                "workingHours": "Full-time hours",
                "postingDate": "Not specified by the employer.",
                "applicationDeadline": "Not specified by the employer."
            },
            "responsibilities": resps,
            "requiredQualifications": {
                "education": education,
                "experience": "Relevant industry experience",
                "mandatorySkills": skills[:4] if skills else ["Software Development"],
                "certifications": [],
                "licenses": [],
                "other": []
            },
            "technicalSkills": {
                "programmingLanguages": [s for s in skills if s in ["Python", "JavaScript", "TypeScript", "Java", "C++", "Go", "Rust"]],
                "frameworks": [s for s in skills if s in ["React", "FastAPI", "Django", "Node.js"]],
                "libraries": [],
                "databases": ["SQL"] if "sql" in text.lower() else [],
                "cloud": ["AWS"] if "aws" in text.lower() else [],
                "devOps": ["Docker"] if "docker" in text.lower() else [],
                "operatingSystems": [],
                "testing": [],
                "tools": [],
                "versionControl": ["Git"] if "git" in text.lower() else [],
                "aiMl": [],
                "security": [],
                "networking": [],
                "mobile": [],
                "otherTechnologies": []
            },
            "preferredQualifications": [
                "Experience with modern software design patterns.",
                "Strong analytical skills."
            ],
            "softSkills": soft_list if soft_list else ["Problem Solving", "Collaboration"],
            "projects": [
                "Building robust and scalable web applications.",
                "Writing clean, testing-verified APIs."
            ],
            "techStack": {
                "backend": [s for s in skills if s in ["Python", "Node.js", "FastAPI", "Go", "Rust"]],
                "frontend": [s for s in skills if s in ["React", "HTML", "CSS", "TypeScript"]],
                "database": ["SQL"] if "sql" in text.lower() else [],
                "cloud": ["AWS"] if "aws" in text.lower() else [],
                "ai": [],
                "infrastructure": ["Docker"] if "docker" in text.lower() else [],
                "testing": [],
                "monitoring": [],
                "deployment": []
            },
            "benefits": benefits_list if benefits_list else ["Competitive Salary", "Flexible Working Hours"],
            "careerGrowth": [
                "Continuous learning resources.",
                "Technical advancement paths."
            ],
            "hiringProcess": [
                "Resume Screening",
                "Technical Interview",
                "Managerial Discussion",
                "Offer"
            ],
            "atsKeywords": skills if skills else ["Software Engineer", "Developer"],
            "applicationInstructions": {
                "resumeRequired": True,
                "portfolioRequired": False,
                "githubRequired": False,
                "linkedinRequired": False,
                "coverLetterRequired": False,
                "otherDocuments": [],
                "deadline": "Not specified by the employer.",
                "applyLink": "https://example.com/apply"
            }
        }

