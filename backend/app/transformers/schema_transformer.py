import re
from app.models.ai_extraction import RawSchemaExtraction, RawTable, RawColumn
from app.models.schema_ir import (
    DatabaseSchema, TableDefinition, ColumnDefinition,
    ColumnType, ForeignKeyDefinition, RelationshipDefinition, RelationshipType,
)

TYPE_MAP = {
    "integer": ColumnType.INTEGER, "int": ColumnType.INTEGER,
    "bigint": ColumnType.BIGINT, "smallint": ColumnType.SMALLINT,
    "string": ColumnType.VARCHAR, "varchar": ColumnType.VARCHAR,
    "text": ColumnType.TEXT, "boolean": ColumnType.BOOLEAN, "bool": ColumnType.BOOLEAN,
    "timestamp": ColumnType.TIMESTAMPTZ, "timestamptz": ColumnType.TIMESTAMPTZ,
    "datetime": ColumnType.TIMESTAMPTZ, "date": ColumnType.DATE,
    "uuid": ColumnType.UUID, "decimal": ColumnType.DECIMAL,
    "float": ColumnType.FLOAT, "double": ColumnType.FLOAT,
    "number": ColumnType.DECIMAL, "json": ColumnType.JSONB, "jsonb": ColumnType.JSONB,
}

REL_MAP = {
    "one_to_one": RelationshipType.ONE_TO_ONE,
    "one_to_many": RelationshipType.ONE_TO_MANY,
    "many_to_one": RelationshipType.ONE_TO_MANY,
    "many_to_many": RelationshipType.MANY_TO_MANY,
}

RESERVED = {"select", "table", "column", "index", "order", "group", "where", "from"}


def _snake(name: str) -> str:
    n = re.sub(r"[^a-z0-9]+", "_", name.strip().lower()).strip("_")
    if not n or not n[0].isalpha():
        n = "c_" + n
    return n[:63]


def _col_name(name: str) -> str:
    n = _snake(name)
    return n + "_col" if n in RESERVED else n

class SchemaTransformer:
    def transform(self, extraction: RawSchemaExtraction, dialect: str = "postgresql") -> DatabaseSchema:
        for t in extraction.tables:
            t.name = _snake(t.name)
            for c in t.columns:
                c.name = _col_name(c.name)
        known = {t.name for t in extraction.tables}
        for t in extraction.tables:
            for c in t.columns:
                if c.references_table:
                    c.references_table = self._match_table(c.references_table, known)
                    if c.references_table is None:
                        c.is_foreign_key = False
        extraction.relationships = [
            r for r in extraction.relationships
            if self._match_table(r.from_table, known) and self._match_table(r.to_table, known)
        ]
        for r in extraction.relationships:
            r.from_table = self._match_table(r.from_table, known)
            r.to_table = self._match_table(r.to_table, known)
        tables = [self._transform_table(t) for t in extraction.tables]
        relationships = [self._transform_rel(r) for r in extraction.relationships]
        return DatabaseSchema(
            tables=tables, relationships=relationships,
            target_dialect=dialect, description=extraction.domain_context,
        )

    @staticmethod
    def _match_table(name, known):
        if not name:
            return None
        n = _snake(name)
        for cand in (n, n + "s", n + "es",
                     n[:-1] if n.endswith("s") else n,
                     n[:-3] + "y" if n.endswith("ies") else n):
            if cand in known:
                return cand
        return None

    def _transform_table(self, raw: RawTable) -> TableDefinition:
        columns, primary_keys, foreign_keys = [], [], []
        has_id = any(c.name == "id" for c in raw.columns)
        if not has_id:
            columns.append(ColumnDefinition(name="id", type=ColumnType.UUID, nullable=False))
            primary_keys.append("id")

        for rc in raw.columns:
            col = ColumnDefinition(
                name=rc.name,
                type=TYPE_MAP.get(rc.type_hint.lower(), ColumnType.TEXT),
                nullable=rc.nullable, unique=rc.unique, comment=rc.description,
            )
            columns.append(col)
            if rc.is_primary_key:
                primary_keys.append(rc.name)
            if rc.is_foreign_key and rc.references_table:
                foreign_keys.append(ForeignKeyDefinition(
                    column=rc.name, references_table=rc.references_table, references_column="id",
                ))

        col_names = {c.name for c in columns}
        for audit in [("created_at", ColumnType.TIMESTAMPTZ), ("updated_at", ColumnType.TIMESTAMPTZ)]:
            if audit[0] not in col_names:
                columns.append(ColumnDefinition(name=audit[0], type=audit[1], nullable=False))

        return TableDefinition(
            name=raw.name, columns=columns,
            primary_key=primary_keys or ["id"],
            foreign_keys=foreign_keys, comment=raw.purpose,
        )

    def _transform_rel(self, raw) -> RelationshipDefinition:
        return RelationshipDefinition(
            type=REL_MAP.get(raw.type.lower(), RelationshipType.ONE_TO_MANY),
            from_table=raw.from_table, to_table=raw.to_table,
        )
