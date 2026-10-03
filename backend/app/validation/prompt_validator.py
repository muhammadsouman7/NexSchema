# app/validation/prompt_validator.py

import re
import logging
from dataclasses import dataclass

logger = logging.getLogger(__name__)

DB_KEYWORDS = {
    # Core DB terms
    "database", "schema", "table", "tables", "entity", "entities",
    "relational", "sql", "postgresql", "mysql", "sqlite", "nosql",
    "normalized", "foreign key", "primary key", "many-to-many", "one-to-many",
    "index", "migration", "query", "relation",

    # System/app types
    "system", "app", "application", "platform", "portal", "service",
    "management", "manager", "dashboard", "api", "backend", "microservice",
    "saas", "crm", "erp", "cms",

    # Domain nouns that imply a system
    "user", "users", "admin", "account", "accounts", "profile", "profiles",
    "customer", "customers", "client", "clients", "employee", "employees",
    "staff", "patient", "patients", "student", "students", "teacher",
    "doctor", "doctors", "nurse", "vendor", "supplier", "member", "members",

    # Business objects
    "order", "orders", "product", "products", "inventory", "invoice",
    "payment", "payments", "transaction", "transactions", "billing",
    "subscription", "booking", "bookings", "appointment", "appointments",
    "reservation", "reservations", "shipment", "delivery", "cart",
    "catalog", "listing", "listings",

    # Domain systems
    "hospital", "clinic", "school", "university", "college", "library",
    "ecommerce", "marketplace", "shop", "store", "warehouse", "hotel",
    "restaurant", "bank", "finance", "hr", "fleet", "vehicle", "course",
    "forum", "blog", "social", "chat", "messaging", "notification",
    "analytics", "report", "tracking", "workflow", "pipeline",

    # Auth/access
    "authentication", "authorization", "roles", "permissions", "rbac",
    "login", "signup", "session", "token",

    # Actions that imply a system
    "manage", "track", "record", "store", "assign", "schedule",
    "monitor", "generate", "create a db", "create a database",
    "design a db", "design a database", "build a db",
}

# Only block things that are CLEARLY not database requests
REJECTION_PATTERNS = [
    r"^\s*what\s+is\s+\d+\s*[\+\-\*\/x×]\s*\d+",     # "what is 2+2"
    r"^\s*\d+\s*[\+\-\*\/x×]\s*\d+",                   # "2+2" or "5*6"
    r"\btimes\s+table\s+of\s+\d+",                      # "times table of 6"
    r"\bmultiplication\s+table\s+of\b",                  # "multiplication table of"
    r"\bwrite\s+(me\s+)?(a\s+)?(poem|song|story|essay|joke|haiku|lyrics)\b",
    r"\btell\s+me\s+a\s+(joke|story|fun\s+fact)\b",
    r"\bwhat\s+is\s+the\s+(capital|population|currency|weather)\b",
    r"\bhow\s+(tall|old|far|fast|much|many|long)\s+is\b",
    r"\brecipe\s+for\b",
    r"\btranslate\s+.{1,40}\s+to\s+\w+",               # "translate X to French"
    r"^\s*(hi|hello|hey|yo|sup|good\s+(morning|evening|afternoon))\s*[!.,]?\s*$",
]


@dataclass
class PromptValidationResult:
    is_valid: bool
    reason: str = ""


def validate_prompt(prompt: str) -> PromptValidationResult:
    text = prompt.strip()
    text_lower = text.lower()

    # Length checks
    if len(text) < 10:
        return PromptValidationResult(
            is_valid=False,
            reason="Prompt is too short. Please describe your application in detail.",
        )

    if len(text) > 5000:
        return PromptValidationResult(
            is_valid=False,
            reason="Prompt exceeds 5000 characters. Please be more concise.",
        )

    # Hard rejection patterns — only truly obvious non-DB requests
    for pattern in REJECTION_PATTERNS:
        if re.search(pattern, text_lower, re.IGNORECASE):
            logger.warning(f"Prompt blocked by pattern: {pattern!r} | prompt: {text[:80]!r}")
            return PromptValidationResult(
                is_valid=False,
                reason=(
                    "NexSchema only generates relational database schemas. "
                    "Please describe an application or system you want to build a database for. "
                    "Example: 'A library management system with books, members, and borrowing records.'"
                ),
            )

    # Keyword check — how many DB-related terms appear
    matched_keywords = [kw for kw in DB_KEYWORDS if kw in text_lower]
    matched = len(matched_keywords)

    logger.info(f"Prompt validation — matched {matched} keywords: {matched_keywords[:5]} | prompt: {text[:80]!r}")

    # If ANY database/system keyword is present, allow it
    if matched >= 1:
        return PromptValidationResult(is_valid=True)

    # No keywords at all — reject with helpful message
    return PromptValidationResult(
        is_valid=False,
        reason=(
            "Your prompt doesn't appear to describe a database or system. "
            "NexSchema generates relational database schemas from application descriptions. "
            "Try: 'A library management system with books, members, loans, and fines.'"
        ),
    )