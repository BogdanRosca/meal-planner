"""
Infrastructure tests for database setup and connectivity.

These tests verify that the database infrastructure is properly configured
and ready for the application to use. They test at the raw database level,
not through the application's DatabaseClient abstraction.

Purpose:
- Verify database connection works with environment variables
- Confirm required tables exist with correct schema
- Validate database setup before running functional tests
"""
import os
import pytest
import psycopg2
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()


class TestDatabaseInfrastructure:
    """Test database infrastructure setup and connectivity"""

    @pytest.fixture
    def db_connection(self):
        """Create a database connection for testing"""
        connection = psycopg2.connect(
            host=os.getenv("PGHOST"),
            port=os.getenv("PGPORT"),
            database=os.getenv("PGDATABASE"),
            user=os.getenv("POSTGRES_USER"),
            password=os.getenv("POSTGRES_PASSWORD")
        )
        yield connection
        connection.close()

    def test_database_connection(self, db_connection):
        """Test that we can connect to the database"""
        assert db_connection is not None

        # Test that the connection is working
        cursor = db_connection.cursor()
        cursor.execute("SELECT 1")
        result = cursor.fetchone()
        cursor.close()

        assert result[0] == 1

    def test_recipes_table_exists(self, db_connection):
        """Test that the recipes table exists"""
        cursor = db_connection.cursor()

        # Check if recipes table exists
        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'recipes'
            );
        """)

        table_exists = cursor.fetchone()[0]
        cursor.close()

        assert table_exists is True

    def test_recipes_table_schema(self, db_connection):
        """Test that the recipes table has the correct schema"""
        cursor = db_connection.cursor()

        # Get table schema
        cursor.execute("""
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'recipes' 
            AND table_schema = 'public'
            ORDER BY ordinal_position;
        """)

        columns = cursor.fetchall()
        cursor.close()

        # Expected schema after our migrations
        expected_columns = {
            'id': ('integer', 'NO'),
            'name': ('character varying', 'NO'),
            'category': ('character varying', 'YES'),
            'instructions': ('text', 'NO'),
            'prep_time': ('integer', 'YES'),
            'portions': ('integer', 'YES'),
            'common_ingredients': ('ARRAY', 'YES'),
            'main_ingredients': ('jsonb', 'YES')
        }

        # Convert to dict for easier checking
        actual_columns = {col[0]: (col[1], col[2]) for col in columns}

        # Verify all expected columns exist with correct types
        for col_name, (expected_type, expected_nullable) in expected_columns.items():
            assert col_name in actual_columns, f"Column {col_name} missing from recipes table"
            actual_type, actual_nullable = actual_columns[col_name]
            assert actual_type == expected_type, f"Column {col_name} has type {actual_type}, expected {expected_type}"
            assert actual_nullable == expected_nullable, f"Column {col_name} nullable={actual_nullable}, expected {expected_nullable}"
