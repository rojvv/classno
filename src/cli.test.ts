import { Project } from "ts-morph";
import test from "ava";
import { MODULE_NAME } from "./constants";
import { buildCSS, collectStylus, getFunctionNames } from "./cli";

const imports = `import classno from "${MODULE_NAME}";`;

function createSourceFile(sourceCode: string) {
  const project = new Project();
  return project.createSourceFile("test.ts", sourceCode);
}

test("getFunctionNames", (t) => {
  const sourceFile = createSourceFile(`s
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
  function throws(exp: string) {
    let sourceFile = createSourceFile(`
  ${imports}

  ${exp}
    `);
    t.throws(() => collectStylus([sourceFile]));
  }

  function notThrows(exp: string) {
    let sourceFile = createSourceFile(`
  ${imports}

  ${exp}
    `);
    t.notThrows(() => collectStylus([sourceFile]));
  }

  throws("classno();");
  throws("classno`${''} ${''}`;");
  throws("classno`${a}`;");
  throws("classno`${''}`;");
  throws("classno`${'a'}`;");
  notThrows("classno`${'a'}\n\tcolor green`;");

  throws("classno``");
  notThrows("classno`html { scroll-behavior: smooth; }`");
});

test("buildCSS", (t) => {
  const sourceFile = createSourceFile(`
  ${imports}

  classno\`
  html
    scroll-smooth
  \`;

  classno\`"x = 1"\`;

  classno\`\${"y"} { color: green; }\`;
  `);

  t.notThrows(() => buildCSS([sourceFile]));
});
