export default function classno(arr: TemplateStringsArray): void;
export default function classno(
  arr: TemplateStringsArray,
  className: string,
): string;
export default function classno(arr: TemplateStringsArray, className?: string) {
  if (arr[0] != "" && arr.includes("")) {
    throw new Error("Invalid syntax");
  }

  if (arr.includes("")) {
    return className;
  }
}
