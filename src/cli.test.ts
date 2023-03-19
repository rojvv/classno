import { Project } from "ts-morph";
import test from "ava";
import { MODULE_NAME } from "./constants";
import { collectStylus, getFunctionNames } from "./cli";

function createSourceFile(sourceCode: string) {
  const project = new Project();
  return project.createSourceFile("test.ts", sourceCode);
}

test("getFunctionNames", (t) => {
  const sourceFile = createSourceFile(`
  import classno from "${MODULE_NAME}";
  import { default as classno2 } from "${MODULE_NAME}";
  import classno4 from "some-other-${MODULE_NAME}";
  import { default as classno5 } from "some-other-${MODULE_NAME}";
  `);
  const functionNames = getFunctionNames(sourceFile.getImportDeclarations());
  t.notDeepEqual(functionNames.length, 0);
  t.deepEqual(functionNames, ["classno", "classno2"]);
});

test("collectStylus", (t) => {
  const imports = `import classno from "${MODULE_NAME}";`;
  let sourceFile = createSourceFile(`
  ${imports}

  classno();
    `);
  t.throws(() => collectStylus([sourceFile]));

  sourceFile = createSourceFile(`
  ${imports}

  classno("someClassName");
    `);
  t.throws(() => collectStylus([sourceFile]));

  sourceFile = createSourceFile(`
  ${imports}

  const className = "someClassName";
  classno(className, \`
    color green
  \`);
    `);
  t.throws(() => collectStylus([sourceFile]));

  sourceFile = createSourceFile(`
  ${imports}

  const color = "green";
  classno("someClassName", \`
    color \${color}
  \`);
    `);
  t.throws(() => collectStylus([sourceFile]));

  sourceFile = createSourceFile(`
  ${imports}

  classno("", \`
    color green
  \`);
    `);
  t.throws(() => collectStylus([sourceFile]));

  sourceFile = createSourceFile(`
  ${imports}

  classno("someClassName", \`
    
  \`);
    `);
  t.throws(() => collectStylus([sourceFile]));

  sourceFile = createSourceFile(`
  ${imports}

  classno("someClassName", \`
    color red
  \`);
    `);
  t.notThrows(() => collectStylus([sourceFile]));
});
