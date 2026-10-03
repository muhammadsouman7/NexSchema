import asyncio
import json
import logging
from pathlib import Path
from typing import Optional

from groq import Groq, RateLimitError, APIError
from app.models.ai_extraction import RawSchemaExtraction, RawRelationship
from app.core.config import settings

logger = logging.getLogger(__name__)


class AIServiceError(RuntimeError):
    """Upstream LLM problem (rate limit, API down, truncated output)."""
    def __init__(self, message: str, status_code: int = 502):
        super().__init__(message)
        self.status_code = status_code


SYSTEM_PROMPT = (Path(__file__).parent / "prompts" / "system_prompt.txt").read_text()

TABLES_TEMPLATE = '''Application description:
{prompt}

PHASE 1 — Extract ONLY the tables and their columns.
Return ONLY valid JSON — no markdown, no explanation:
{{
  "tables": [
    {{
      "name": "snake_case_plural",
      "purpose": "why this table exists",
      "columns": [
        {{
          "name": "column_name",
          "type_hint": "UUID|INTEGER|VARCHAR|TEXT|BOOLEAN|TIMESTAMPTZ|DATE|DECIMAL|FLOAT|JSONB",
          "nullable": true,
          "unique": false,
          "is_primary_key": false,
          "is_foreign_key": false,
          "references_table": null,
          "description": "what this column stores"
        }}
      ],
      "suggested_indexes": []
    }}
  ],
  "domain_context": "one sentence describing the domain",
  "ambiguities": [],
  "assumptions": []
}}'''

RELATIONSHIPS_TEMPLATE = '''Given these database tables: {table_names}

PHASE 2 — Define ALL relationships between these tables.
Return ONLY valid JSON — no markdown, no explanation:
{{
  "relationships": [
    {{
      "from_table": "table_name",
      "to_table": "table_name",
      "type": "one_to_one|one_to_many|many_to_many",
      "reasoning": "brief explanation"
    }}
  ]
}}

Rules:
- type MUST be one of: one_to_one, one_to_many, many_to_many
- Cover ALL logical relationships between the tables
- For many_to_many, the junction table should already be in the tables list'''


class AIExtractionClient:
    def __init__(self):
        self.client = Groq(api_key=settings.GROQ_API_KEY)
        self.model = "openai/gpt-oss-120b"

    async def _call_json(self, system: str, user: str, max_retries: int, label: str) -> dict:
        last_error: Optional[str] = None
        for attempt in range(max_retries):
            content = user
            if last_error:
                content += f"\n\nFix this error from last attempt: {last_error}\nReturn only valid JSON."
            try:
                response = await asyncio.to_thread(
                    self.client.chat.completions.create,
                    model=self.model,
                    messages=[
                        {"role": "system", "content": system},
                        {"role": "user", "content": content},
                    ],
                    temperature=0.1,
                    max_tokens=8000,
                    reasoning_effort="low",
                    response_format={"type": "json_object"},
                )
                choice = response.choices[0]
                if choice.finish_reason == "length":
                    raise ValueError("Model output was cut off (token limit reached) - invalid JSON")
                return json.loads((choice.message.content or "").strip())

            except RateLimitError as e:
                wait = 10 * (attempt + 1)
                try:
                    wait = min(float(e.response.headers.get("retry-after", wait)), 30)
                except Exception:
                    pass
                logger.warning(f"{label} attempt {attempt + 1}: Groq rate limit, waiting {wait}s")
                last_error = "rate limit"
                if attempt == max_retries - 1:
                    raise AIServiceError(
                        "Groq rate limit reached. Wait about a minute and try again.", 429
                    ) from e
                await asyncio.sleep(wait)

            except APIError as e:
                logger.error(f"{label} Groq API error: {e}")
                raise AIServiceError(f"Groq API error: {e}", 502) from e

            except Exception as e:
                last_error = str(e)
                logger.warning(f"{label} attempt {attempt + 1} failed: {last_error}")

        raise AIServiceError(
            f"{label} failed after {max_retries} attempts. Last error: {last_error}", 502
        )

    async def extract_schema(self, user_prompt: str, max_retries: int = 3) -> RawSchemaExtraction:
        extraction = await self._extract_tables(user_prompt, max_retries)
        if extraction.tables:
            extraction.relationships = await self._extract_relationships(
                extraction.tables, max_retries
            )
        return extraction

    async def _extract_tables(self, user_prompt: str, max_retries: int) -> RawSchemaExtraction:
        parsed = await self._call_json(
            SYSTEM_PROMPT, TABLES_TEMPLATE.format(prompt=user_prompt),
            max_retries, "Phase 1 (tables)",
        )
        parsed.setdefault("relationships", [])
        parsed.setdefault("domain_context", "")
        parsed.setdefault("ambiguities", [])
        parsed.setdefault("assumptions", [])
        extraction = RawSchemaExtraction(**parsed)
        logger.info(f"Phase 1 OK: {len(extraction.tables)} tables")
        return extraction

    async def _extract_relationships(self, tables, max_retries: int) -> list[RawRelationship]:
        table_names = ", ".join(t.name for t in tables)
        try:
            parsed = await self._call_json(
                SYSTEM_PROMPT, RELATIONSHIPS_TEMPLATE.format(table_names=table_names),
                max_retries, "Phase 2 (relationships)",
            )
            rels = [RawRelationship(**r) for r in parsed.get("relationships", [])]
            logger.info(f"Phase 2 OK: {len(rels)} relationships")
            return rels
        except AIServiceError as e:
            if e.status_code == 429:
                raise
            logger.warning(f"Relationship extraction failed ({e}) - continuing with none")
            return []
        except Exception as e:
            logger.warning(f"Relationship parse failed ({e}) - continuing with none")
            return []