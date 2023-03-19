import chalk from "chalk";
import type { Node } from "ts-morph";
import { relative } from "path";

export class ClassnoError extends Error {
  constructor(message: string, public readonly node: Node) {
    super(message);
  }

  printAndExit(): never {
    const filePath = relative(
      process.cwd(),
      this.node.getSourceFile().getFilePath(),
    );
    const line = this.node.getStartLineNumber();
    console.error(
      `${filePath}:${line}
        ${chalk.red(this.message)}`,
    );
    process.exit(1);
  }
}
