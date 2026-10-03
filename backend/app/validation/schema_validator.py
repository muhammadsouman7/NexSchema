from dataclasses import dataclass, field
from enum import Enum
from app.models.schema_ir import DatabaseSchema, RelationshipType


class Severity(str, Enum):
    ERROR = "ERROR"; WARNING = "WARNING"; INFO = "INFO"


@dataclass
class Issue:
    severity: Severity
    code: str
    message: str
    table: str = ""
    column: str = ""
    suggestion: str = ""


@dataclass
class ValidationResult:
    is_valid: bool
    issues: list = field(default_factory=list)
    def errors(self): return [i for i in self.issues if i.severity == Severity.ERROR]
    def warnings(self): return [i for i in self.issues if i.severity == Severity.WARNING]


class SchemaValidator:
    def validate(self, schema: DatabaseSchema) -> ValidationResult:
        issues = []
        issues += self._check_table_names(schema)
        issues += self._check_primary_keys(schema)
        issues += self._check_foreign_keys(schema)
        issues += self._check_circular_refs(schema)
        issues += self._check_m2m_junctions(schema)
        issues += self._check_audit_cols(schema)
        issues += self._check_duplicate_cols(schema)
        has_errors = any(i.severity == Severity.ERROR for i in issues)
        return ValidationResult(is_valid=not has_errors, issues=issues)

    def _check_table_names(self, schema):
        seen, issues = set(), []
        for t in schema.tables:
            if t.name in seen:
                issues.append(Issue(Severity.ERROR, "DUPLICATE_TABLE", f"Duplicate table: '{t.name}'", t.name))
            seen.add(t.name)
        return issues

    def _check_primary_keys(self, schema):
        issues = []
        for t in schema.tables:
            if not t.primary_key:
                issues.append(Issue(Severity.ERROR, "MISSING_PK", f"'{t.name}' has no primary key", t.name, suggestion="Add id UUID PK"))
            for pk in t.primary_key:
                col = t.get_column(pk)
                if col and col.nullable:
                    issues.append(Issue(Severity.ERROR, "NULLABLE_PK", f"PK '{pk}' in '{t.name}' must be NOT NULL", t.name, pk))
        return issues

    def _check_foreign_keys(self, schema):
        issues, table_map = [], {t.name: t for t in schema.tables}
        for t in schema.tables:
            for fk in t.foreign_keys:
                if fk.references_table not in table_map:
                    issues.append(Issue(Severity.ERROR, "FK_MISSING_TABLE", f"FK in '{t.name}.{fk.column}' references unknown '{fk.references_table}'", t.name, fk.column))
                    continue
                ref = table_map[fk.references_table]
                if not ref.get_column(fk.references_column):
                    issues.append(Issue(Severity.ERROR, "FK_MISSING_COL", f"FK target '{fk.references_table}.{fk.references_column}' not found", t.name))
                if not t.get_column(fk.column):
                    issues.append(Issue(Severity.ERROR, "FK_SRC_MISSING", f"FK source column '{fk.column}' not in '{t.name}'", t.name, fk.column))
        return issues

    def _check_circular_refs(self, schema):
        issues = []
        graph = {t.name: [fk.references_table for fk in t.foreign_keys] for t in schema.tables}
        visited, stack = set(), set()
        def dfs(n):
            visited.add(n); stack.add(n)
            for nb in graph.get(n, []):
                if nb not in visited:
                    if dfs(nb): return True
                elif nb in stack: return True
            stack.discard(n); return False
        for name in graph:
            if name not in visited and dfs(name):
                issues.append(Issue(Severity.WARNING, "CIRCULAR_FK", f"Circular FK detected near '{name}'", name, suggestion="Make one FK nullable"))
        return issues

    def _check_m2m_junctions(self, schema):
        issues, table_names = [], {t.name for t in schema.tables}
        for rel in schema.relationships:
            if rel.type == RelationshipType.MANY_TO_MANY:
                if not rel.junction_table:
                    issues.append(Issue(Severity.ERROR, "M2M_NO_JUNCTION", f"M2M '{rel.from_table}'<->'{rel.to_table}' has no junction table"))
                elif rel.junction_table not in table_names:
                    issues.append(Issue(Severity.ERROR, "M2M_JUNCTION_MISSING", f"Junction table '{rel.junction_table}' not found"))
        return issues

    def _check_audit_cols(self, schema):
        issues = []
        for t in schema.tables:
            if t.is_junction_table: continue
            names = {c.name for c in t.columns}
            missing = {"created_at","updated_at"} - names
            if missing:
                issues.append(Issue(Severity.WARNING, "MISSING_AUDIT", f"'{t.name}' missing: {', '.join(missing)}", t.name, suggestion="Add TIMESTAMPTZ NOT NULL DEFAULT NOW()"))
        return issues

    def _check_duplicate_cols(self, schema):
        issues = []
        for t in schema.tables:
            seen = set()
            for c in t.columns:
                if c.name in seen:
                    issues.append(Issue(Severity.ERROR, "DUPLICATE_COL", f"Duplicate column '{c.name}' in '{t.name}'", t.name, c.name))
                seen.add(c.name)
        return issues
