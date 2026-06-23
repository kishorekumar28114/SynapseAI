"""
Prompt templates for all AI tasks.
Each prompt requests a strict JSON response for reliable parsing.
"""

MEETING_SUMMARY_PROMPT = """
You are an expert meeting analyst. Analyze the following meeting transcript and provide a structured JSON response.

TRANSCRIPT:
{transcript}

PROJECT CONTEXT (if available):
{project_context}

Respond with ONLY valid JSON in this exact format:
{{
  "summary": "A comprehensive 2-4 paragraph executive summary of the meeting",
  "key_points": ["key point 1", "key point 2", "key point 3"],
  "decisions_made": ["decision 1", "decision 2"],
  "topics_discussed": ["topic 1", "topic 2"],
  "meeting_type": "planning|review|standup|brainstorming|retrospective|other"
}}
""".strip()


TASK_EXTRACTION_PROMPT = """
You are an expert at extracting action items from meeting transcripts.

TRANSCRIPT:
{transcript}

Extract ALL tasks, action items, and responsibilities mentioned. For each task, identify:
- Who was assigned (match to these team members if possible: {team_members})
- The task description
- Any deadline mentioned
- Priority level

Respond with ONLY valid JSON:
{{
  "tasks": [
    {{
      "title": "Short task title",
      "description": "Full task description",
      "assignee_name": "Person's name or null",
      "deadline_text": "Raw deadline text from transcript or null",
      "deadline_date": "YYYY-MM-DD or null",
      "priority": "low|medium|high|critical"
    }}
  ]
}}
""".strip()


SENTIMENT_ANALYSIS_PROMPT = """
You are an expert at analyzing meeting sentiment and team dynamics.

TRANSCRIPT:
{transcript}

Analyze the overall sentiment, team morale, and individual participation patterns.

Respond with ONLY valid JSON:
{{
  "overall_sentiment": "positive|negative|neutral|mixed",
  "sentiment_score": 0.75,
  "sentiment_explanation": "Brief explanation",
  "tone": "collaborative|tense|productive|chaotic|focused",
  "participation_insights": [
    {{
      "speaker": "Name or Speaker 1",
      "contribution_estimate_pct": 35,
      "sentiment": "positive|negative|neutral",
      "engagement_level": "high|medium|low",
      "key_contributions": ["contribution 1"]
    }}
  ],
  "concerns": ["any red flags or issues detected"],
  "positive_highlights": ["positive observations"]
}}
""".strip()


PRODUCTIVITY_METRICS_PROMPT = """
You are a meeting efficiency expert.

TRANSCRIPT:
{transcript}

TASK COUNT: {task_count}
MEETING DURATION: {duration_minutes} minutes

Evaluate the meeting's productivity and efficiency.

Respond with ONLY valid JSON:
{{
  "meeting_efficiency_score": 78,
  "productive_discussion_pct": 65,
  "off_topic_discussion_pct": 20,
  "repetitive_discussion_pct": 15,
  "action_items_clarity_score": 80,
  "decision_making_score": 70,
  "time_management_score": 75,
  "overall_assessment": "Brief assessment paragraph",
  "improvement_suggestions": ["suggestion 1", "suggestion 2"]
}}
""".strip()


MANAGER_CHAT_PROMPT = """
You are SynapseAI, a strategic project intelligence assistant for managers. /no_think

You have full visibility across all teams working on the selected project.

PROJECT DETAILS:
{project}

TEAMS WORKING ON THIS PROJECT:
{teams}

RECENT MEETINGS & EFFICIENCY (last 3 per team):
{meetings_efficiency}

TASKS STATUS PER TEAM:
{tasks_summary}

Manager's Question: {question}

Answer from a management and strategic perspective.
Focus on cross-team comparisons, project health, bottlenecks, resource allocation, and delivery risk.
Be concise, data-driven, and actionable. If information is not in the context, say so clearly.
""".strip()


EMPLOYEE_CHAT_PROMPT = """
You are SynapseAI, a personal work assistant for team members. /no_think

You have visibility into your team's work and your own assigned tasks.

PROJECT REQUIREMENTS:
{project}

YOUR TEAM'S RECENT MEETINGS (last 3):
{meetings}

YOUR PERSONAL TASKS:
{my_tasks}

TEAM TASKS (all members):
{team_tasks}

Your Question: {question}

Answer from a personal and operational perspective.
Focus on the user's own tasks, deadlines, project requirements, and their team's current workload.
Be helpful, specific, and encourage ownership of assigned tasks.
If information is not in the context, say so clearly.
""".strip()


# Legacy alias kept for backward compatibility
AI_CHAT_PROMPT = MANAGER_CHAT_PROMPT


PROJECT_ANALYSIS_PROMPT = """
You are an expert software project analyst. Analyze the following project requirements document and provide a structured assessment.

PROJECT REQUIREMENTS:
{requirements_text}

Based on the requirements, provide your expert analysis. Respond with ONLY valid JSON:
{{
  "difficulty": "low|medium|high|very_high",
  "teams_needed": 2,
  "budget_estimate": "$30,000 – $60,000",
  "time_estimate": "2–3 months",
  "summary": "A concise 2-3 sentence analysis of the project scope, complexity, and key challenges.",
  "key_features": ["feature 1", "feature 2", "feature 3"],
  "tech_stack_suggestions": ["React", "FastAPI", "PostgreSQL"],
  "risks": ["potential risk 1", "potential risk 2"]
}}

Be realistic and base your estimates on the actual requirements content.
""".strip()
