import type { Node } from "ts-morph";
import { relative } from "path";

export class ClassnoError extends Error {
  constructor(message: string, public readonly node: Node) {
    super(message);
  }

  print() {
    const filePath = relative(
      process.cwd(),
      this.node.getSourceFile().getFilePath(),
    );
    const line = this.node.getStartLineNumber();
    console.error(
      `${filePath}:${line}
        \x1B[31m${this.message}\x1B[39m`,
    );
  }

  printAndExit(): never {
    this.print();
    process.exit(1);
  }
}
