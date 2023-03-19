import { readFileSync, writeFileSync } from "fs";
import {
  CallExpression,
  ImportDeclaration,
  Project,
  SourceFile,
  SyntaxKind,
} from "ts-morph";
import { render } from "stylus";
import { MODULE_NAME } from "./constants";

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

export function getStylus(call: CallExpression): [string, string] {
  const args = call.getArguments();
  if (args.length != 2) {
    throw new Error(`Invalid args length: ${args.length}`);
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
  return [className, def];
}

export function collectStylus(sourceFiles: SourceFile[]) {
  const definedClasses = new Set();
  const sources = new Array<[string, string]>();

  for (const sourceFile of sourceFiles) {
    const functionNames = getFunctionNames(sourceFile.getImportDeclarations());

    const calls = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression)
      .filter((v) => functionNames.includes(v.getExpression().getText()));

    for (const call of calls) {
      const source = getStylus(call);
      const className = source[0];

      sources.push(source);
      if (definedClasses.has(className)) {
        console.warn(`${className} is defined more than once`);
      }
      definedClasses.add(className);
    }
  }

  return sources.map(([className, decls]) => `.${className} ${decls}`)
    .join("\n");
}

export function buildCSS(sourceFiles: SourceFile[]) {
  return render(collectStylus(sourceFiles));
}

export function main() {
  const config = JSON.parse(readFileSync(".classno").toString());

  const project = new Project();

  project.addSourceFilesAtPaths(config.paths);

  const css = buildCSS(project.getSourceFiles());

  writeFileSync(config.out, css);
}
