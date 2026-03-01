"""
Tests for database client connection functionality
"""


class TestDatabaseConnection:
    """Test the database client connection functionality"""

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
