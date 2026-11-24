"""
Tests for database client connection functionality
"""
import pytest


class TestDatabaseConnection:
    """Test the database client connection functionality"""

    @pytest.mark.test_id("3f55d13e-133f-47bf-ae75-59e0ff71f2dd")
    def test_client_connection(self, db_client):
        """Test that the client can connect to the database"""
        # Test connection
        success = db_client.connect()
        assert success is True

        # Test is_connected method
        assert db_client.is_connected() is True

        # Test disconnection
        db_client.disconnect()
        assert db_client.is_connected() is False
