from app.database.connection import engine
from sqlalchemy import text

with engine.connect() as conn:
    for ename in ['meetingstatus', 'meetingfiletype', 'taskpriority', 'taskstatus', 'userrole']:
        q = f"SELECT enumlabel FROM pg_enum JOIN pg_type ON pg_enum.enumtypid = pg_type.oid WHERE pg_type.typname = '{ename}'"
        r = conn.execute(text(q))
        vals = [row[0] for row in r]
        print(f"{ename}: {vals}")
    
    # Check actual values in meetings table
    r2 = conn.execute(text("SELECT status, file_type FROM meetings LIMIT 5"))
    rows = [(row[0], row[1]) for row in r2]
    print(f"\nMeetings rows (status, file_type): {rows}")
    
    # Check tasks
    r3 = conn.execute(text("SELECT priority, status FROM tasks LIMIT 5"))
    rows3 = [(row[0], row[1]) for row in r3]
    print(f"Tasks rows (priority, status): {rows3}")
