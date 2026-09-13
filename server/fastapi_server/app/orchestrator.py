import json
import logging
import asyncio
import uuid
from typing import Dict, Any, List, TypedDict, Annotated
from datetime import datetime
from sqlalchemy.orm import Session

# LangGraph imports
from langgraph.graph import StateGraph, END

# Import database, redis and agents
from app.database import SessionLocal, DBAgentExecution, DBCandidateProfile
from app.redis_client import redis_client
from app.plugins.manager import plugin_manager
from app.agents.resume_parsing import ResumeParsingAgent
from app.agents.ats_analysis import ATSAnalysisAgent
from app.agents.resume_improvement import ResumeImprovementAgent
from app.agents.job_description import JobDescriptionAgent
from app.agents.keyword_optimization import KeywordOptimizationAgent
from app.agents.portfolio_generation import PortfolioGenerationAgent
from app.agents.career_recommendation import CareerRecommendationAgent
from app.agents.interview_prep import InterviewPreparationAgent
from app.agents.skill_gap import SkillGapAgent
from app.agents.github_analysis import GitHubAnalysisAgent
from app.agents.linkedin_optimization import LinkedInOptimizationAgent
from app.agents.content_validation import ContentValidationAgent
from app.agents.pdf_generation import PDFGenerationAgent
from app.agents.ai_learning_tutor import AILearningTutorAgent
from app.agents.email_understanding import EmailUnderstandingAgent

logger = logging.getLogger("nextfolio.orchestrator")

# --- LangGraph State Definition ---

class AgentState(TypedDict):
    userId: int
    orchestrationId: str
    query: str
    resumeData: Any  # raw text or dict
    jobDescription: str
    settings: Dict[str, Any]
    
    # Context data passing between agents
    profile: Dict[str, Any]
    jobProfile: Dict[str, Any]
    atsAnalysis: Dict[str, Any]
    resumeImprovement: Dict[str, Any]
    keywordOptimization: Dict[str, Any]
    portfolioLayout: Dict[str, Any]
    careerRecommendations: Dict[str, Any]
    interviewPrep: Dict[str, Any]
    skillGap: Dict[str, Any]
    githubAnalysis: Dict[str, Any]
    linkedinOptimization: Dict[str, Any]
    
    # Validation & Output
    validatedContent: Dict[str, Any]
    pdfTemplate: Dict[str, Any]
    
    errors: List[str]
    completedAgents: List[str]

# --- Real-time Progress Broadcaster ---

def publish_progress(orchestration_id: str, agent_name: str, status: str, progress: int, reasoning: str = "", planning: str = "", validation: str = "", execution_time: int = 0, error: str = None, output: dict = None):
    """Publishes progress logs to Redis Pub/Sub for WebSockets and saves to database."""
    log_payload = {
        "orchestrationId": orchestration_id,
        "agentName": agent_name,
        "status": status,
        "progress": progress,
        "reasoning": reasoning,
        "planning": planning,
        "validation": validation,
        "executionTime": execution_time,
        "error": error,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "output": output
    }
    
    # 1. Publish to Redis Pub/Sub
    try:
        if hasattr(redis_client, 'publish'):
            redis_client.publish(f"orchestration:{orchestration_id}", json.dumps(log_payload))
    except Exception as e:
        logger.error(f"Failed to publish progress to Redis: {e}")

    # 2. Save to PostgreSQL / SQLite
    db = SessionLocal()
    try:
        # Check if log already exists
        existing_log = db.query(DBAgentExecution).filter_by(orchestrationId=orchestration_id, agentName=agent_name).first()
        
        input_json = json.dumps(log_payload.get("input")) if log_payload.get("input") else None
        output_json = json.dumps(output) if output else None
        
        if existing_log:
            existing_log.status = status
            existing_log.progress = progress
            existing_log.planning = planning
            existing_log.reasoning = reasoning
            existing_log.validation = validation
            existing_log.output = output_json
            existing_log.executionTime = execution_time
            existing_log.error = error
            existing_log.updatedAt = datetime.utcnow()
        else:
            new_log = DBAgentExecution(
                id=str(uuid.uuid4()),
                userId=1,  # Default fallback or fetch from state
                orchestrationId=orchestration_id,
                agentName=agent_name,
                status=status,
                progress=progress,
                planning=planning,
                reasoning=reasoning,
                validation=validation,
                input=input_json,
                output=output_json,
                executionTime=execution_time,
                error=error
            )
            db.add(new_log)
        db.commit()
    except Exception as db_err:
        logger.error(f"Failed to save agent log to DB: {db_err}")
    finally:
        db.close()

