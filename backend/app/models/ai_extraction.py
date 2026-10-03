from pydantic import BaseModel, Field
from typing import Optional


class RawColumn(BaseModel):
    name: str
    type_hint: str
    nullable: bool = True
    unique: bool = False
    is_primary_key: bool = False
    is_foreign_key: bool = False
    references_table: Optional[str] = None
    description: Optional[str] = None


class RawTable(BaseModel):
    name: str
    purpose: str = ""
    columns: list[RawColumn]
    suggested_indexes: list[str] = Field(default_factory=list)


class RawRelationship(BaseModel):
    from_table: str
    to_table: str
    type: str
    reasoning: str = ""


class RawSchemaExtraction(BaseModel):
    tables: list[RawTable]
    relationships: list[RawRelationship] = Field(default_factory=list)
    domain_context: str = ""
    ambiguities: list[str] = Field(default_factory=list)
    assumptions: list[str] = Field(default_factory=list)
