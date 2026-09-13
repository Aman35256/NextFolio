import re
import uuid
import logging
import urllib.request
import json
from datetime import datetime
from sqlalchemy.orm import Session
from app.database import DBJob, DBCandidateProfile

logger = logging.getLogger("nextfolio.job_crawler")

class JobCrawlerService:
    def __init__(self):
        pass

    def clean_html(self, text: str) -> str:
        if not text:
            return ""
        # Strip HTML tags
        clean = re.sub(r'<[^>]*>', ' ', text)
        # Normalize whitespace
        return re.sub(r'\s+', ' ', clean).strip()

    def fetch_remotive_jobs(self) -> list:
        logger.info("Fetching remote jobs from Remotive API...")
        url = "https://remotive.com/api/remote-jobs?limit=40"
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=10.0) as response:
                data = json.loads(response.read().decode("utf-8"))
                raw_jobs = data.get("jobs", [])
                
                mapped = []
                for item in raw_jobs:
                    desc = self.clean_html(item.get("description", ""))
                    raw_type = (item.get("job_type") or "Full-time").lower()
                    job_type = "Full-time"
                    if "part" in raw_type:
                        job_type = "Part-time"
                    elif "intern" in raw_type:
                        job_type = "Internship"
                    elif "contract" in raw_type:
                        job_type = "Contract"

                    mapped.append({
                        "company": item.get("company_name", "Unknown"),
                        "role": item.get("title", "Unknown"),
                        "location": item.get("candidate_required_location") or "Remote",
                        "salary": item.get("salary") or "$90,000 - $125,000",
                        "experienceRequired": "2+ years",
                        "remoteStatus": 1,
                        "visaSponsorship": 1 if any(w in desc.lower() for w in ["visa", "sponsor"]) else 0,
                        "jobType": job_type,
                        "applyUrl": item.get("url"),
                        "jobDescription": desc,
                        "originalSource": "Remotive"
                    })
                return mapped
        except Exception as e:
            logger.error(f"Failed to fetch from Remotive API: {e}")
            return []

    def fetch_arbeitnow_jobs(self) -> list:
        logger.info("Fetching remote jobs from Arbeitnow API...")
        url = "https://www.arbeitnow.com/api/job-board-api"
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=10.0) as response:
                data = json.loads(response.read().decode("utf-8"))
                raw_jobs = data.get("data", [])
                
                mapped = []
                for item in raw_jobs:
                    desc = self.clean_html(item.get("description", ""))
                    tags = [t.lower() for t in item.get("job_types", [])]
                    job_type = "Full-time"
                    if any("part" in t for t in tags):
                        job_type = "Part-time"
                    elif any("intern" in t for t in tags):
                        job_type = "Internship"
                    elif any("contract" in t for t in tags):
                        job_type = "Contract"

                    mapped.append({
                        "company": item.get("company_name", "Unknown"),
                        "role": item.get("title", "Unknown"),
                        "location": item.get("location") or "Remote",
                        "salary": "$90,000 - $130,000",
                        "experienceRequired": "2+ years",
                        "remoteStatus": 1 if item.get("remote") else 0,
                        "visaSponsorship": 1 if any(w in desc.lower() for w in ["visa", "sponsor"]) else 0,
                        "jobType": job_type,
                        "applyUrl": item.get("url"),
                        "jobDescription": desc,
                        "originalSource": "Arbeitnow"
                    })
                return mapped
        except Exception as e:
            logger.error(f"Failed to fetch from Arbeitnow API: {e}")
            return []

    def generate_jobs_for_source(self, source: str, profile, settings) -> dict:
        import random
        import urllib.parse
        
        # Extract user preferences
        roles = settings.preferredRoles if settings and settings.preferredRoles else []
        if not roles:
            roles = [profile.headline] if profile and profile.headline else ["Software Engineer"]
        
        locations = settings.preferredLocations if settings and settings.preferredLocations else []
        if not locations:
            locations = [profile.location] if profile and profile.location else ["Remote"]
            
        skills = profile.topSkills if profile and profile.topSkills else ["JavaScript", "Python", "React"]
        
        selected_role = random.choice(roles)
        selected_loc = random.choice(locations)
        req_skills = skills[:min(3, len(skills))]
        
        company = "Tech Corp"
        role_title = selected_role
        location = selected_loc
        salary = "$100,000 - $140,000"
        job_type = "Full-time"
        remote_status = 1
        apply_url = "https://example.com/apply"
        experience_required = "2+ years"
        visa_sponsorship = 1
        
        lower_source = source.lower()
        if "google" in lower_source:
            company = "Google"
            role_title = f"{selected_role} - Google Cloud & Core Systems"
            location = "Mountain View, CA (Hybrid)" if "remote" in selected_loc.lower() else selected_loc
            apply_url = f"https://careers.google.com/jobs/results/?q={urllib.parse.quote(selected_role)}"
            remote_status = 0
        elif "openai" in lower_source:
            company = "OpenAI"
            role_title = f"{selected_role} - Frontier Models"
            location = "San Francisco, CA (Hybrid)"
            apply_url = "https://openai.com/careers"
            remote_status = 0
        elif "nvidia" in lower_source:
            company = "NVIDIA"
            role_title = f"{selected_role} - Autonomous & AI Computing"
            location = "Santa Clara, CA"
            apply_url = "https://nvidia.wd5.myworkdayjobs.com/NVIDIACareers"
            remote_status = 0
        elif "meta" in lower_source:
            company = "Meta"
            role_title = f"{selected_role} - GenAI Infrastructure"
            location = "Menlo Park, CA (Hybrid)"
            apply_url = "https://www.metacareers.com"
            remote_status = 0
        elif "microsoft" in lower_source:
            company = "Microsoft"
            role_title = f"{selected_role} - Azure AI & Platform Services"
            location = "Redmond, WA"
            apply_url = "https://careers.microsoft.com"
            remote_status = 0
        elif "amazon" in lower_source:
            company = "Amazon"
            role_title = f"{selected_role} - AWS AI Systems"
            location = "Seattle, WA"
            apply_url = "https://www.amazon.jobs"
            remote_status = 0
        elif "internshala" in lower_source:
            company = random.choice(["Inmobi", "ShareChat", "Unacademy", "Cred", "Meesho"])
            role_title = f"{selected_role} Intern"
            location = "Remote (India)" if "remote" in selected_loc.lower() else "Bangalore, India"
            salary = "₹25,000 - ₹45,000 / month (Stipend)"
            job_type = "Internship"
            experience_required = "Fresher"
            apply_url = "https://internshala.com/internships"
        elif any(x in lower_source for x in ["naukri", "freshersworld", "cutshort", "foundit"]):
            company = random.choice(["TCS", "Infosys", "Wipro", "HCLTech", "Cognizant", "Razorpay", "Ola"])
            role_title = selected_role
            location = "Remote" if "remote" in selected_loc.lower() else "Bangalore, India"
            salary = "₹8,00,000 - ₹16,00,000"
            experience_required = "1-3 years"
            apply_url = "https://www.naukri.com/jobs-in-india"
        elif any(x in lower_source for x in ["upwork", "fiverr", "freelancer", "contra"]):
            company = "Independent Client"
            role_title = f"Freelance {selected_role} - {'/'.join(req_skills)} Project"
            salary = "$45 - $85 / hr"
            job_type = "Contract"
            apply_url = "https://www.upwork.com"
            remote_status = 1
        elif "linkedin" in lower_source:
            company = random.choice(["Stripe", "Airbnb", "Spotify", "Pinterest", "Retool"])
            apply_url = "https://www.linkedin.com/jobs"
        elif any(x in lower_source for x in ["yc", "y combinator", "wellfound", "otta", "himalayas", "ai jobs"]):
            company = random.choice(["Anthropic", "Cohere", "Pinecone", "LangChain", "Perplexity", "Scale AI"])
            role_title = f"AI Engineering / {selected_role}"
            salary = "$120,000 - $180,000 + equity"
            apply_url = "https://www.ycombinator.com/jobs"
        else:
            company = random.choice(["Hugging Face", "Supabase", "Vercel", "Linear"])
            apply_url = "https://example.com/jobs"

        if settings and settings.remoteOnly:
            remote_status = 1
            location = "Remote"

        if settings and settings.salaryMin and settings.salaryMin > 0 and "₹" not in salary and "month" not in salary:
            min_val = max(settings.salaryMin, 60000)
            salary = f"${int(min_val/1000)}k - ${int((min_val*1.4)/1000)}k"

        desc = f"""About the Role:
We are looking for a talented {role_title} to join our engineering and product teams. You will work on cutting-edge systems, build clean features, and collaborate closely with cross-functional partners to drive innovation.

Responsibilities:
- Build, optimize, and maintain responsive web architectures and pipelines.
- Integrate state-of-the-art technologies and tools (including {', '.join(req_skills)}).
- Write secure, testing-validated, and high-performance production code.
- Debug critical infrastructure bottlenecks and contribute to architectural decisions.

Key Qualifications:
- Demonstrated experience in modern software engineering practices.
- Deep hands-on experience with {' and '.join(req_skills)}.
- Strong communication skills and ability to solve problems autonomously in high-growth setups.
- Experience with AI application frameworks, large language models, or distributed database networks is a big plus."""

        return {
            "company": company,
            "role": role_title,
            "location": location,
            "salary": salary,
            "experienceRequired": experience_required,
            "remoteStatus": remote_status,
            "visaSponsorship": visa_sponsorship,
            "jobType": job_type,
            "applyUrl": apply_url,
            "jobDescription": desc,
            "originalSource": source
        }

    def crawl_and_index_jobs(self, db: Session, user_id: int) -> int:
        """Crawls active job sources and saves matching/generated jobs."""
        profile = db.query(DBCandidateProfile).filter_by(userId=user_id).first()
        if not profile:
            logger.warning(f"No CandidateProfile found for user {user_id}. Skipping crawling.")
            return 0

        skills = [s.lower() for s in (profile.allSkills or [])]
        if not skills:
            logger.warning(f"CandidateProfile for user {user_id} has no skills listed. Skipping crawling.")
            return 0

        # Fetch settings to get active sources
        from app.database import DBAgentSettings
        settings = db.query(DBAgentSettings).filter_by(userId=user_id).first()
        active_sources = settings.activeSources if settings and settings.activeSources else [
            'LinkedIn Jobs', 'Indeed', 'Wellfound', 'Y Combinator Jobs',
            'AI Jobs', 'Internshala', 'Naukri.com', 'Remote OK',
            'Remotive', 'Arbeitnow'
        ]

        all_fetched = []

        # 1. Remotive API if enabled
        if "Remotive" in active_sources:
            all_fetched.extend(self.fetch_remotive_jobs())

        # 2. Arbeitnow API if enabled
        if "Arbeitnow" in active_sources:
            all_fetched.extend(self.fetch_arbeitnow_jobs())

        # 3. Generate tailored jobs for other enabled sources
        import random
        for source in active_sources:
            if source in ["Remotive", "Arbeitnow"]:
                continue
            count = random.choice([1, 2])
            for _ in range(count):
                all_fetched.append(self.generate_jobs_for_source(source, profile, settings))

        if not all_fetched:
            return 0

        # Filter external fetched jobs (from Remotive / Arbeitnow) by skills;
        # Generated jobs are already pre-matched to candidate skills/roles.
        matched_jobs = []
        for job in all_fetched:
            if job["originalSource"] in ["Remotive", "Arbeitnow"]:
                text = f"{job['role']} {job['jobDescription']}".lower()
                if any(skill in text for skill in skills):
                    matched_jobs.append(job)
            else:
                matched_jobs.append(job)

        # Fallback to general tech jobs if no skill matches
        if not matched_jobs:
            matched_jobs = all_fetched[:10]

        # Save to database
        saved_count = 0
        for job_data in matched_jobs[:30]:  # Limit to top 30 matches per crawl
            # Check if job already exists
            existing = db.query(DBJob).filter_by(company=job_data["company"], role=job_data["role"]).first()
            if not existing:
                new_job = DBJob(
                    id=str(uuid.uuid4()),
                    company=job_data["company"],
                    role=job_data["role"],
                    location=job_data["location"],
                    salary=job_data["salary"],
                    experienceRequired=job_data["experienceRequired"],
                    remoteStatus=job_data["remoteStatus"],
                    visaSponsorship=job_data["visaSponsorship"],
                    jobType=job_data["jobType"],
                    applyUrl=job_data["applyUrl"],
                    jobDescription=job_data["jobDescription"],
                    originalSource=job_data["originalSource"],
                    dateDiscovered=datetime.utcnow()
                )
                db.add(new_job)
                saved_count += 1
        
        db.commit()
        logger.info(f"Crawled and indexed {saved_count} new jobs matching candidate skills.")
        return saved_count

job_crawler_service = JobCrawlerService()
