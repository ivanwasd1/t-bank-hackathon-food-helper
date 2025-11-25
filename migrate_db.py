"""
Database migration script to add new columns to Menu table
"""
import sqlite3
from datetime import datetime

def migrate_database():
    """Add data and updated_at columns to menus table"""
    conn = sqlite3.connect('foodhelper.db')
    cursor = conn.cursor()
    
    try:
        # Check if columns already exist
        cursor.execute("PRAGMA table_info(menus)")
        columns = [column[1] for column in cursor.fetchall()]
        
        # Add 'data' column if it doesn't exist
        if 'data' not in columns:
            print("Adding 'data' column to menus table...")
            cursor.execute("ALTER TABLE menus ADD COLUMN data TEXT")
            print("✓ Added 'data' column")
        else:
            print("✓ 'data' column already exists")
        
        # Add 'updated_at' column if it doesn't exist
        if 'updated_at' not in columns:
            print("Adding 'updated_at' column to menus table...")
            cursor.execute(f"ALTER TABLE menus ADD COLUMN updated_at TIMESTAMP DEFAULT '{datetime.utcnow().isoformat()}'")
            print("✓ Added 'updated_at' column")
        else:
            print("✓ 'updated_at' column already exists")
        
        # Make start_date and end_date nullable
        print("Making start_date and end_date nullable...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS menus_new (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                name VARCHAR(200),
                start_date DATE,
                end_date DATE,
                data TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        """)
        
        # Copy data from old table to new table
        cursor.execute("""
            INSERT INTO menus_new (id, user_id, name, start_date, end_date, data, created_at, updated_at)
            SELECT id, user_id, name, start_date, end_date, 
                   CASE WHEN data IS NULL THEN '{}' ELSE data END,
                   created_at,
                   CASE WHEN updated_at IS NULL THEN created_at ELSE updated_at END
            FROM menus
        """)
        
        # Drop old table and rename new table
        cursor.execute("DROP TABLE menus")
        cursor.execute("ALTER TABLE menus_new RENAME TO menus")
        
        print("✓ Schema updated successfully")
        
        conn.commit()
        print("\n✅ Database migration completed successfully!")
        
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e).lower():
            print("✓ Columns already exist, no migration needed")
        else:
            print(f"❌ Error during migration: {e}")
            conn.rollback()
    except Exception as e:
        print(f"❌ Error during migration: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == '__main__':
    print("🔄 Starting database migration...")
    migrate_database()
