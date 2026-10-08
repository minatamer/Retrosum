import ts from "typescript";
import { builtinModules } from "node:module";
import path from "node:path";
const builtins = new Set(builtinModules.flatMap((name) => [name, name.replace(/^node:/u, "")]));
export function inspectBoundary(file, source) {
  const normalized = file.replaceAll("\\", "/");
  const shared = normalized.startsWith("packages/");
  const contracts = normalized.startsWith("packages/contracts/");
  const money = normalized.startsWith("packages/money/");
  const frontend = normalized.startsWith("apps/frontend/src/");
  const server =
    normalized.endsWith(".server.ts") || normalized.startsWith("apps/frontend/src/app/api/");
  const findings = [];
  let serverOnlyImported = false;
  const ast = ts.createSourceFile(
    file,
    source,
    ts.ScriptTarget.Latest,
    true,
    file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  const add = (node, message) =>
    findings.push({
      file,
      line: ast.getLineAndCharacterOfPosition(node.getStart(ast)).line + 1,
      message,
    });
  function checkImport(node, specifier) {
    if (shared && (builtins.has(specifier.replace(/^node:/u, "")) || specifier.startsWith("node:")))
      add(node, "Shared code cannot import Node built-ins.");
    if (contracts && !specifier.startsWith(".") && specifier !== "zod")
      add(node, "Contracts may import only Zod and their own modules.");
    if (money && !specifier.startsWith(".") && specifier !== "@retrosum/contracts")
      add(node, "Money may import only public contracts and its own modules.");
    if (specifier.includes("/src/") && specifier.startsWith("@retrosum/"))
      add(node, "Use public package exports, not another package's src.");
    if (specifier.startsWith(".")) {
      const target = path.posix.normalize(
        path.posix.join(path.posix.dirname(normalized), specifier),
      );
      const owner = normalized.split("/").slice(0, 2).join("/");
      if (!target.startsWith(owner + "/"))
        add(node, "Relative imports cannot cross workspace owners.");
      if (frontend && !server && (target.includes(".server") || target.includes("/server/")))
        add(node, "Browser-owned modules cannot import server modules.");
    }
    if (
      frontend &&
      (specifier.startsWith("@retrosum/backend") || specifier.includes("apps/backend"))
    )
      add(node, "Frontend cannot import backend implementation.");
    if (
      normalized.startsWith("apps/backend/") &&
      (specifier.startsWith("@retrosum/frontend") || specifier.includes("apps/frontend"))
    )
      add(node, "Backend cannot import frontend implementation.");
    if (frontend && !server && (specifier.startsWith("node:") || builtins.has(specifier)))
      add(node, "Browser-owned modules cannot import Node built-ins.");
  }
  function visit(node) {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      checkImport(node, node.moduleSpecifier.text);
      if (
        ts.isImportDeclaration(node) &&
        !node.importClause &&
        node.moduleSpecifier.text === "server-only"
      )
        serverOnlyImported = true;
    }
    if (
      ts.isCallExpression(node) &&
      (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
        (ts.isIdentifier(node.expression) && node.expression.text === "require"))
    ) {
      const first = node.arguments[0];
      if (first && ts.isStringLiteral(first)) checkImport(node, first.text);
      else add(node, "Dynamic module paths require an explicit reviewed adapter boundary.");
    }
    if (
      shared &&
      ts.isIdentifier(node) &&
      [
        "process",
        "Buffer",
        "fetch",
        "localStorage",
        "sessionStorage",
        "indexedDB",
        "globalThis",
        "global",
        "window",
        "document",
        "navigator",
        "location",
        "self",
        "setTimeout",
        "setInterval",
        "Worker",
        "WebSocket",
        "XMLHttpRequest",
      ].includes(node.text) &&
      !(ts.isPropertyAccessExpression(node.parent) && node.parent.name === node) &&
      !(ts.isPropertyAssignment(node.parent) && node.parent.name === node)
    )
      add(node, "Shared code cannot read platform or environment globals.");
    ts.forEachChild(node, visit);
  }
  visit(ast);
  if (frontend && normalized.endsWith(".server.ts") && !serverOnlyImported)
    findings.push({ file, line: 1, message: "Server module must declare server-only." });
  return findings;
}
