"""
Database client for the Meal Planner application.
Handles all database connections and operations.
"""
import os
import json
import psycopg2
from typing import Optional, List, Dict, Any
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()


class DatabaseClient:
    """Client for database operations"""
    
    def __init__(self, host: Optional[str] = None, port: Optional[str] = None, 
                 database: Optional[str] = None, user: Optional[str] = None, 
                 password: Optional[str] = None):
        """Initialize database client with connection parameters"""
        self.host = host or os.getenv("PGHOST")
        self.port = port or os.getenv("PGPORT")
        self.database = database or os.getenv("PGDATABASE")
        self.user = user or os.getenv("POSTGRES_USER")
        self.password = password or os.getenv("POSTGRES_PASSWORD")
        self._connection = None
    
    def connect(self):
        """Establish connection to the database"""
        try:
            self._connection = psycopg2.connect(
                host=self.host,
                port=self.port,
                database=self.database,
                user=self.user,
                password=self.password
            )
            return True
        except Exception as e:
            print(f"Error connecting to database: {e}")
            return False
    
    def disconnect(self):
        """Close database connection"""
        if self._connection:
            self._connection.close()
            self._connection = None
    
    def is_connected(self) -> bool:
        """Check if database connection is active"""
        if not self._connection:
            return False
        try:
            cursor = self._connection.cursor()
            cursor.execute("SELECT 1")
            cursor.close()
            return True
        except psycopg2.Error:
            return False
    
    def get_all_recipes(self) -> List[Dict[str, Any]]:
        """Get all recipes from the database"""
        if not self.is_connected():
            raise Exception("Not connected to database")
        
        cursor = self._connection.cursor()
        cursor.execute("""
            SELECT id, name, category, main_ingredients, common_ingredients, instructions, prep_time, portions, foto_url, video_url
            FROM recipes
            ORDER BY id
        """)
        
        recipes = []
        for row in cursor.fetchall():
            recipe = {
                'id': row[0],
                'name': row[1],
                'category': row[2],
                'main_ingredients': row[3],
                'common_ingredients': row[4],
                'instructions': row[5],
                'prep_time': row[6],
                'portions': row[7],
                'foto_url': row[8],
                'video_url': row[9]
            }
            recipes.append(recipe)
        
        cursor.close()
        return recipes
    
    def get_recipe_by_id(self, recipe_id: int) -> Optional[Dict[str, Any]]:
        """Get a specific recipe by ID from the database"""
        if not self.is_connected():
            raise Exception("Not connected to database")
        
        cursor = self._connection.cursor()
        cursor.execute("""
            SELECT id, name, category, main_ingredients, common_ingredients, instructions, prep_time, portions, foto_url, video_url
            FROM recipes
            WHERE id = %s
        """, (recipe_id,))
        
        row = cursor.fetchone()
        cursor.close()
        
        if not row:
            return None
        
        recipe = {
            'id': row[0],
            'name': row[1],
            'category': row[2],
            'main_ingredients': row[3],
            'common_ingredients': row[4],
            'instructions': row[5],
            'prep_time': row[6],
            'portions': row[7],
            'foto_url': row[8],
            'video_url': row[9]
        }
        
        return recipe
    
    def add_recipe(self, name: str, category: str, main_ingredients: List[Dict[str, Any]], 
                   common_ingredients: List[str], instructions: str, prep_time: int, portions: int, foto_url: str, video_url) -> Dict[str, Any]:
        """Add a new recipe to the database"""
        if not self.is_connected():
            raise Exception("Not connected to database")
        
        # Convert main_ingredients list of dicts to JSON
        main_ingredients_json = json.dumps(main_ingredients)
        
        cursor = self._connection.cursor()
        cursor.execute("""
            INSERT INTO recipes (name, category, main_ingredients, common_ingredients, instructions, prep_time, portions, foto_url, video_url)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id, name, category, main_ingredients, common_ingredients, instructions, prep_time, portions, foto_url, video_url
        """, (name, category, main_ingredients_json, common_ingredients, instructions, prep_time, portions, foto_url, video_url))
        
        # Fetch the inserted recipe
        row = cursor.fetchone()
        recipe = {
            'id': row[0],
            'name': row[1],
            'category': row[2],
            'main_ingredients': row[3],
            'common_ingredients': row[4],
            'instructions': row[5],
            'prep_time': row[6],
            'portions': row[7],
            'foto_url': row[8],
            'video_url': row[9]
        }
        
        # Commit the transaction
        self._connection.commit()
        cursor.close()
        return recipe
    
    def delete_recipe(self, recipe_id: int) -> bool:
        """Delete a recipe from the database by ID"""
        if not self.is_connected():
            raise Exception("Not connected to database")
        
        cursor = self._connection.cursor()
        
        # First check if the recipe exists
        cursor.execute("SELECT id FROM recipes WHERE id = %s", (recipe_id,))
        if not cursor.fetchone():
            cursor.close()
            return False
        
        # Delete the recipe
        cursor.execute("DELETE FROM recipes WHERE id = %s", (recipe_id,))
        
        # Commit the transaction
        self._connection.commit()
        rows_affected = cursor.rowcount
        cursor.close()
        
        return rows_affected > 0

    def update_recipe(self, recipe_id: int, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update a recipe in the database with partial data"""
        if not self.is_connected():
            raise Exception("Not connected to database")
        
        cursor = self._connection.cursor()
        
        # First check if the recipe exists
        cursor.execute("SELECT id FROM recipes WHERE id = %s", (recipe_id,))
        if not cursor.fetchone():
            cursor.close()
            return None
        
        # Build dynamic update query
        set_clauses = []
        values = []
        
        for field, value in updates.items():
            if field in ['name', 'category', 'instructions', 'prep_time', 'portions', 'foto_url']:
                set_clauses.append(f"{field} = %s")
                values.append(value)
            elif field == 'main_ingredients':
                # main_ingredients is stored as JSON
                set_clauses.append(f"{field} = %s")
                values.append(json.dumps(value))
            elif field == 'common_ingredients':
                # common_ingredients is stored as PostgreSQL array
                set_clauses.append(f"{field} = %s")
                values.append(value)
        
        if not set_clauses:
            cursor.close()
            return None
        
        # Add recipe_id to values for WHERE clause
        values.append(recipe_id)
        
        # Execute update query
        update_query = f"UPDATE recipes SET {', '.join(set_clauses)} WHERE id = %s"
        cursor.execute(update_query, values)
        
        # Get the updated recipe
        cursor.execute("""
            SELECT id, name, category, main_ingredients, common_ingredients, 
                   instructions, prep_time, portions, foto_url, video_url 
            FROM recipes WHERE id = %s
        """, (recipe_id,))
        
        row = cursor.fetchone()
        if not row:
            cursor.close()
            return None
        
        recipe = {
            'id': row[0],
            'name': row[1],
            'category': row[2],
            'main_ingredients': row[3],
            'common_ingredients': row[4],
            'instructions': row[5],
            'prep_time': row[6],
            'portions': row[7],
            'foto_url': row[8],
            'video_url': row[9]
        }
        
        # Commit the transaction
        self._connection.commit()
        cursor.close()
        return recipe
