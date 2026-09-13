import json
from typing import Dict, Any
from app.agents.base import BaseAgent
from app.model_router import model_router

class AILearningTutorAgent(BaseAgent):
    def __init__(self):
        super().__init__("AILearningTutorAgent", complexity="medium")

    def plan(self, payload: Dict[str, Any]) -> str:
        return f"Formulating tutoring response for user query: '{payload.get('message', '')[:30]}...'"

    def reason(self, payload: Dict[str, Any]) -> str:
        return "Retrieving technical explanations, quiz templates, or learning roadmaps from RAG to assist the user."

    def execute_task(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        message = payload.get("message", "")
        chat_history = payload.get("chatHistory", [])
        user_context = payload.get("userContext") or {}
        
        # Query RAG for relevant technical concepts, STAR methods, or tutorials
        rag_context = self.query_rag(message, top_k=2)

        # Build schema template matching our structured requirements
        template = {
            "reply": "Conversational, engaging, markdown-formatted response...",
            "detectedMode": "tutor",  # tutor, coding, interview, project_mentor
            "detectedLevel": "intermediate",  # beginner, intermediate, advanced
            "proactiveSuggestion": "Optional timely suggestion or next step, or null",
            "tutorMemory": {
                "favoriteLanguage": "",
                "weakConcepts": [],
                "strongConcepts": [],
                "learningStyle": ""
            }
        }

        # Extract user context details for the prompt
        personal_info = user_context.get("personalInfo") or {}
        candidate_profile = user_context.get("candidateProfile") or {}
        roadmap = user_context.get("roadmap") or {}
        skills = user_context.get("skills") or []
        projects = user_context.get("projects") or []
        settings = user_context.get("settings") or {}
        learnings = settings.get("agentLearnings") or {}
        tutor_memory = learnings.get("tutorMemory") or {}
        
        user_name = personal_info.get("fullName") or "Candidate"
        target_role = roadmap.get("targetRole") or "Software Engineer"
        skills_str = ", ".join(skills) if skills else "None"
        projects_str = ", ".join([p.get("title", "") for p in projects if p.get("title")]) if projects else "None"
        tutor_memory_str = json.dumps(tutor_memory)

        system_prompt = (
            f"You are a world-class AI Technical Mentor for {user_name}, who is preparing for a career as a {target_role}.\n\n"
            f"Here is the candidate's context:\n"
            f"- Skills: [{skills_str}]\n"
            f"- Projects: [{projects_str}]\n"
            f"- Resume Summary: {candidate_profile.get('summary', 'None')}\n"
            f"- Career Roadmap: Level {roadmap.get('level', 1)}, Streak {roadmap.get('streak', 0)} days, XP {roadmap.get('xp', 0)}\n"
            f"- Tutor Memory (things you previously learned about them): {tutor_memory_str}\n\n"
            f"YOUR PERSONALITY:\n"
            f"Friendly, professional, patient, curious, encouraging, honest, adaptive, knowledgeable, calm, motivating. "
            f"Never sound robotic, scripted, or repetitive. Be a warm, experienced mentor.\n\n"
            f"CONVERSATION STYLE:\n"
            f"Communicate exactly like a human mentor. Avoid dry bulleted lists of questions or 'Question 1: Answer: Explanation:'. "
            f"Teach through conversation. When explaining a concept: start simple, use a real-world analogy, then explain technically, then show a code snippet, and finally ask if they understood.\n\n"
            f"ADAPTIVE DIFFICULTY:\n"
            f"- If the user is a Beginner: Use simpler explanations, more examples, less jargon.\n"
            f"- If Intermediate: Introduce technical details and explain how things work under the hood.\n"
            f"- If Advanced: Discuss implementation details, performance, trade-offs, and system architecture.\n"
            f"Determine the user's level and output it in 'detectedLevel'.\n\n"
            f"MODES OF OPERATION:\n"
            f"1. **Tutor Mode (default)**: General teaching, explaining, and collaborative learning.\n"
            f"2. **Coding Mode**: If the user is writing code, asking for a coding challenge, or debugging. Do NOT immediately provide the solution. Guide them, give hints, explain mistakes, and encourage them to think. Reveal answers only when necessary or when explicitly asked for the solution.\n"
            f"3. **Interview Mode**: Triggered when the user says 'Interview me' or similar. Become a professional interviewer. Ask ONE question at a time. Wait for their response. Evaluate it, ask follow-up questions, and give constructive feedback with a score and suggested improvements.\n"
            f"4. **Project Mentor Mode**: If they want to build something. Help brainstorm, break it into milestones, suggest technologies, explain architecture, and review code.\n"
            f"Identify the active mode and output it in 'detectedMode'.\n\n"
            f"PROACTIVE ASSISTANCE:\n"
            f"Occasionally suggest a timely next step (e.g., a mock interview, a coding challenge, or updating their resume/GitHub) in 'proactiveSuggestion'. Keep it highly relevant.\n"
            f"Update your learnings about the user in 'tutorMemory' (e.g., favoriteLanguage, weakConcepts as list, strongConcepts as list, learningStyle).\n"
        )

        feedback = payload.get("__retry_feedback__", "")
        prompt = (
            f"User Query: '{message}'\n\n"
            f"Recent Chat History:\n{json.dumps(chat_history[-8:], indent=2)}\n\n"
            f"Related Technical Guides (RAG):\n{rag_context}\n\n"
            f"{feedback}"
        )
        
        res = model_router.generate_structured(
            prompt=prompt,
            schema_template=template,
            system_prompt=system_prompt,
            temperature=0.6,
            complexity=self.complexity,
            task_name=self.name
        )
        
        # If it fell back to the template's placeholder, generate a smart local offline reply
        if res.get("reply") == template["reply"]:
            res["reply"] = self._generate_local_mentor_reply(message, user_name, target_role) + "\n\n⚠️ *Note: Running in offline/local fallback mode due to rate limits or connection issues.*"
            
        return res

    def _generate_local_mentor_reply(self, message: str, user_name: str, target_role: str) -> str:
        query = message.lower()
        
        if "quiz" in query or "test" in query or "question" in query:
            return (
                f"Hi {user_name}! Here is a custom quiz question for you to practice:\n\n"
                f"**Topic: Docker Containerization**\n"
                f"Which of the following commands would you run to spin up a container in the background (detached mode)?\n\n"
                f"1. `docker run -d nginx`\n"
                f"2. `docker run -it nginx`\n"
                f"3. `docker start -f nginx`\n"
                f"4. `docker exec -d nginx`\n\n"
                f"*Reply with 1, 2, 3, or 4 to check your answer!*"
            )

        if "docker" in query:
            return (
                f"Docker is a platform designed to help you create, deploy, and run applications by using containers. "
                f"Containers allow a developer to package up an application with all of the parts it needs, such as libraries and other dependencies, and ship it all out as one package.\n\n"
                f"**Key concepts:**\n"
                f"1. **Dockerfile:** A text document containing all the commands a user could call on the command line to assemble an image.\n"
                f"2. **Image:** A read-only template with instructions for creating a Docker container.\n"
                f"3. **Container:** A runnable instance of an image.\n\n"
                f"Try typing **\"Give me a quiz\"** to test your docker knowledge!"
            )

        if "react" in query:
            return (
                f"React is a popular open-source JavaScript library for building user interfaces, particularly for single-page applications. It is maintained by Meta and a community of individual developers and companies.\n\n"
                f"**Core Principles:**\n"
                f"1. **Components:** Reusable UI bricks that encapsulate logic and layout.\n"
                f"2. **Virtual DOM:** Re-renders only changed elements instead of reload, optimizing speed.\n"
                f"3. **State & Props:** Props pass data down components, while state manages local variables inside components.\n\n"
                f"Would you like to solve a React exercise? Reply **\"React quiz\"** to test yourself!"
            )

        if "1" in query and len(query) < 5:
            return f"🎉 **Correct!** Running `docker run -d` runs the container in detached mode, meaning it runs in the background. Excellent job! You earn 50 XP!"

        if any(num in query for num in ["2", "3", "4"]) and len(query) < 5:
            return f"❌ **Incorrect.** Option 1 is correct. `-d` stands for detached mode, running the container in the background. Options like `-it` run the container interactively, which attaches standard input/output streams. Let's try another topic!"

        return (
            f"Hello {user_name}! As your NextFolio Career Mentor, I can help you prepare for your goal as a **{target_role}**.\n\n"
            f"Here is what I can do:\n"
            f"1. **Explain concepts** (e.g. Docker, React, Redis, AWS, System Design)\n"
            f"2. **Generate quizzes** (type \"Give me a quiz\")\n"
            f"3. **Suggest learning steps** to get job ready.\n\n"
            f"What skill or framework would you like to review today?"
        )

    def validate(self, output: Dict[str, Any]) -> bool:
        if not output:
            return False
        return "reply" in output and len(output["reply"].strip()) > 10

