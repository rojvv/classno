# classno

> Use CSS in JS without messing with Babel or esbuild.

- [Introduction](#introduction)
- [Known Limitations](#known-limitations)
- [Installation](#installation)
  - [`npm`](#npm)
  - [`yarn`](#yarn)
  - [`pnpm`](#pnpm)
- [Setup](#setup)
  - [The `.classno` File](#the-classno-file)
  - [Importing the Output File](#importing-the-output-file)
  - [Extending Scripts](#extending-scripts)
- [Usage](#usage)
  - [Declaring a Class](#declaring-a-class)
  - [Using Stylus Syntax](#using-stylus-syntax)
  - [Conditional Styles](#conditional-styles)
- [PS](#ps)

## Introduction

classno is a CSS-in-JS library that doesn’t require you to have a custom Babel
config or to install an esbuild plugin, nor to hack your JSX runtime. In some
ways, it works like Tailwind.

1. Parses your TypeScript source files.
2. Collects the CSS.
3. Merges all of the CSS into one file.

## Known Limitations

- Only works with TypeScript/ESM source files.

## Installation

### `npm`

```shell
npm install -D classno
```

### `yarn`

```shell
yarn add -D classno
```

### `pnpm`

```shell
pnpm add -D classno
```

## Setup

### The `.classno` File

Create a `.classno` file in the root directory of your project with a content
similar to this:

```json
{
  "paths": ["src/**/*.ts", "src/**/*.tsx"],
  "out": "app/styles/main.css"
}
```

> The `paths` option could be modified to include your target source files. Same
> for the `out` option if you want to change where the CSS goes.

### Importing the Output File

Import the path you included in the `out` option to your app. It can be loaded
both as a module or from the head using a `<link />` tag.

### Extending Scripts

Extend the `scripts` option of your `package.json` in a way like the following.

```diff
    "scripts": {
+       "dev": "concurrently \"classno --watch\" \"your dev command\"" 
-       "dev": "your dev command"
+       "build": "classno && your build command" 
-       "build": "your build command"
    }
```

> If you’re using [`concurrently`](https://npm.im/concurrently), don’t forget to
> install it to your `devDependencies`.

## Usage

To use classno, import the default function exported from `classno`. It expects
a string literal as its first argument, and a template literal with no
substitution as its second argument.

The first argument should be a valid CSS class name, and the second argument
should be a valid CSS (or Stylus) block.

The function returns the passed class name so it can applied to components
without duplication. In the built CSS, the first argument (the class name) will
have the styles in the second argument (the CSS/Stylus block).

### Declaring a Class

```tsx
import classno from "classno";

const divClassName = classno(
  "my-component",
  `
    width: 100px;
    height: 100px;
    background-color: green;
  `,
);

export default function MyComponent() {
  return <div className={divClassName}></div>;
}
```

### Using Stylus Syntax

Like mentioned above, you can also use Stylus:

```tsx
const divClassName = classno(
  "my-component",
  `
    width: 100px;
    height: 100px;
    background-color: green;

    &:hover {
        opacity: 0.5;

        @media (prefers-color-scheme: dark) {
            & > p {
                text: blue;
            }
        }
    }
  `,
);
```

This also works:

```tsx
const divClassName = classno(
  "my-component",
  `
    width 100px
    height 100px
    background-color green

    &:hover
        opacity 0.5

        @media (prefers-color-scheme: dark)
            > p
                text blue
  `,
);
```

### Conditional Styles

Conditional styles can be applied like this:

```tsx
const dropdown = classno(
  "dropdown",
  `
    /* Your main styles here, perhaps some transition-duration? */
`,
);

const openDropdown = classno(
  "dropdown-open",
  `
   /* Conditional styles */
`,
);

const closedDropdown = classno(
  "dropdown-open",
  `
   /* Conditional styles */
`,
);

export default function Dropdown() {
  return (
    <div className={`${dropdown} ${open ? openDropdown : closedDropdown}`}>
    </div>
  );
}
```

## PS

The project is in its early stages, expect everything or nothing to change, and
know that I am currently not sure if it is worth investing more time in.
