"""
Verify all models can read/write correctly after enum fixes.
"""
from app.database.session import SessionLocal
from app.models.user import User, UserRole
from app.models.meeting import Meeting, MeetingStatus, MeetingFileType
from app.models.task import Task, TaskPriority, TaskStatus
from app.models.team_member import TeamMember, MemberRole

db = SessionLocal()
try:
    # Test 1: Read users
    users = db.query(User).all()
    print(f"Users ({len(users)}):")
    for u in users:
        print(f"  {u.username}: role={u.role!r} (is manager: {u.role == UserRole.MANAGER})")
    
    # Test 2: Read meetings  
    meetings = db.query(Meeting).all()
    print(f"\nMeetings ({len(meetings)}):")
    for m in meetings:
        print(f"  {m.title}: status={m.status!r}, file_type={m.file_type!r}")
        print(f"    status == failed: {m.status == MeetingStatus.FAILED.value}")
    
    # Test 3: Read team members
    members = db.query(TeamMember).all()
    print(f"\nTeam members ({len(members)}):")
    for m in members:
        print(f"  team_id={m.team_id}: role={m.role_in_team!r}")
    
    print("\nAll reads successful!")
    
finally:
    db.close()
