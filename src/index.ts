export default function classno(arr: TemplateStringsArray | string[]): void;
export default function classno(
  arr: TemplateStringsArray | string[],
  className: string,
): string;
export default function classno(
  arr: TemplateStringsArray | string[],
  className?: string,
) {
  if (arr[0] != "" && arr.includes("")) {
    throw new Error("Invalid syntax");
  }

  if (arr.includes("")) {
    return className;
  }
}
