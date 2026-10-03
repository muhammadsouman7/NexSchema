from __future__ import annotations
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field, field_validator, model_validator


class ColumnType(str, Enum):
    INTEGER = "INTEGER"; BIGINT = "BIGINT"; SMALLINT = "SMALLINT"
    DECIMAL = "DECIMAL"; FLOAT = "FLOAT"; BOOLEAN = "BOOLEAN"
    VARCHAR = "VARCHAR"; TEXT = "TEXT"; CHAR = "CHAR"
    TIMESTAMP = "TIMESTAMP"; DATE = "DATE"; TIME = "TIME"
    TIMESTAMPTZ = "TIMESTAMPTZ"; UUID = "UUID"; JSONB = "JSONB"
    ARRAY = "ARRAY"


class RelationshipType(str, Enum):
    ONE_TO_ONE = "one_to_one"
    ONE_TO_MANY = "one_to_many"
    MANY_TO_MANY = "many_to_many"


class OnDeleteAction(str, Enum):
    CASCADE = "CASCADE"; SET_NULL = "SET NULL"
    RESTRICT = "RESTRICT"; NO_ACTION = "NO ACTION"
    SET_DEFAULT = "SET DEFAULT"


class ColumnDefinition(BaseModel):
    name: str = Field(..., min_length=1, max_length=63)
    type: ColumnType
    nullable: bool = True
    unique: bool = False
    default: Optional[str] = None
    length: Optional[int] = None
    precision: Optional[int] = None
    scale: Optional[int] = None
    check_constraint: Optional[str] = None
    comment: Optional[str] = None

    @field_validator("name")
    @classmethod
    def validate_column_name(cls, v):
        import re
        if not re.match(r"^[a-z][a-z0-9_]*$", v):
            raise ValueError(f"Column '{v}' must be lowercase snake_case")
        reserved = {"select","table","column","index","order","group","where","from"}
        if v.lower() in reserved:
            raise ValueError(f"'{v}' is a reserved SQL keyword")
        return v


class ForeignKeyDefinition(BaseModel):
    column: str
    references_table: str
    references_column: str = "id"
    on_delete: OnDeleteAction = OnDeleteAction.RESTRICT
    on_update: OnDeleteAction = OnDeleteAction.NO_ACTION
    constraint_name: Optional[str] = None


class IndexDefinition(BaseModel):
    name: str
    columns: list[str]
    unique: bool = False
    index_type: str = "BTREE"
    condition: Optional[str] = None


class TableDefinition(BaseModel):
    name: str = Field(..., min_length=1, max_length=63)
    columns: list[ColumnDefinition]
    primary_key: list[str] = Field(default_factory=list)
    foreign_keys: list[ForeignKeyDefinition] = Field(default_factory=list)
    indexes: list[IndexDefinition] = Field(default_factory=list)
    is_junction_table: bool = False
    comment: Optional[str] = None

    @field_validator("name")
    @classmethod
    def validate_table_name(cls, v):
        import re
        if not re.match(r"^[a-z][a-z0-9_]*$", v):
            raise ValueError(f"Table '{v}' must be lowercase snake_case")
        return v

    @model_validator(mode="after")
    def validate_pk_columns_exist(self):
        col_names = {c.name for c in self.columns}
        for pk in self.primary_key:
            if pk not in col_names:
                raise ValueError(f"PK column '{pk}' not in table '{self.name}'")
        return self

    def get_column(self, name: str):
        return next((c for c in self.columns if c.name == name), None)


class RelationshipDefinition(BaseModel):
    type: RelationshipType
    from_table: str
    to_table: str
    junction_table: Optional[str] = None
    description: Optional[str] = None


class DatabaseSchema(BaseModel):
    schema_name: str = "public"
    tables: list[TableDefinition]
    relationships: list[RelationshipDefinition] = Field(default_factory=list)
    target_dialect: str = "postgresql"
    version: str = "1.0.0"
    description: Optional[str] = None

    @model_validator(mode="after")
    def validate_fk_targets(self):
        table_names = {t.name for t in self.tables}
        for table in self.tables:
            for fk in table.foreign_keys:
                if fk.references_table not in table_names:
                    raise ValueError(
                        f"FK in '{table.name}' references unknown table '{fk.references_table}'"
                    )
        return self

    def get_table(self, name: str):
        return next((t for t in self.tables if t.name == name), None)
