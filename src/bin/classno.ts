#!/usr/bin/env node
import { readFileSync, writeFileSync } from "fs";
import { render as render_ } from "stylus";
import { ImportDeclaration, Project, SyntaxKind } from "ts-morph";
import { MODULE_NAME } from "../lib/constants";

function getTriggers(importDeclarations: ImportDeclaration[]) {
  importDeclarations = importDeclarations
    .filter((v) => v.getModuleSpecifier().getText() == `"${MODULE_NAME}"`);

  const triggers = new Array<string>();
  for (const importDeclaration of importDeclarations) {
    const defaultImport = importDeclaration.getDefaultImport();
    if (defaultImport) {
      triggers.push(defaultImport.getText());
      continue;
    }

    const namedImports = importDeclaration.getNamedImports()
      .filter((v) => v.getNameNode().getText() == "default");
    for (const namedImport of namedImports) {
      triggers.push(
        namedImport.getAliasNode()?.getText() ??
          namedImport.getNameNode().getText(),
      );
    }
  }

  return triggers;
}

function getClasses(project: Project) {
  const sourceFiles = project.getSourceFiles();
  const definedClasses = new Set();
  const classDefinitions = new Array<[string, string]>();

  for (const sourceFile of sourceFiles) {
    const triggers = getTriggers(sourceFile.getImportDeclarations());

    const calls = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression)
      .filter((v) => triggers.includes(v.getExpression().getText()));

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
      if (className.length == 0) {
        throw new Error("className is empty");
      }
      const def = args[1].getLiteralValue();
      if (className.length == 0) {
        throw new Error("styl is empty");
      }
      classDefinitions.push([className, def]);
      if (definedClasses.has(className)) {
        console.warn(`${className} is defined more than once`);
      }
      definedClasses.add(className);
    }
  }

  return classDefinitions;
}

function render(classes: [string, string][]) {
  let css = "";
  for (const [className, def] of classes) {
    css += render_(`.${className} ${def}`);
  }
  return css;
}

const config = JSON.parse(readFileSync(".classno").toString());

const project = new Project();

project.addSourceFilesAtPaths(config.paths);

const classes = getClasses(project);

writeFileSync(config.out, render(classes));
