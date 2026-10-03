from app.models.schema_ir import (
    DatabaseSchema, TableDefinition, ColumnDefinition, ForeignKeyDefinition,
    RelationshipDefinition, RelationshipType, ColumnType, OnDeleteAction, IndexDefinition,
)


class RelationshipInferenceEngine:
    def infer(self, schema: DatabaseSchema) -> DatabaseSchema:
        tables = {t.name: t for t in schema.tables}
        for rel in schema.relationships:
            if rel.type == RelationshipType.ONE_TO_MANY:
                tables = self._one_to_many(rel, tables)
            elif rel.type == RelationshipType.MANY_TO_MANY:
                tables = self._many_to_many(rel, tables)
            elif rel.type == RelationshipType.ONE_TO_ONE:
                tables = self._one_to_one(rel, tables)
        schema.tables = list(tables.values())
        return schema

    def _one_to_many(self, rel, tables):
        many = tables.get(rel.to_table)
        if not many: return tables
        fk_col = f"{self._singular(rel.from_table)}_id"
        if not many.get_column(fk_col):
            many.columns.append(ColumnDefinition(name=fk_col, type=ColumnType.UUID, nullable=False))
        if fk_col not in {fk.column for fk in many.foreign_keys}:
            many.foreign_keys.append(ForeignKeyDefinition(
                column=fk_col, references_table=rel.from_table,
                references_column="id", on_delete=OnDeleteAction.CASCADE,
            ))
        idx_name = f"idx_{many.name}_{fk_col}"
        if idx_name not in {i.name for i in many.indexes}:
            many.indexes.append(IndexDefinition(name=idx_name, columns=[fk_col]))
        tables[many.name] = many
        return tables

    def _many_to_many(self, rel, tables):
        jname = rel.junction_table or f"{self._singular(rel.from_table)}_{rel.to_table}"
        if jname in tables: return tables
        fs, ts = self._singular(rel.from_table), self._singular(rel.to_table)
        junction = TableDefinition(
            name=jname, is_junction_table=True,
            primary_key=[f"{fs}_id", f"{ts}_id"],
            columns=[
                ColumnDefinition(name=f"{fs}_id", type=ColumnType.UUID, nullable=False),
                ColumnDefinition(name=f"{ts}_id", type=ColumnType.UUID, nullable=False),
                ColumnDefinition(name="created_at", type=ColumnType.TIMESTAMPTZ, nullable=False),
            ],
            foreign_keys=[
                ForeignKeyDefinition(column=f"{fs}_id", references_table=rel.from_table, references_column="id", on_delete=OnDeleteAction.CASCADE),
                ForeignKeyDefinition(column=f"{ts}_id", references_table=rel.to_table, references_column="id", on_delete=OnDeleteAction.CASCADE),
            ],
            indexes=[
                IndexDefinition(name=f"idx_{jname}_{fs}_id", columns=[f"{fs}_id"]),
                IndexDefinition(name=f"idx_{jname}_{ts}_id", columns=[f"{ts}_id"]),
            ],
        )
        tables[jname] = junction
        rel.junction_table = jname
        return tables

    def _one_to_one(self, rel, tables):
        child = tables.get(rel.to_table)
        if not child: return tables
        fk_col = f"{self._singular(rel.from_table)}_id"
        if not child.get_column(fk_col):
            child.columns.append(ColumnDefinition(name=fk_col, type=ColumnType.UUID, nullable=False, unique=True))
        if fk_col not in {fk.column for fk in child.foreign_keys}:
            child.foreign_keys.append(ForeignKeyDefinition(
                column=fk_col, references_table=rel.from_table,
                references_column="id", on_delete=OnDeleteAction.CASCADE,
            ))
        tables[child.name] = child
        return tables

    @staticmethod
    def _singular(word: str) -> str:
        if word.endswith("ies"): return word[:-3] + "y"
        if word.endswith(("ses","xes")): return word[:-2]
        if word.endswith("s") and not word.endswith("ss"): return word[:-1]
        return word
