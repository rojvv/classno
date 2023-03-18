import { ImportDeclaration, SourceFile, SyntaxKind } from "ts-morph";
import { MODULE_NAME } from "../lib/constants";

export function getFunctionNames(importDeclarations: ImportDeclaration[]) {
  importDeclarations = importDeclarations
    .filter((v) => v.getModuleSpecifier().getLiteralValue() == MODULE_NAME);

  const functionNames = new Array<string>();
  for (const importDeclaration of importDeclarations) {
    const defaultImport = importDeclaration.getDefaultImport();
    if (defaultImport) {
      functionNames.push(defaultImport.getText());
      continue;
    }

    const namedImports = importDeclaration.getNamedImports()
      .filter((v) => v.getNameNode().getText() == "default");
    for (const namedImport of namedImports) {
      functionNames.push(
        namedImport.getAliasNode()?.getText() ??
          namedImport.getNameNode().getText(),
      );
    }
  }

  return functionNames;
}

export function collectStylus(sourceFiles: SourceFile[]) {
  const definedClasses = new Set();
  const classDefinitions = new Array<[string, string]>();

  for (const sourceFile of sourceFiles) {
    const functionNames = getFunctionNames(sourceFile.getImportDeclarations());

    const calls = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression)
      .filter((v) => functionNames.includes(v.getExpression().getText()));

    for (const call of calls) {
      const args = call.getArguments();
      if (args.length != 2) {
        throw new Error(`Invalid args length: ${call.getText()}`);
      }
      if (!args[0].isKind(SyntaxKind.StringLiteral)) {
        throw new Error("First argument is not a string literal");
      }
      if (!args[1].isKind(SyntaxKind.NoSubstitutionTemplateLiteral)) {
        throw new Error(
          "Second argument is not a no substitution template literal",
        );
      }
      const className = args[0].getLiteralValue();
      if (className.trim().length == 0) {
        throw new Error("className is empty");
      }
      const def = args[1].getLiteralValue();
      if (def.trim().length == 0) {
        throw new Error("styl is empty");
      }
      classDefinitions.push([className, def]);
      if (definedClasses.has(className)) {
        console.warn(`${className} is defined more than once`);
      }
      definedClasses.add(className);
    }
  }

  return classDefinitions.map(([className, def]) => `.${className} ${def}`)
    .join("\n");
}
