"""
One-time migration: add missing columns to the users table.
Run from d:/Vibely/backend with: python migrate.py
"""
import sqlite3
from datetime import datetime

DB_PATH = "vibely.db"

con = sqlite3.connect(DB_PATH)
cur = con.cursor()

cur.execute("PRAGMA table_info(users)")
cols = [row[1] for row in cur.fetchall()]
print("Current columns:", cols)

if "is_online" not in cols:
    cur.execute("ALTER TABLE users ADD COLUMN is_online BOOLEAN DEFAULT 0")
    print("  Added: is_online")
else:
    print("  OK: is_online already exists")

if "last_seen" not in cols:
    # SQLite ALTER TABLE cannot use CURRENT_TIMESTAMP as default — use NULL then backfill
    cur.execute("ALTER TABLE users ADD COLUMN last_seen DATETIME")
    now_str = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
    cur.execute("UPDATE users SET last_seen = ? WHERE last_seen IS NULL", (now_str,))
    print("  Added: last_seen (backfilled with", now_str, ")")
else:
    print("  OK: last_seen already exists")

cur.execute("PRAGMA table_info(direct_messages)")
msg_cols = [row[1] for row in cur.fetchall()]
if "image_url" not in msg_cols:
    cur.execute("ALTER TABLE direct_messages ADD COLUMN image_url TEXT")
    print("  Added: image_url to direct_messages")
else:
    print("  OK: direct_messages.image_url already exists")

if "is_edited" not in msg_cols:
    cur.execute("ALTER TABLE direct_messages ADD COLUMN is_edited BOOLEAN DEFAULT 0")
    print("  Added: is_edited to direct_messages")
else:
    print("  OK: direct_messages.is_edited already exists")

if "edited_at" not in msg_cols:
    cur.execute("ALTER TABLE direct_messages ADD COLUMN edited_at DATETIME")
    print("  Added: edited_at to direct_messages")
else:
    print("  OK: direct_messages.edited_at already exists")

if "deleted_by_sender" not in msg_cols:
    cur.execute("ALTER TABLE direct_messages ADD COLUMN deleted_by_sender BOOLEAN DEFAULT 0")
    print("  Added: deleted_by_sender to direct_messages")
else:
    print("  OK: direct_messages.deleted_by_sender already exists")

if "deleted_by_receiver" not in msg_cols:
    cur.execute("ALTER TABLE direct_messages ADD COLUMN deleted_by_receiver BOOLEAN DEFAULT 0")
    print("  Added: deleted_by_receiver to direct_messages")
else:
    print("  OK: direct_messages.deleted_by_receiver already exists")

con.commit()
cur.execute("PRAGMA table_info(users)")
final_cols = [row[1] for row in cur.fetchall()]
print("Final columns:", final_cols)
cur.execute("PRAGMA table_info(direct_messages)")
final_msg_cols = [row[1] for row in cur.fetchall()]
print("Final direct_messages columns:", final_msg_cols)
con.close()
print("Migration complete.")
