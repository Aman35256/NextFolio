import time
import logging
from sqlalchemy import create_engine, Column, String, Integer, Float, Text, JSON, DateTime, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
from app.config import settings

logger = logging.getLogger("nextfolio.database")

Base = declarative_base()

# Attempt connection to PostgreSQL, fallback to SQLite if needed
engine = None
try:
    engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True)
    # Test connection
    with engine.connect() as conn:
        logger.info("Successfully connected to PostgreSQL.")
except Exception as postgres_err:
    logger.warning(f"PostgreSQL connection failed ({postgres_err}). Falling back to SQLite.")
    engine = create_engine(
        settings.SQLITE_FALLBACK_URL, 
        connect_args={"check_same_thread": False} if "sqlite" in settings.SQLITE_FALLBACK_URL else {}
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- Database Models ---

class DBUser(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False, unique=True, index=True)
    password = Column(String(255), nullable=False)
    theme = Column(String(50), default="modern")
    colorPalette = Column(String(50), default="blue")
    layoutStyle = Column(String(50), default="standard")

class DBAgentSettings(Base):
    __tablename__ = "agent_settings"
    id = Column(String(255), primary_key=True, index=True)
    userId = Column(Integer, index=True, nullable=False, unique=True)
    enabled = Column(Integer, default=0)
    matchScoreThreshold = Column(Integer, default=75)
    salaryMin = Column(Integer, default=0)
    remoteOnly = Column(Integer, default=0)
    requiresApproval = Column(Integer, default=1)
    allowedCountries = Column(JSON, default=list)
    blockedCompanies = Column(JSON, default=list)
    preferredRoles = Column(JSON, default=list)
    preferredLocations = Column(JSON, default=list)
    preferredIndustries = Column(JSON, default=list)
    activeSources = Column(JSON, default=list)

class DBCandidateProfile(Base):
    __tablename__ = "candidate_profiles"
    id = Column(String(255), primary_key=True, index=True)
    userId = Column(Integer, index=True, nullable=False)
    fullName = Column(String(255), default="")
    email = Column(String(255), default="")
    phone = Column(String(50), default="")
    location = Column(String(255), default="")
    headline = Column(String(255), default="")
    summary = Column(Text, default="")
    atsScore = Column(Integer, default=70)
    profileStrength = Column(Integer, default=80)
    allSkills = Column(JSON, default=list)
    topSkills = Column(JSON, default=list)
    skillCategories = Column(JSON, default=dict)
    experience = Column(JSON, default=list)
    education = Column(JSON, default=list)
    certifications = Column(JSON, default=list)
    projects = Column(JSON, default=list)
    languages = Column(JSON, default=list)
    missingSkills = Column(JSON, default=list)
    yearsOfExperience = Column(Float, default=0.0)
    skillCount = Column(Integer, default=0)
    projectCount = Column(Integer, default=0)
    lastUpdated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class DBAgentExecution(Base):
    __tablename__ = "agent_executions"
    id = Column(String(255), primary_key=True, index=True)
    userId = Column(Integer, index=True, nullable=False)
    orchestrationId = Column(String(255), index=True, nullable=False)
    agentName = Column(String(100), nullable=False)
    status = Column(String(50), nullable=False)  # pending, running, completed, failed, retrying
    progress = Column(Integer, default=0)
    planning = Column(Text, nullable=True)
    reasoning = Column(Text, nullable=True)
    validation = Column(String(255), nullable=True)
    input = Column(Text, nullable=True)  # JSON string
    output = Column(Text, nullable=True) # JSON string
    confidence = Column(Integer, default=100)
    executionTime = Column(Integer, default=0)
    error = Column(Text, nullable=True)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class DBJob(Base):
    __tablename__ = "jobs"
    id = Column(String(255), primary_key=True, index=True)
    company = Column(String(255), nullable=False)
    role = Column(String(255), nullable=False)
    location = Column(String(255), default="Remote")
    salary = Column(String(255), default="$90,000 - $120,000")
    experienceRequired = Column(String(255), default="2+ years")
    remoteStatus = Column(Integer, default=1) # 1 for true, 0 for false (SQLite compatibility)
    visaSponsorship = Column(Integer, default=0)
    jobType = Column(String(255), default="Full-time")
    applyUrl = Column(Text, nullable=True)
    jobDescription = Column(Text, nullable=True)
    originalSource = Column(String(255), default="Remotive")
    dateDiscovered = Column(DateTime, default=datetime.utcnow)
    formattedData = Column(JSON, nullable=True)

class DBJobMatch(Base):
    __tablename__ = "job_matches"
    id = Column(String(255), primary_key=True, index=True)
    userId = Column(Integer, index=True, nullable=False)
    jobId = Column(String(255), index=True, nullable=False)
    matchScore = Column(Integer, default=50)
    matchingSkills = Column(JSON, default=list)
    missingSkills = Column(JSON, default=list)
    relevanceSummary = Column(Text, nullable=True)
    createdAt = Column(DateTime, default=datetime.utcnow)

class DBApplication(Base):
    __tablename__ = "applications"
    id = Column(String(255), primary_key=True, index=True)
    userId = Column(Integer, index=True, nullable=False)
    jobId = Column(String(255), index=True, nullable=False)
    status = Column(String(100), default="Applied") # Applied, Interview Scheduled, Assessment, Rejected, Offer Received
    appliedAt = Column(DateTime, default=datetime.utcnow)
    timeline = Column(JSON, default=list)

# Create tables
Base.metadata.create_all(bind=engine)

