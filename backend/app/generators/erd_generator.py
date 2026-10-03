from app.models.schema_ir import DatabaseSchema, RelationshipType

REL_MERMAID = {
    RelationshipType.ONE_TO_ONE: "||--||",
    RelationshipType.ONE_TO_MANY: "||--o{",
    RelationshipType.MANY_TO_MANY: "}o--o{",
}

class ERDGenerator:
    def mermaid(self, schema: DatabaseSchema) -> str:
        lines = ["erDiagram"]
        for t in schema.tables:
            lines.append(f"    {t.name.upper()} {{")
            for col in t.columns:
                pk = "PK" if col.name in (t.primary_key or []) else ("FK" if any(fk.column == col.name for fk in t.foreign_keys) else "")
                lines.append(f"        {col.type.value} {col.name} {pk}".rstrip())
            lines.append("    }")
        for rel in schema.relationships:
            connector = REL_MERMAID.get(rel.type, "||--o{")
            label = rel.type.value.replace("_"," ")
            lines.append(f"    {rel.from_table.upper()} {connector} {rel.to_table.upper()} : \"{label}\"")
        return "\n".join(lines)

    def plantuml(self, schema: DatabaseSchema) -> str:
        lines = ["@startuml", "skinparam linetype ortho\n"]
        for t in schema.tables:
            lines.append(f"entity {t.name} {{")
            for col in t.columns:
                prefix = "* " if col.name in (t.primary_key or []) else "  "
                lines.append(f"  {prefix}{col.name}: {col.type.value}")
            lines.append("}\n")
        for rel in schema.relationships:
            lines.append(f"{rel.from_table} ||--o{{ {rel.to_table} : \"{rel.type.value}\"")
        lines.append("@enduml")
        return "\n".join(lines)
