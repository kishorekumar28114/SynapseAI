"""
Fix all DB enum types: rename labels to exactly match Python enum values.

Python enum values:
- UserRole: manager, team_lead, team_member
- MeetingStatus: uploaded, transcribing, transcribed, processing, completed, failed
- MeetingFileType: mp3, wav, m4a, ogg, pdf, docx, txt
- TaskPriority: low, medium, high, critical  
- TaskStatus: pending, in_progress, completed
"""
from app.database.connection import engine
from sqlalchemy import text

# Map: (enum_type_name, old_label, new_label)
RENAMES = [
    # userrole
    ('userrole', 'MANAGER', 'manager'),
    ('userrole', 'TEAM_LEAD', 'team_lead'),
    ('userrole', 'TEAM_MEMBER', 'team_member'),
    # meetingstatus
    ('meetingstatus', 'UPLOADED', 'uploaded'),
    ('meetingstatus', 'TRANSCRIBING', 'transcribing'),
    ('meetingstatus', 'TRANSCRIBED', 'transcribed'),
    ('meetingstatus', 'PROCESSING', 'processing'),
    ('meetingstatus', 'COMPLETED', 'completed'),
    ('meetingstatus', 'FAILED', 'failed'),
    # meetingfiletype - DB has AUDIO_MP3 but Python uses "mp3"
    ('meetingfiletype', 'AUDIO_MP3', 'mp3'),
    ('meetingfiletype', 'AUDIO_WAV', 'wav'),
    ('meetingfiletype', 'AUDIO_M4A', 'm4a'),
    ('meetingfiletype', 'AUDIO_OGG', 'ogg'),
    ('meetingfiletype', 'DOC_PDF', 'pdf'),
    ('meetingfiletype', 'DOC_DOCX', 'docx'),
    ('meetingfiletype', 'DOC_TXT', 'txt'),
    # taskpriority
    ('taskpriority', 'LOW', 'low'),
    ('taskpriority', 'MEDIUM', 'medium'),
    ('taskpriority', 'HIGH', 'high'),
    ('taskpriority', 'CRITICAL', 'critical'),
    # taskstatus
    ('taskstatus', 'PENDING', 'pending'),
    ('taskstatus', 'IN_PROGRESS', 'in_progress'),
    ('taskstatus', 'COMPLETED', 'completed'),
]

with engine.connect() as conn:
    for enum_name, old_val, new_val in RENAMES:
        try:
            conn.execute(text(f"ALTER TYPE {enum_name} RENAME VALUE '{old_val}' TO '{new_val}'"))
            print(f"OK   {enum_name}: '{old_val}' -> '{new_val}'")
        except Exception as e:
            print(f"ERR  {enum_name}: '{old_val}' -> '{new_val}': {e}")
    conn.commit()
    
    print("\n=== Verification ===")
    for enum_name in ['userrole', 'meetingstatus', 'meetingfiletype', 'taskpriority', 'taskstatus']:
        r = conn.execute(text(f"SELECT enumlabel FROM pg_enum JOIN pg_type ON pg_enum.enumtypid = pg_type.oid WHERE pg_type.typname = '{enum_name}' ORDER BY enumsortorder"))
        print(f"  {enum_name}: {[row[0] for row in r]}")
    
    print("\n=== Existing rows ===")
    r = conn.execute(text("SELECT status, file_type FROM meetings"))
    for row in r:
        print(f"  meeting: status={row[0]}, file_type={row[1]}")
    
    r = conn.execute(text("SELECT role FROM users"))
    for row in r:
        print(f"  user role: {row[0]}")
