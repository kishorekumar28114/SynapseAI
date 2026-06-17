import random
import string


def generate_username(full_name: str, existing_usernames: set) -> str:
    """
    Generate a username from full name.
    Example: 'Alice Johnson' → 'alice.johnson' or 'alice.johnson1'
    """
    parts = full_name.lower().split()
    if len(parts) >= 2:
        base = f"{parts[0]}.{parts[-1]}"
    else:
        base = parts[0]

    # Remove non-alphanumeric except dot
    base = "".join(c for c in base if c.isalnum() or c == ".")

    username = base
    counter = 1
    while username in existing_usernames:
        username = f"{base}{counter}"
        counter += 1

    return username


def generate_temp_password(length: int = 12) -> str:
    """
    Generate a secure temporary password.
    Contains uppercase, lowercase, digits, and special chars.
    """
    chars = string.ascii_letters + string.digits + "!@#$%"
    while True:
        password = "".join(random.choices(chars, k=length))
        # Ensure it has at least one of each type
        if (
            any(c.isupper() for c in password)
            and any(c.islower() for c in password)
            and any(c.isdigit() for c in password)
            and any(c in "!@#$%" for c in password)
        ):
            return password
