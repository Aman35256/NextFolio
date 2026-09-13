import asyncio
import logging
import uuid
from datetime import datetime
from sqlalchemy.orm import Session
from app.database import SessionLocal, DBJob, DBJobMatch, DBCandidateProfile
from app.services.job_crawler import job_crawler_service
from app.agents.ats_analysis import ATSAnalysisAgent
from app.agents.resume_improvement import ResumeImprovementAgent
from app.agents.career_recommendation import CareerRecommendationAgent

logger = logging.getLogger("nextfolio.scheduler")

class BackgroundScheduler:
    def __init__(self):
        self.is_running = False
        self.ats_agent = ATSAnalysisAgent()
        self.improvement_agent = ResumeImprovementAgent()
        self.career_agent = CareerRecommendationAgent()

    def start(self):
        if self.is_running:
            return
        self.is_running = True
        logger.info("Starting NextFolio Career Agent Background Scheduler...")
        # Start background loops
        asyncio.create_task(self._job_discovery_loop())
        asyncio.create_task(self._job_matching_loop())
        asyncio.create_task(self._resume_analysis_loop())
        asyncio.create_task(self._career_insights_loop())

    def stop(self):
        self.is_running = False
        logger.info("Stopped NextFolio Career Agent Background Scheduler.")

    # --- Background Loops ---

    async def _job_discovery_loop(self):
        """Runs every 10 minutes to discover new remote jobs."""
        while self.is_running:
            logger.info("[Scheduler] Triggering periodic Job Discovery (10m)...")
            db = SessionLocal()
            try:
                # Discover jobs for default user (id=1, or scan all active users in production)
                job_crawler_service.crawl_and_index_jobs(db, user_id=1)
            except Exception as e:
                logger.error(f"[Scheduler] Error in periodic Job Discovery: {e}")
            finally:
                db.close()
            
            # Sleep for 10 minutes
            await asyncio.sleep(10 * 60)

    async def _job_matching_loop(self):
        """Runs every hour to update job match scores and run ATS analysis on high matches."""
        while self.is_running:
            logger.info("[Scheduler] Triggering periodic Job Matching (1h)...")
            db = SessionLocal()
            try:
                self.update_job_matches(db, user_id=1)
            except Exception as e:
                logger.error(f"[Scheduler] Error in periodic Job Matching: {e}")
            finally:
                db.close()
            
            # Sleep for 1 hour
            await asyncio.sleep(60 * 60)

    async def _resume_analysis_loop(self):
        """Runs every 24 hours to analyze the resume and suggest improvements."""
        while self.is_running:
            logger.info("[Scheduler] Triggering periodic Resume Analysis (24h)...")
            db = SessionLocal()
            try:
                profile = db.query(DBCandidateProfile).filter_by(userId=1).first()
                if profile:
                    # Run ATSAnalysisAgent
                    profile_dict = {
                        "fullName": profile.fullName,
                        "headline": profile.headline,
                        "skills": profile.allSkills,
                        "experience": profile.experience,
                        "education": profile.education,
                        "projects": profile.projects
                    }
                    # Analyze general profile strength
                    res = self.ats_agent.run({"profile": profile_dict, "jobProfile": {}})
                    if res["status"] == "completed":
                        profile.atsScore = res["output"].get("atsScore", 70)
                        db.commit()
                        logger.info(f"[Scheduler] Updated candidate ATS score to {profile.atsScore}")
            except Exception as e:
                logger.error(f"[Scheduler] Error in periodic Resume Analysis: {e}")
            finally:
                db.close()
            
            # Sleep for 24 hours
            await asyncio.sleep(24 * 60 * 60)

    async def _career_insights_loop(self):
        """Runs every 7 days to generate career roadmaps and insights."""
        while self.is_running:
            logger.info("[Scheduler] Triggering periodic Career Insights (7d)...")
            db = SessionLocal()
            try:
                profile = db.query(DBCandidateProfile).filter_by(userId=1).first()
                if profile:
                    profile_dict = {
                        "fullName": profile.fullName,
                        "skills": profile.allSkills,
                        "experience": profile.experience,
                        "projects": profile.projects
                    }
                    res = self.career_agent.run({"profile": profile_dict})
                    if res["status"] == "completed":
                        logger.info(f"[Scheduler] Successfully generated weekly career recommendations: {list(res['output'].keys())}")
            except Exception as e:
                logger.error(f"[Scheduler] Error in periodic Career Insights: {e}")
            finally:
                db.close()
            
            # Sleep for 7 days
            await asyncio.sleep(7 * 24 * 60 * 60)

    # --- Helper Methods ---

    def update_job_matches(self, db: Session, user_id: int):
        """Calculates match scores for all jobs. Uses fast keyword scoring first,
        and triggers ATSAnalysisAgent for deep analysis on jobs with >70% match.
        """
        profile = db.query(DBCandidateProfile).filter_by(userId=user_id).first()
        if not profile:
            return

        skills = [s.lower() for s in (profile.allSkills or [])]
        jobs = db.query(DBJob).all()
        
        logger.info(f"[Scheduler] Running job matching for {len(jobs)} jobs...")

        for job in jobs:
            # Check if match already exists
            existing_match = db.query(DBJobMatch).filter_by(userId=user_id, jobId=job.id).first()
            if existing_match:
                continue

            # 1. Fast Keyword Matching (minimizes LLM latency)
            job_text = f"{job.role} {job.jobDescription}".lower()
            matching_skills = [s for s in skills if s in job_text]
            missing_skills = [s for s in skills if s not in job_text]
            
            # Simple ratio score
            score = 50
            if skills:
                score = int((len(matching_skills) / len(skills)) * 100)
            
            # Limit score bounds
            score = min(max(score, 10), 100)

            # 2. Deep Agentic ATS Analysis for high-match jobs (>70%)
            relevance_summary = f"Matching skills: {', '.join(matching_skills[:3])}."
            if score >= 70:
                logger.info(f"[Scheduler] High match found ({score}%). Triggering deep ATS analysis for job: {job.role} at {job.company}...")
                profile_dict = {
                    "fullName": profile.fullName,
                    "skills": profile.allSkills,
                    "experience": profile.experience
                }
                job_dict = {
                    "role": job.role,
                    "company": job.company,
                    "jobDescription": job.jobDescription
                }
                
                res = self.ats_agent.run({"profile": profile_dict, "jobProfile": job_dict})
                if res["status"] == "completed":
                    score = res["output"].get("atsScore", score)
                    relevance_summary = res["output"].get("evaluation", {}).get("formatting", relevance_summary)

            # Save match to database
            new_match = DBJobMatch(
                id=str(uuid.uuid4()),
                userId=user_id,
                jobId=job.id,
                matchScore=score,
                matchingSkills=matching_skills,
                missingSkills=missing_skills,
                relevanceSummary=relevance_summary
            )
            db.add(new_match)
            
        db.commit()
        logger.info("[Scheduler] Job matching update complete.")

background_scheduler = BackgroundScheduler()
