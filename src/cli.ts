import { readFileSync, writeFileSync } from "fs";
import {
  CallExpression,
  ImportDeclaration,
  Project,
  SourceFile,
  SyntaxKind,
  TaggedTemplateExpression,
} from "ts-morph";
import { render } from "stylus";
import chokidar from "chokidar";
import { MODULE_NAME } from "./constants";
import { ClassnoError } from "./utilities";

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

export function getStylus(
  expression: TaggedTemplateExpression,
): [string | null, string] {
  const template = expression.getTemplate();
  if (template.isKind(SyntaxKind.TemplateExpression)) {
    const spans = template.getTemplateSpans();
    if (spans.length > 1) {
      throw new ClassnoError("Invalid syntax.", expression);
    }

    const className = spans[0].getFirstChildIfKind(SyntaxKind.StringLiteral)
      ?.getLiteralText();
    if (className == undefined) {
      throw new ClassnoError("Expected a string literal.", expression);
    }

    if (className.length == 0) {
      throw new ClassnoError("Empty class name.", expression);
    }

    // TODO: check for invalid class names

    const stylus = spans[0].getLiteral().getLiteralText();
    if (stylus.length == 0) {
      throw new ClassnoError("Missing declaration.", expression);
    }

    return [className, stylus];
  } else {
    const stylus = template.getLiteralValue().trim();
    if (!stylus) {
      throw new ClassnoError("Empty declaration.", expression);
    }

    return [null, stylus];
  }
}

export function collectStylus(sourceFiles: SourceFile[]) {
  const definedClasses = new Set();
  const sources = new Array<[string | null, string]>();

  for (const sourceFile of sourceFiles) {
    const functionNames = getFunctionNames(sourceFile.getImportDeclarations());

    const expressions = sourceFile.getDescendantsOfKind(
      SyntaxKind.TaggedTemplateExpression,
    )
      .filter((v) => functionNames.includes(v.getTag().getText()));

    for (const expression of expressions) {
      const source = getStylus(expression);
      const className = source[0];

      sources.push(source);
      if (className != null) {
        if (definedClasses.has(className)) {
          console.warn(`${className} is defined more than once`);
        }
        definedClasses.add(className);
      }
    }
  }

  return sources.filter(([v]) => v == null).map(([v]) => v).join("\n") +
    sources.filter(([v]) => v != null)
      .map(([className, decls]) => `.${className} ${decls}`)
      .join("\n");
}

export function buildCSS(sourceFiles: SourceFile[]) {
  return render(collectStylus(sourceFiles));
}

interface Config {
  paths: readonly string[];
  out: string;
}
function build(
  config: Config,
  exitOnErr = true,
) {
  const project = new Project();

  project.addSourceFilesAtPaths(config.paths);

  let css: string;

  try {
    css = buildCSS(project.getSourceFiles());
  } catch (err) {
    if (err instanceof ClassnoError && exitOnErr) {
      err.printAndExit();
    }

    throw err;
  }

  writeFileSync(config.out, css);
}

function watch(config: Config, clear: boolean) {
  function rebuild() {
    if (clear) {
      console.clear();
    }

    let failed = false;

    try {
      const project = new Project();
      project.addSourceFilesAtPaths(config.paths);

      const css = buildCSS(project.getSourceFiles());
      writeFileSync(config.out, css);
    } catch (err) {
      if (err instanceof ClassnoError) {
        err.print();
      } else {
        console.error(err);
      }
      failed = true;
    }

    if (failed) {
      console.info("Failed to rebuild. Watching for changes...");
    } else {
      console.info("Rebuilt. Watching for changes...");
    }
  }

  rebuild();
  chokidar.watch(config.paths).on("all", rebuild);
}

export function main() {
  const config = JSON.parse(readFileSync(".classno").toString());

  if (process.argv.includes("--watch")) {
    watch(config, process.argv.includes("--clear"));
  } else {
    build(config);
  }
}
