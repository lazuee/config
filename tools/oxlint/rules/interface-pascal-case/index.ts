import { defineRule } from "@oxlint/plugins";
import type { Context, ESTree, FixFn } from "@oxlint/plugins";

const pascalCasePattern = /^[A-Z][A-Za-z0-9]*$/u;

export function toPascalCase(name: string): string {
  return name
    .replaceAll(/(?<lower>[a-z0-9])(?<upper>[A-Z])/gu, "$<lower> $<upper>")
    .split(/[\s_-]+/u)
    .filter((word) => word.length > 0)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("");
}

/** Exported interfaces may be referenced cross-file, which a per-file fix cannot cover */
function isExported(node: ESTree.TSInterfaceDeclaration): boolean {
  return node.parent?.type === "ExportNamedDeclaration";
}

/**
 * Renames the declaration and every in-file reference resolved to it, so the
 * fix never leaves a dangling use behind (merged declarations rename all
 * their defs). Returns `undefined` when the scope lookup cannot be trusted.
 */
function renameFix(
  context: Context,
  node: ESTree.TSInterfaceDeclaration,
  newName: string,
): FixFn | undefined {
  if (isExported(node)) return undefined;

  try {
    const [variable] = context.sourceCode.getDeclaredVariables(node);
    if (!variable) return undefined;

    return (fixer) => [
      ...variable.defs.map((definition) => fixer.replaceText(definition.name, newName)),
      ...variable.references.map((reference) => fixer.replaceText(reference.identifier, newName)),
    ];
  } catch {
    return undefined;
  }
}

export const interfacePascalCase = defineRule({
  meta: {
    fixable: "code" as const,
    messages: {
      interface: "Unexpected interface name {{name}}. Use {{newName}} instead",
      exported:
        "Unexpected interface name {{name}}. Use {{newName}} instead. It is exported, so rename its usages in every file manually; no autofix is available",
      pascalCase: "Interface name {{name}} must use PascalCase",
    },
    type: "suggestion" as const,
  },
  create(context: Context) {
    return {
      TSInterfaceDeclaration(node: ESTree.TSInterfaceDeclaration) {
        const { name } = node.id;
        if (pascalCasePattern.test(name)) {
          return;
        }

        const newName = toPascalCase(name);
        const renameable = newName !== name && pascalCasePattern.test(newName);
        const exported = renameable && isExported(node);
        const fixable = renameable && !exported;

        let messageId = "pascalCase";
        if (fixable) {
          messageId = "interface";
        } else if (exported) {
          messageId = "exported";
        }

        context.report({
          data: { name, newName },
          fix: fixable ? renameFix(context, node, newName) : undefined,
          messageId,
          node: node.id,
        });
      },
    };
  },
});