# --- Master Orchestrator Class ---

class MasterOrchestrator:
    def __init__(self):
        self.resume_parsing_agent = ResumeParsingAgent()
        self.ats_analysis_agent = ATSAnalysisAgent()
        self.resume_improvement_agent = ResumeImprovementAgent()
        self.job_description_agent = JobDescriptionAgent()
        self.keyword_optimization_agent = KeywordOptimizationAgent()
        self.portfolio_generation_agent = PortfolioGenerationAgent()
        self.career_recommendation_agent = CareerRecommendationAgent()
        self.interview_prep_agent = InterviewPreparationAgent()
        self.skill_gap_agent = SkillGapAgent()
        self.github_analysis_agent = GitHubAnalysisAgent()
        self.linkedin_optimization_agent = LinkedInOptimizationAgent()
        self.content_validation_agent = ContentValidationAgent()
        self.pdf_generation_agent = PDFGenerationAgent()
        self.ai_learning_tutor_agent = AILearningTutorAgent()
        self.email_understanding_agent = EmailUnderstandingAgent()
        
        # Load any discovered plugin agents
        self.plugins = plugin_manager.discovered_agents
        
        self.workflow = self._compile_graph()

    def _compile_graph(self):
        """Compiles the LangGraph StateGraph workflow."""
        builder = StateGraph(AgentState)
        
        # Define Nodes
        builder.add_node("resume_parser", self.node_resume_parser)
        builder.add_node("job_parser", self.node_job_parser)
        builder.add_node("parallel_agents", self.node_parallel_agents)
        builder.add_node("content_validator", self.node_content_validator)
        builder.add_node("pdf_generator", self.node_pdf_generator)
        
        # Define Edges / Transitions
        builder.set_entry_point("resume_parser")
        builder.add_edge("resume_parser", "job_parser")
        builder.add_edge("job_parser", "parallel_agents")
        builder.add_edge("parallel_agents", "content_validator")
        builder.add_edge("content_validator", "pdf_generator")
        builder.add_edge("pdf_generator", END)
        
        return builder.compile()

    # --- Node Implementations ---

    async def node_resume_parser(self, state: AgentState) -> Dict[str, Any]:
        oid = state["orchestrationId"]
        resume_text = state["resumeData"]
        
        if not resume_text:
            publish_progress(oid, "ResumeParsingAgent", "completed", 100, "No resume uploaded. Skipping parsing.")
            return {"profile": state.get("profile") or {}}
            
        publish_progress(oid, "ResumeParsingAgent", "running", 20, "Extracting text metadata...")
        
        # Run parsing agent
        res = self.resume_parsing_agent.run({"resumeText": resume_text})
        
        publish_progress(
            oid, "ResumeParsingAgent", res["status"], 100,
            reasoning=res["reasoning"], planning=res["planning"],
            validation=res["validation"], execution_time=res["executionTime"],
            error=res.get("error"), output=res.get("output")
        )
        
        return {"profile": res.get("output") or {}}

    async def node_job_parser(self, state: AgentState) -> Dict[str, Any]:
        oid = state["orchestrationId"]
        jd_text = state["jobDescription"]
        
        if not jd_text:
            publish_progress(oid, "JobDescriptionAgent", "completed", 100, "No job description provided. Skipping parsing.")
            return {"jobProfile": {}}
            
        publish_progress(oid, "JobDescriptionAgent", "running", 20, "Extracting job requirements...")
        
        # Run job description agent
        res = self.job_description_agent.run({"jobDescription": jd_text})
        
        publish_progress(
            oid, "JobDescriptionAgent", res["status"], 100,
            reasoning=res["reasoning"], planning=res["planning"],
            validation=res["validation"], execution_time=res["executionTime"],
            error=res.get("error"), output=res.get("output")
        )
        
        return {"jobProfile": res.get("output") or {}}

    async def node_parallel_agents(self, state: AgentState) -> Dict[str, Any]:
        """Executes all independent downstream agents in parallel using asyncio.gather."""
        oid = state["orchestrationId"]
        profile = state.get("profile") or {}
        job_profile = state.get("jobProfile") or {}
        settings = state.get("settings") or {}
        
        publish_progress(oid, "Master AI Orchestrator", "running", 40, "Scheduling parallel agents (ATS, Portfolio, Career, Skill Gap, LinkedIn, GitHub)...")
        
        # Define tasks to run concurrently
        async def run_ats():
            publish_progress(oid, "ATSAnalysisAgent", "running", 30, "Evaluating ATS score...")
            res = self.ats_analysis_agent.run({"profile": profile, "jobProfile": job_profile})
            publish_progress(oid, "ATSAnalysisAgent", res["status"], 100, res["reasoning"], res["planning"], res["validation"], res["executionTime"], res.get("error"), res.get("output"))
            return "atsAnalysis", res.get("output")

        async def run_improvement():
            publish_progress(oid, "ResumeImprovementAgent", "running", 30, "Rewriting resume sections...")
            res = self.resume_improvement_agent.run({"profile": profile, "jobProfile": job_profile})
            publish_progress(oid, "ResumeImprovementAgent", res["status"], 100, res["reasoning"], res["planning"], res["validation"], res["executionTime"], res.get("error"), res.get("output"))
            return "resumeImprovement", res.get("output")

        async def run_keyword():
            publish_progress(oid, "KeywordOptimizationAgent", "running", 30, "Comparing keyword alignments...")
            res = self.keyword_optimization_agent.run({"profile": profile, "jobProfile": job_profile})
            publish_progress(oid, "KeywordOptimizationAgent", res["status"], 100, res["reasoning"], res["planning"], res["validation"], res["executionTime"], res.get("error"), res.get("output"))
            return "keywordOptimization", res.get("output")

        async def run_portfolio():
            publish_progress(oid, "PortfolioGenerationAgent", "running", 30, "Generating portfolio code...")
            res = self.portfolio_generation_agent.run({"profile": profile})
            publish_progress(oid, "PortfolioGenerationAgent", res["status"], 100, res["reasoning"], res["planning"], res["validation"], res["executionTime"], res.get("error"), res.get("output"))
            return "portfolioLayout", res.get("output")

        async def run_career():
            publish_progress(oid, "CareerRecommendationAgent", "running", 30, "Analyzing career paths...")
            res = self.career_recommendation_agent.run({"profile": profile})
            publish_progress(oid, "CareerRecommendationAgent", res["status"], 100, res["reasoning"], res["planning"], res["validation"], res["executionTime"], res.get("error"), res.get("output"))
            return "careerRecommendations", res.get("output")

        async def run_interview():
            publish_progress(oid, "InterviewPreparationAgent", "running", 30, "Generating interview preparation questions...")
            res = self.interview_prep_agent.run({"profile": profile, "jobProfile": job_profile})
            publish_progress(oid, "InterviewPreparationAgent", res["status"], 100, res["reasoning"], res["planning"], res["validation"], res["executionTime"], res.get("error"), res.get("output"))
            return "interviewPrep", res.get("output")

        async def run_skill_gap():
            publish_progress(oid, "SkillGapAgent", "running", 30, "Mapping skill gaps...")
            res = self.skill_gap_agent.run({"profile": profile, "jobProfile": job_profile})
            publish_progress(oid, "SkillGapAgent", res["status"], 100, res["reasoning"], res["planning"], res["validation"], res["executionTime"], res.get("error"), res.get("output"))
            return "skillGap", res.get("output")

        async def run_linkedin():
            publish_progress(oid, "LinkedInOptimizationAgent", "running", 30, "Optimizing LinkedIn profile headline & summary...")
            res = self.linkedin_optimization_agent.run({"profile": profile})
            publish_progress(oid, "LinkedInOptimizationAgent", res["status"], 100, res["reasoning"], res["planning"], res["validation"], res["executionTime"], res.get("error"), res.get("output"))
            return "linkedinOptimization", res.get("output")

        async def run_github():
            publish_progress(oid, "GitHubAnalysisAgent", "running", 30, "Evaluating GitHub repositories...")
            res = self.github_analysis_agent.run({"repositories": profile.get("projects", [])})
            publish_progress(oid, "GitHubAnalysisAgent", res["status"], 100, res["reasoning"], res["planning"], res["validation"], res["executionTime"], res.get("error"), res.get("output"))
            return "githubAnalysis", res.get("output")

        # Run all tasks concurrently
        results = await asyncio.gather(
            run_ats(),
            run_improvement(),
            run_keyword(),
            run_portfolio(),
            run_career(),
            run_interview(),
            run_skill_gap(),
            run_linkedin(),
            run_github(),
            return_exceptions=True
        )
        
        updates = {}
        for item in results:
            if isinstance(item, tuple):
                key, val = item
                if val:
                    updates[key] = val
            else:
                logger.error(f"Parallel agent task failed with exception: {item}")
                
        return updates

    async def node_content_validator(self, state: AgentState) -> Dict[str, Any]:
        oid = state["orchestrationId"]
        resume_imp = state.get("resumeImprovement") or {}
        portfolio = state.get("portfolioLayout") or {}
        
        publish_progress(oid, "ContentValidationAgent", "running", 20, "Validating generated resume and portfolio layout quality...")
        
        # Validate resume improvement
        val_resume = self.content_validation_agent.run({
            "text": json.dumps(resume_imp),
            "context": "Professional Resume Improvement"
        })
        
        # Validate portfolio HTML
        val_portfolio = self.content_validation_agent.run({
            "text": portfolio.get("htmlContent", ""),
            "context": "Responsive Portfolio Website HTML"
        })
        
        publish_progress(
            oid, "ContentValidationAgent", "completed", 100,
            reasoning=f"Resume Validation: {val_resume['status']}. Portfolio Validation: {val_portfolio['status']}."
        )
        
        # If validated and improved text is returned, merge it back
        validated_resume = resume_imp
        if val_resume["status"] == "completed" and val_resume.get("output", {}).get("correctedText"):
            try:
                validated_resume = json.loads(val_resume["output"]["correctedText"])
            except:
                pass
                
        return {
            "resumeImprovement": validated_resume,
            "validatedContent": {
                "resumeValid": val_resume.get("output", {}).get("passed", True),
                "portfolioValid": val_portfolio.get("output", {}).get("passed", True)
            }
        }

    async def node_pdf_generator(self, state: AgentState) -> Dict[str, Any]:
        oid = state["orchestrationId"]
        profile = state.get("profile") or {}
        settings = state.get("settings") or {}
        
        publish_progress(oid, "PDFGenerationAgent", "running", 40, "Compiling PDF print-ready templates...")
        
        res = self.pdf_generation_agent.run({
            "profile": profile,
            "style": settings.get("resumeStyle", "ATS")
        })
        
        publish_progress(
            oid, "PDFGenerationAgent", res["status"], 100,
            reasoning=res["reasoning"], planning=res["planning"],
            validation=res["validation"], execution_time=res["executionTime"],
            error=res.get("error"), output=res.get("output")
        )
        
        return {"pdfTemplate": res.get("output") or {}}

    # --- Pipeline Execution ---

    async def run_pipeline(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Triggers the LangGraph multi-agent execution pipeline."""
        orchestration_id = payload.get("orchestrationId") or str(uuid.uuid4())
        user_id = payload.get("userId", 1)
        
        initial_state = AgentState(
            userId=user_id,
            orchestrationId=orchestration_id,
            query=payload.get("query", ""),
            resumeData=payload.get("resumeData"),
            jobDescription=payload.get("jobDescription", ""),
            settings=payload.get("settings", {}),
            profile=payload.get("profile") or {},
            jobProfile={},
            atsAnalysis={},
            resumeImprovement={},
            keywordOptimization={},
            portfolioLayout={},
            careerRecommendations={},
            interviewPrep={},
            skillGap={},
            githubAnalysis={},
            linkedinOptimization={},
            validatedContent={},
            pdfTemplate={},
            errors=[],
            completedAgents=[]
        )
        
        publish_progress(
            orchestration_id, "Master AI Orchestrator", "running", 10,
            reasoning="Starting NextFolio Multi-Agent Execution Graph.",
            planning="Parsing query and building execution graph."
        )
        
        try:
            final_state = await self.workflow.ainvoke(initial_state)
            
            publish_progress(
                orchestration_id, "Master AI Orchestrator", "completed", 100,
                reasoning="All autonomous agents completed execution.",
                planning="Pipeline finished successfully."
            )
            
            # Save parsed profile to database CandidateProfile
            self._save_candidate_profile_to_db(user_id, final_state)
            
            return {
                "success": True,
                "orchestrationId": orchestration_id,
                "reasoning": "Pipeline executed successfully.",
                "pipeline": [],  # Filled in by client DB queries
                "context": final_state
            }
        except Exception as e:
            logger.error(f"Orchestration pipeline failed: {e}")
            publish_progress(
                orchestration_id, "Master AI Orchestrator", "failed", 100,
                reasoning=f"Pipeline aborted due to critical error: {e}",
                error=str(e)
            )
            return {
                "success": False,
                "orchestrationId": orchestration_id,
                "error": str(e),
                "context": {}
            }

    def _save_candidate_profile_to_db(self, user_id: int, state: AgentState):
        """Saves the parsed/completed candidate profile into the database."""
        profile = state.get("profile")
        if not profile or not (profile.get("personal", {}).get("fullName") or profile.get("fullName")):
            return
            
        db = SessionLocal()
        try:
            # Normalize profile data
            personal = profile.get("personal", {})
            full_name = profile.get("fullName") or personal.get("fullName") or "Candidate"
            email = profile.get("email") or personal.get("email") or ""
            phone = profile.get("phone") or personal.get("phone") or ""
            location = profile.get("location") or personal.get("location") or ""
            summary = profile.get("summary") or personal.get("summary") or ""
            
            existing_profile = db.query(DBCandidateProfile).filter_by(userId=user_id).first()
            
            profile_data = {
                "fullName": full_name,
                "email": email,
                "phone": phone,
                "location": location,
                "headline": profile.get("headline", f"{full_name} Professional"),
                "summary": summary,
                "atsScore": state.get("atsAnalysis", {}).get("atsScore", 70),
                "allSkills": profile.get("skills", []),
                "topSkills": profile.get("skills", [])[:8],
                "experience": profile.get("experience", []),
                "education": profile.get("education", []),
                "certifications": profile.get("certifications", []),
                "projects": profile.get("projects", []),
                "languages": profile.get("languages", []),
                "missingSkills": state.get("keywordOptimization", {}).get("missingKeywords", []),
                "yearsOfExperience": float(profile.get("yearsOfExperience", 0.0)),
                "skillCount": len(profile.get("skills", [])),
                "projectCount": len(profile.get("projects", []))
            }
            
            if existing_profile:
                for k, v in profile_data.items():
                    setattr(existing_profile, k, v)
                existing_profile.lastUpdated = datetime.utcnow()
            else:
                new_profile = DBCandidateProfile(
                    id=str(uuid.uuid4()),
                    userId=user_id,
                    **profile_data
                )
                db.add(new_profile)
            db.commit()
            logger.info(f"Saved CandidateProfile for user {user_id} to database.")
        except Exception as e:
            logger.error(f"Failed to save candidate profile: {e}")
        finally:
            db.close()
