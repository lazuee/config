// oxlint-disable eqeqeq no-eq-null
import { defineRule } from "@oxlint/plugins";
import type { Context, ESTree, Fixer } from "@oxlint/plugins";

/**
 * Removes the `accessibility` keyword plus the whitespace after it. Only used
 * where dropping the keyword is the whole fix (`public`, which is the default);
 * `private`/`protected` also need a `#` rename, so they stay manual
 */
/**
 * Search window for the accessibility keyword. Decorators and other modifiers
 * can precede it, so the keyword is located in the source rather than assumed
 * at `range[0]`
 */
function findAccessibilityRange(
  context: Context,
  node: ESTree.PropertyDefinition | ESTree.MethodDefinition,
  accessibility: string,
): [number, number] {
  const text = context.sourceCode.text.slice(node.range[0]);
  const offset = text.search(new RegExp(`\\b${accessibility}\\b`, "u"));
  const start = node.range[0] + Math.max(offset, 0);

  return [start, start + accessibility.length];
}

function removeAccessibilityFix(
  context: Context,
  node: ESTree.PropertyDefinition | ESTree.MethodDefinition,
) {
  const { accessibility } = node;

  // Callers already gate on `public`, so this is only a type narrowing aid
  if (!accessibility) return;

  const [start, end] = findAccessibilityRange(context, node, accessibility);
  // Eat one following space so `public x` becomes `x`, not ` x`
  const trailing = context.sourceCode.text.charAt(end) === " " ? end + 1 : end;

  return (fixer: Fixer) => fixer.replaceTextRange([start, trailing], "");
}

export const noTypescriptAccessibility = defineRule({
  meta: {
    fixable: "code" as const,
    type: "problem",
  },
  create(context: Context) {
    return {
      PropertyDefinition(node: ESTree.PropertyDefinition) {
        if (node.accessibility == null) {
          return;
        }

        context.report({
          fix: node.accessibility === "public" ? removeAccessibilityFix(context, node) : undefined,
          message: "Use native class fields: omit 'public' and use '#private' for private state.",
          node,
        });
      },
      MethodDefinition(node: ESTree.MethodDefinition) {
        if (node.accessibility == null) {
          return;
        }

        if (node.kind !== "constructor") {
          context.report({
            node,
            fix:
              node.accessibility === "public" ? removeAccessibilityFix(context, node) : undefined,
            message:
              "Use native methods: omit 'public'; for private behavior use '#private' fields/methods.",
          });
          return;
        }

        if (node.accessibility === "public") {
          context.report({
            fix: removeAccessibilityFix(context, node),
            message: "Omit 'public' on constructors; it's the default.",
            node,
          });
        }
      },
      TSParameterProperty(node: ESTree.TSParameterProperty) {
        if (node.accessibility == null) {
          return;
        }

        context.report({
          node,
          message:
            "Avoid TS parameter properties; declare fields explicitly and use '#private' when needed.",
        });
      },
    };
  },
});
