from datetime import datetime, timezone

def date_parser(date_str: str):

    if not date_str or not date_str.strip():
        return datetime.now(timezone.utc)

    try:
        date = datetime.strptime(date_str.strip(), "%m-%d-%Y")
        return date.replace(tzinfo=timezone.utc)

    except ValueError:
        raise ValueError("Incorrect date format")
