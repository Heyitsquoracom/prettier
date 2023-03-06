import isNonEmptyArray from "../../utils/is-non-empty-array.js";
import hasNewline from "../../utils/has-newline.js";
import isIgnored from "../utils/is-ignored.js";
import {
  line,
  hardline,
  join,
  breakParent,
  group,
} from "../../document/builders.js";
import { locEnd, hasSameLocStart } from "../loc.js";
import { isExportDeclaration } from "../utils/index.js";

function printClassMemberDecorators(path, options, print) {
  const { node } = path;
  return group([
    join(line, path.map(print, "decorators")),
    hasNewlineBetweenOrAfterDecorators(node, options) ? hardline : line,
  ]);
}

function printDecoratorsBeforeExport(path, options, print) {
  // Export declarations are responsible for printing any decorators
  // that logically apply to node.declaration.
  return [
    join(hardline, path.map(print, "declaration", "decorators")),
    hardline,
  ];
}

function printDecorators(path, options, print) {
  const { node, parent } = path;
  const { decorators } = node;

  if (
    !isNonEmptyArray(decorators) ||
    // If the parent node is an export declaration and the decorator
    // was written before the export, the export will be responsible
    // for printing the decorators.
    hasDecoratorsBeforeExport(parent) ||
    // Decorators already printed in ignored node
    isIgnored(path)
  ) {
    return;
  }

  const shouldBreak =
    node.type === "ClassExpression" ||
    node.type === "ClassDeclaration" ||
    hasNewlineBetweenOrAfterDecorators(node, options);

  return [
    path.key === "declaration" && isExportDeclaration(parent)
      ? hardline
      : shouldBreak
      ? breakParent
      : "",
    join(line, path.map(print, "decorators")),
    line,
  ];
}

function hasNewlineBetweenOrAfterDecorators(node, options) {
  return node.decorators.some((decorator) =>
    hasNewline(options.originalText, locEnd(decorator))
  );
}

function hasDecoratorsBeforeExport(node) {
  if (
    node.type !== "ExportDefaultDeclaration" &&
    node.type !== "ExportNamedDeclaration" &&
    node.type !== "DeclareExportDeclaration"
  ) {
    return false;
  }

  const decorators = node.declaration?.decorators;

  return isNonEmptyArray(decorators) && hasSameLocStart(node, decorators[0]);
}

export {
  printDecorators,
  printClassMemberDecorators,
  printDecoratorsBeforeExport,
  hasDecoratorsBeforeExport,
};
