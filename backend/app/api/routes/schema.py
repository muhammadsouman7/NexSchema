from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional
import uuid
import logging
from app.agents.schema_agent import SchemaAgent, AgentState
from app.generators.sql_generator import SQLGenerator
from app.generators.erd_generator import ERDGenerator

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/schemas", tags=["Schema Generation"])


class GenerateRequest(BaseModel):
    prompt: str = Field(..., min_length=20, max_length=5000, description="Describe your application in plain English")
    dialect: str = Field(default="postgresql", pattern="^(postgresql|mysql|sqlite)$")
    include_erd: bool = True
    include_migrations: bool = True


class ColumnOut(BaseModel):
    name: str; type: str; nullable: bool; unique: bool
    is_primary_key: bool; is_foreign_key: bool; comment: Optional[str]

class TableOut(BaseModel):
    name: str; columns: list[ColumnOut]
    comment: Optional[str]; is_junction_table: bool

class IssueOut(BaseModel):
    severity: str; code: str; message: str; suggestion: str

class GenerateResponse(BaseModel):
    request_id: str
    tables: list[TableOut]
    sql_files: dict[str, str]
    erd_mermaid: Optional[str]
    erd_plantuml: Optional[str]
    validation_warnings: list[IssueOut]
    ai_assumptions: list[str]
    ai_ambiguities: list[str]
    iterations_taken: int
    domain_context: str


@router.post("/generate", response_model=GenerateResponse)
async def generate_schema(req: GenerateRequest):
    agent = SchemaAgent()
    ctx = await agent.run(req.prompt, req.dialect)

    if ctx.state == AgentState.FAILED:
        logger.error(f"Generation failed after {ctx.iterations} steps: {ctx.errors}")

    if ctx.state == AgentState.REJECTED:
        raise HTTPException(
            status_code=400,
            detail={"message": ctx.rejection_reason, "code": "INVALID_PROMPT"},
        )

    if ctx.state == AgentState.FAILED:
        raise HTTPException(
            status_code=ctx.error_status,
            detail={
                "message": "Schema generation failed: " + (ctx.errors[-1][:300] if ctx.errors else "unknown error"),
                "errors": ctx.errors,
            },
        )

    schema = ctx.schema
    sql = SQLGenerator().generate(schema)
    erd = ERDGenerator()

    tables_out = [
        TableOut(
            name=t.name, comment=t.comment, is_junction_table=t.is_junction_table,
            columns=[
                ColumnOut(
                    name=c.name, type=c.type.value, nullable=c.nullable, unique=c.unique,
                    is_primary_key=c.name in (t.primary_key or []),
                    is_foreign_key=any(fk.column == c.name for fk in t.foreign_keys),
                    comment=c.comment,
                ) for c in t.columns
            ],
        ) for t in schema.tables
    ]

    warnings = [
        IssueOut(severity=i.severity.value, code=i.code, message=i.message, suggestion=i.suggestion)
        for i in (ctx.validation_result.warnings() if ctx.validation_result else [])
    ]

    return GenerateResponse(
        request_id=str(uuid.uuid4()),
        tables=tables_out,
        sql_files=sql if req.include_migrations else {"full_schema.sql": sql["full_schema.sql"]},
        erd_mermaid=erd.mermaid(schema) if req.include_erd else None,
        erd_plantuml=erd.plantuml(schema) if req.include_erd else None,
        validation_warnings=warnings,
        ai_assumptions=ctx.extraction.assumptions if ctx.extraction else [],
        ai_ambiguities=ctx.extraction.ambiguities if ctx.extraction else [],
        iterations_taken=ctx.iterations,
        domain_context=ctx.extraction.domain_context if ctx.extraction else "",
    )


@router.get("/health")
async def health():
    return {"status": "ok"}
