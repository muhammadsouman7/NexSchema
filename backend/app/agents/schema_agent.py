from dataclasses import dataclass, field
from enum import Enum
from typing import Optional
from app.ai.client import AIExtractionClient, AIServiceError
from app.models.ai_extraction import RawSchemaExtraction
from app.models.schema_ir import DatabaseSchema
from app.validation.schema_validator import SchemaValidator, ValidationResult
from app.validation.prompt_validator import validate_prompt
from app.inference.relationship_engine import RelationshipInferenceEngine
from app.transformers.schema_transformer import SchemaTransformer
import logging

logger = logging.getLogger(__name__)


class AgentState(str, Enum):
    EXTRACTING = "extracting"
    VALIDATING = "validating"
    REFINING   = "refining"
    COMPLETE   = "complete"
    FAILED     = "failed"
    REJECTED   = "rejected"   # New state for off-topic prompts


@dataclass
class AgentContext:
    original_prompt: str
    current_prompt: str
    dialect: str = "postgresql"
    extraction: Optional[RawSchemaExtraction] = None
    schema: Optional[DatabaseSchema] = None
    validation_result: Optional[ValidationResult] = None
    iterations: int = 0
    max_iterations: int = 12
    error_status: int = 422
    state: AgentState = AgentState.EXTRACTING
    errors: list = field(default_factory=list)
    rejection_reason: str = ""   # Human-readable message for the user


class SchemaAgent:
    def __init__(self):
        self.ai          = AIExtractionClient()
        self.validator   = SchemaValidator()
        self.inference   = RelationshipInferenceEngine()
        self.transformer = SchemaTransformer()

    async def run(self, prompt: str, dialect: str = "postgresql") -> AgentContext:
        ctx = AgentContext(
            original_prompt=prompt,
            current_prompt=prompt,
            dialect=dialect,
        )

        # ── Prompt guard — runs before ANY AI call ──────────────────────
        validation = validate_prompt(prompt)
        if not validation.is_valid:
            ctx.state = AgentState.REJECTED
            ctx.rejection_reason = validation.reason
            logger.info(f"Prompt rejected: {validation.reason}")
            return ctx
        # ───────────────────────────────────────────────────────────────

        while ctx.state not in (AgentState.COMPLETE, AgentState.FAILED, AgentState.REJECTED):
            if ctx.iterations >= ctx.max_iterations:
                ctx.state = AgentState.FAILED
                ctx.errors.append(f"Max iterations ({ctx.max_iterations}) reached")
                break
            ctx.iterations += 1
            ctx = await self._step(ctx)

        return ctx

    async def _step(self, ctx: AgentContext) -> AgentContext:
        if ctx.state == AgentState.EXTRACTING: return await self._extract(ctx)
        if ctx.state == AgentState.VALIDATING: return self._validate(ctx)
        if ctx.state == AgentState.REFINING:   return await self._refine(ctx)
        return ctx

    async def _extract(self, ctx):
        try:
            ctx.extraction = await self.ai.extract_schema(ctx.current_prompt)
            ctx.schema = self.transformer.transform(ctx.extraction, ctx.dialect)
            ctx.state = AgentState.VALIDATING
        except AIServiceError as e:
            logger.error(f"AI service error: {e}")
            ctx.errors.append(str(e))
            ctx.error_status = e.status_code
            ctx.state = AgentState.FAILED
        except Exception as e:
            logger.warning(f"Extraction/transform error (iteration {ctx.iterations}): {e}")
            ctx.errors.append(str(e))
            ctx.current_prompt = (
                f"{ctx.original_prompt}\n\n"
                f"Your previous answer was rejected: {str(e)[:400]}\n"
                "Use lowercase snake_case names, avoid SQL reserved words as column names, "
                "and make sure every references_table is one of the tables you define."
            )
            ctx.state = AgentState.EXTRACTING
        return ctx

    def _validate(self, ctx):
        if not ctx.schema:
            ctx.state = AgentState.FAILED
            return ctx
        ctx.schema = self.inference.infer(ctx.schema)
        ctx.validation_result = self.validator.validate(ctx.schema)
        ctx.state = AgentState.COMPLETE if ctx.validation_result.is_valid else AgentState.REFINING
        return ctx

    async def _refine(self, ctx):
        if not ctx.validation_result:
            ctx.state = AgentState.FAILED
            return ctx
        errors_text = "\n".join(
            f"- [{e.code}] {e.message}: {e.suggestion}"
            for e in ctx.validation_result.errors()
        )
        ctx.current_prompt = (
            f"{ctx.original_prompt}\n\n"
            f"Fix these validation errors:\n{errors_text}\n"
            "Return corrected JSON only."
        )
        ctx.state = AgentState.EXTRACTING
        return ctx