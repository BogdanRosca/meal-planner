"""
Admin CLI for managing users.

Create a user (copies the starter recipes to them):
    python -m app.scripts.create_user --email someone@example.com
Set or reset an existing user's password:
    python -m app.scripts.create_user --email someone@example.com --set-password
"""
import argparse
import getpass
import sys

from ..auth import hash_password
from ..database_client import DatabaseClient

MIN_PASSWORD_LENGTH = 8


def prompt_password() -> str:
    password = getpass.getpass("Password: ")
    if len(password) < MIN_PASSWORD_LENGTH:
        sys.exit(f"Password must be at least {MIN_PASSWORD_LENGTH} characters")
    if getpass.getpass("Repeat password: ") != password:
        sys.exit("Passwords do not match")
    return password


def main() -> None:
    parser = argparse.ArgumentParser(description="Create a user or set their password")
    parser.add_argument("--email", required=True)
    parser.add_argument("--set-password", action="store_true",
                        help="update the password of an existing user instead of creating one")
    args = parser.parse_args()

    password_hash = hash_password(prompt_password())

    db_client = DatabaseClient()
    if not db_client.connect():
        sys.exit("Failed to connect to database")
    try:
        if args.set_password:
            if not db_client.set_user_password(args.email, password_hash):
                sys.exit(f"No user with email {args.email}")
            print(f"Password updated for {args.email.strip().lower()}")
        else:
            if db_client.get_user_by_email(args.email):
                sys.exit(f"User {args.email} already exists (use --set-password to change the password)")
            user = db_client.create_user(args.email, password_hash)
            print(f"Created user {user['email']} (id {user['id']})")
    finally:
        db_client.disconnect()


if __name__ == "__main__":
    main()
