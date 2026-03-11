from datetime import datetime, timezone

def date_parser(date_str: str):

    if not date_str or not date_str.strip():
        return datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)

    try:
        date = datetime.strptime(date_str.strip(), "%Y-%m-%d")
        return date.replace(tzinfo=timezone.utc)

    except ValueError:
        raise ValueError("Date must be in YYYY-MM-DD format")
