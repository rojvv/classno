import { readFileSync, writeFileSync } from "fs";
import {
  CallExpression,
  ImportDeclaration,
  Project,
  SourceFile,
  SyntaxKind,
} from "ts-morph";
import { render } from "stylus";
import { MODULE_NAME } from "./constants.js";
import { ClassnoError } from "./utilities.js";

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
    throw new ClassnoError("Missing argument(s)", call);
  }
  if (!args[0].isKind(SyntaxKind.StringLiteral)) {
    throw new ClassnoError("The first argument is not a string literal.", call);
  }
  if (!args[1].isKind(SyntaxKind.NoSubstitutionTemplateLiteral)) {
    throw new ClassnoError(
      "The second argument is either not template literal or has substitutions.",
      call,
    );
  }
  const className = args[0].getLiteralValue();
  if (className.trim().length == 0) {
    throw new ClassnoError("Empty argument", args[0]);
  }
  const def = args[1].getLiteralValue();
  if (def.trim().length == 0) {
    throw new ClassnoError("Empty argument", args[1]);
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

  let css: string;

  try {
    css = buildCSS(project.getSourceFiles());
  } catch (err) {
    if (err instanceof ClassnoError) {
      err.printAndExit();
    }

    throw err;
  }

  writeFileSync(config.out, css);
}
