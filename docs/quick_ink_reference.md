# Ink, @inkjs/ui, and ink-table: The Complete Guide & API Reference

This document provides a comprehensive guide and API reference for building interactive command-line interfaces using Ink, the `@inkjs/ui` component library, and `ink-table`. The information is synthesized from the official documentation and example files.

## 1. Introduction

### What is Ink?
Ink is a powerful library that allows you to use React to build rich, interactive command-line applications. Instead of rendering to a DOM in a browser, Ink renders to a terminal, giving you the ability to use familiar React concepts like components, state, and props to create complex and responsive CLI UIs.

### What is @inkjs/ui?
`@inkjs/ui` is a dedicated component library built for Ink. It provides a set of pre-built, high-quality UI components that make it easy to create beautiful and user-friendly CLIs without having to build common elements from scratch.

### What is ink-table?
`ink-table` is a separate component for displaying tabular data in Ink. It offers a simple way to render tables from data arrays and provides options for customization.

## 2. Getting Started

### Installation
First, you need to add the necessary packages to your project.

```bash
npm install ink @inkjs/ui ink-table react
```

### Basic Example
Here is a simple "Hello, World" application to demonstrate the basic structure of an Ink app.

```tsx
// my-cli.tsx
import React from 'react';
import {render, Text, Box} from 'ink';

function App() {
	return (
		<Box borderStyle="round" padding={2}>
			<Text>Hello, World!</Text>
		</Box>
	);
}

render(<App />);
```
To run this, you would execute it with a runtime like `bun` or `tsx`:
```bash
bun run my-cli.tsx
```

## 3. Core Concepts

### Component-Based UI
Just like in web development with React, your entire CLI UI is built from components. You can create your own components or use the ones provided by `@inkjs/ui` and other libraries.

### Layout with `<Box>`
Layout is typically handled using the `<Box>` component, which provides a Flexbox-like API for alignment and spacing. You can control the direction, alignment, and justification of its children.

**Example of Border Styles:**
```tsx
<Box>
    <Box borderStyle="single" marginRight={2}><Text>single</Text></Box>
    <Box borderStyle="double" marginRight={2}><Text>double</Text></Box>
    <Box borderStyle="round" marginRight={2}><Text>round</Text></Box>
    <Box borderStyle="bold"><Text>bold</Text></Box>
</Box>
```

### State Management
You can use React hooks like `useState` and `useEffect` to manage the state of your application. This is essential for creating dynamic and interactive CLIs that respond to user input or other events.

### Uncontrolled Components & User Input
Many components in `@inkjs/ui` are **uncontrolled**. This means they manage their own internal state. You interact with them by providing callbacks. The two most common patterns are:
- **`onChange(value)`**: A callback that fires every time the component's value changes (e.g., as a user types in a text input).
- **`onSubmit(value)`**: A callback that fires when the user signals completion, usually by pressing the <kbd>Enter</kbd> key.

### Static vs. Dynamic Rendering with `<Static>`
The `<Static>` component is a performance optimization. It's used to render a list of items that will not change after they have been rendered. This prevents Ink from re-rendering them on every update, which is useful for things like logs or completed task lists.

## 4. Core Ink API

This section covers the fundamental hooks and components provided by the core `ink` library.

---

### `<Box>`
The fundamental building block for layouts. It behaves like a Flexbox container.

**Props:**
- `flexDirection` ('row' | 'column' | 'row-reverse' | 'column-reverse'): The direction of the main axis.
- `justifyContent` ('flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly'): Alignment along the main axis.
- `alignItems` ('flex-start' | 'flex-end' | 'center' | 'stretch'): Alignment along the cross axis.
- `padding`, `paddingX`, `paddingY`, `paddingTop`, `paddingBottom`, `paddingLeft`, `paddingRight`: Spacing inside the box.
- `margin`, `marginX`, `marginY`, `marginTop`, `marginBottom`, `marginLeft`, `marginRight`: Spacing outside the box.
- `borderStyle` ('single' | 'double' | 'round' | 'bold' | 'singleDouble' | 'doubleSingle' | 'classic'): The style of the border.
- `width`, `height`: The dimensions of the box.

---

### `<Text>`
Used to render text.

**Props:**
- `color` (string): The color of the text (e.g., 'green', '#ff0000').
- `backgroundColor` (string): The background color of the text.
- `bold` (boolean): Make the text bold.
- `italic` (boolean): Make the text italic.
- `underline` (boolean): Underline the text.
- `dimColor` (boolean): Dim the color of the text.

---

### `useInput()`
A hook to handle user input from the keyboard.

**Callback:** `(input, key) => {}`
- `input` (string): The character that was pressed.
- `key` (object): An object with boolean flags for special keys (e.g., `key.leftArrow`, `key.return`).

---

### `useApp()`
A hook that provides access to the application instance.

**Returns:** `{ exit: (error?: Error) => void }`
- `exit`: A function to exit the application.

---

### `useFocusManager()`
A hook to manage focus between components.

**Returns:** `{ focus: (id: string) => void, focusNext: () => void, focusPrevious: () => void }`
- `focus`: Focus a component with a specific `id`.
- `focusNext`: Focus the next focusable component.
- `focusPrevious`: Focus the previous focusable component.

---

### `useFocus()`
A hook that allows a component to know if it's focused.

**Parameters:** `{ id?: string }`
- `id`: An optional ID to enable programmatic focusing.

**Returns:** `{ isFocused: boolean }`
- `isFocused`: `true` if the component is currently focused.

---

### `useStdout()` and `useStderr()`
Hooks to write directly to the standard output and standard error streams.

**Returns:** `{ write: (data: string) => void, stdout?: NodeJS.WriteStream }`
- `write`: A function to write to the stream.
- `stdout`: The raw stream object, which contains properties like `columns` and `rows`.

---

### `<Suspense>`
React's Suspense component can be used with Ink to handle asynchronous operations, showing a fallback UI while data is loading.

## 5. `@inkjs/ui` Component Reference

This section details each component available in `@inkjs/ui`.

---

### Alert
Used to focus a user's attention on an important message.

**Props:**
- `children` (ReactNode): The message to display.
- `variant` ('info' | 'success' | 'error' | 'warning'): Determines the color and icon of the alert.
- `title` (string, optional): A title to show above the message.

---

### Badge
Indicates the status of an item.

**Props:**
- `children` (ReactNode): The label for the badge.
- `color` (string): Any color supported by Ink's `<Text>` component.

---

### ConfirmInput
Shows a "Y/n" prompt to confirm or cancel an action.

**Props:**
- `isDisabled` (boolean, default: `false`): If true, user input is ignored.
- `onConfirm` (Function): Callback to run when the user confirms.
- `onCancel` (Function): Callback to run when the user cancels.

---

### EmailInput
A text input specialized for emails, with domain autocompletion.

**Props:**
- `placeholder` (string): Text to display when the input is empty.
- `onChange(value: string)` (Function): Callback when the value changes.
- `onSubmit(value: string)` (Function): Callback when <kbd>Enter</kbd> is pressed.

---

### MultiSelect
A list where the user can select multiple options.

**Props:**
- `options` (Array<{ label: string; value: string; }>): The list of options.
- `onChange(values: string[])` (Function): Callback when the selection changes.
- `onSubmit(values: string[])` (Function): Callback when the user presses <kbd>Enter</kbd>.

---

### OrderedList and UnorderedList
Displays a numbered or bulleted list of items.

**Props:**
- `children` (ReactNode): Should consist of `<OrderedList.Item>` or `<UnorderedList.Item>` components.

---

### PasswordInput
A text input that masks the user's entry.

**Props:**
- `placeholder` (string): Text to display when the input is empty.
- `onChange(value: string)` (Function): Callback when the value changes.
- `onSubmit(value: string)` (Function): Callback when <kbd>Enter</kbd> is pressed.

---

### ProgressBar
Displays a progress bar.

**Props:**
- `value` (number): The progress percentage (from 0 to 100).

---

### Select
A list where the user can select a single option.

**Props:**
- `options` (Array<{ label: string; value: string; }>): The list of options.
- `onChange(value: string)` (Function): Callback when the selected option changes.

---

### Spinner
An animated spinner to indicate that a process is running.

**Props:**
- `label` (string, optional): Text to display next to the spinner.

---

### StatusMessage
Similar to `Alert`, but designed for longer status explanations.

**Props:**
- `children` (ReactNode): The message to display.
- `variant` ('info' | 'success' | 'error' | 'warning'): Determines the color of the message.

---

### TextInput
A general-purpose single-line text input field.

**Props:**
- `placeholder` (string): Text to display when the input is empty.
- `suggestions` (string[], optional): A list of strings for autocompletion.
- `onChange(value: string)` (Function): Callback when the value changes.
- `onSubmit(value: string)` (Function): Callback when <kbd>Enter</kbd> is pressed.

## 6. `ink-table` Component Reference

---

### Table
Renders a table from an array of data.

**Props:**
- `data` (Array<object>): An array of objects to render as rows.
- `columns` (Array<string>, optional): An array of keys to display as columns. If omitted, all keys are used.
- `padding` (number, optional): The padding between cells.
- `header` (Component, optional): A custom component to render the table header.
- `cell` (Component, optional): A custom component to render each cell.
- `skeleton` (Component, optional): A custom component to render while data is loading.

**Usage:**
```tsx
import Table from 'ink-table';

const data = [
  { name: 'John Doe', email: 'john@example.com' },
  { name: 'Jane Doe', email: 'jane@example.com' },
];

<Table data={data} />
```

## 7. Advanced Patterns

### Focus Management
When you have multiple input components, you must manage which one is active. The common pattern is to use a state variable to track the active input and pass the `isDisabled` prop to all other inputs. You can use `useFocusManager` to programmatically change focus.

**Example:**
```tsx
import React, {useState} from 'react';
import {render, Box} from 'ink';
import {TextInput} from '@inkjs/ui';

function App() {
	const [activeInput, setActiveInput] = useState('name');
	const [name, setName] = useState('');
	const [surname, setSurname] = useState('');

	return (
		<Box flexDirection="column" gap={1}>
			<TextInput
				isDisabled={activeInput !== 'name'}
				placeholder="Enter your name..."
				onChange={setName}
				onSubmit={() => setActiveInput('surname')}
			/>
			<TextInput
				isDisabled={activeInput !== 'surname'}
				placeholder="Enter your surname..."
				onChange={setSurname}
				onSubmit={() => setActiveInput('none')}
			/>
		</Box>
	);
}

render(<App />);
```

### Handling Subprocesses
You can spawn child processes and display their output in your Ink application. This is useful for creating front-ends for other command-line tools.

**Example:**
```tsx
import childProcess from 'node:child_process';
import React, {useState, useEffect} from 'react';
import {render, Text} from 'ink';

function SubprocessOutput() {
	const [output, setOutput] = useState('');

	useEffect(() => {
		const subProcess = childProcess.spawn('ls', ['-la']);
		subProcess.stdout.on('data', data => setOutput(data.toString()));
	}, []);

	return <Text>{output}</Text>;
}

render(<SubprocessOutput />);
```

### Autocomplete with `TextInput` and `Select`
You can create a powerful autocomplete experience by combining a `TextInput` to capture user input with a `Select` to display filtered options.

**Example:**
```tsx
import React, {useMemo, useState} from 'react';
import {render, Box, Text} from 'ink';
import {TextInput, Select} from '@inkjs/ui';

function AutocompleteExample() {
	const [filterText, setFilterText] = useState('');
	const [value, setValue] = useState<string | undefined>();

	const allOptions = [
		{label: 'Red', value: 'red'},
		{label: 'Green', value: 'green'},
		{label: 'Yellow', value: 'yellow'},
		{label: 'Blue', value: 'blue'},
	];

	const filteredOptions = useMemo(() => {
		return allOptions.filter(option => option.label.includes(filterText));
	}, [filterText]);

	return (
		<Box flexDirection="column" gap={1}>
			{!value ? (
				<>
					<TextInput value={filterText} onChange={setFilterText} />
					<Select
						highlightText={filterText}
						options={filteredOptions}
						onChange={setValue}
					/>
				</>
			) : (
				<Text>You've selected {value}</Text>
			)}
		</Box>
	);
}

render(<AutocompleteExample />);
```

## 8. Complete Documentation Index

This repository contains comprehensive Ink documentation organized as follows:

### Core Ink Library
- **Main Reference**: `/docs/quick_ink_reference.md` (this file)
- **Examples Directory**: `/docs/ink/examples/`
  - `borders/` - Different border styles for Box component
  - `counter/` - State management and re-rendering example
  - `jest/` - Testing Ink components with Jest
  - `justify-content/` - Layout alignment examples
  - `static/` - Using the Static component for performance
  - `subprocess-output/` - Capturing and displaying subprocess output
  - `suspense/` - React Suspense with async data loading
  - `table/` - Basic table rendering (without ink-table)
  - `use-focus/` - Focus management between components
  - `use-focus-with-id/` - Programmatic focus control
  - `use-input/` - Keyboard input handling
  - `use-stderr/` - Writing to stderr stream
  - `use-stdout/` - Direct stdout manipulation

### @inkjs/ui Component Library
- **Documentation Directory**: `/docs/ink-ui/docs/`
  - `alert.md` - Alert component for important messages
  - `badge.md` - Status indicators and labels
  - `confirm-input.md` - Y/n confirmation prompts
  - `email-input.md` - Email input with domain completion
  - `multi-select.md` - Multiple option selection
  - `ordered-list.md` - Numbered lists
  - `password-input.md` - Masked text input
  - `progress-bar.md` - Progress indicators
  - `select.md` - Single option selection
  - `spinner.md` - Loading animations
  - `status-message.md` - Status explanations
  - `text-input.md` - General text input
  - `unordered-list.md` - Bullet lists

- **Examples Directory**: `/docs/ink-ui/examples/`
  - All component examples matching the docs above
  - `autocomplete.tsx` - Advanced autocomplete pattern
  - `theming/` - Custom theming examples
    - `custom-component.tsx`
    - `spinner.tsx`
    - `unordered-list.tsx`

### ink-table Library
- **Examples Directory**: `/docs/ink-table/examples/`
  - `basic.tsx` - Simple table rendering
  - `custom.tsx` - Custom cell and header components

### TUI Version Board Documentation
- `tui-version-board.md` - Main TUI design document
- `tui-version-board-appendix-a.md` - Additional specifications
- `tui-version-board-appendix-b.md` - Implementation details
- `tui-version-board-appendix-c.md` - Advanced patterns

## 9. Quick Start Guide for ArcGIS CLI Migration

### From Commander.js to Ink

The migration from Commander.js to Ink involves transitioning from a traditional command-line parser to a React-based TUI. Here's the approach:

1. **Entry Point**: Replace Commander's program definition with an Ink render call
2. **Commands**: Convert command handlers to React components
3. **Arguments**: Use router components or state to handle different modes
4. **Options**: Replace flags with interactive UI components
5. **Output**: Replace console.log with Ink's Text and Box components

### Example Migration Pattern

**Before (Commander.js):**
```javascript
program
  .command('login')
  .option('--portal <url>', 'Portal URL')
  .option('--username <user>', 'Username')
  .action(async (options) => {
    console.log('Logging in...');
    // login logic
  });
```

**After (Ink):**
```tsx
function LoginCommand() {
  const [portal, setPortal] = useState('');
  const [username, setUsername] = useState('');
  const [step, setStep] = useState('portal');

  return (
    <Box flexDirection="column" gap={1}>
      <Text bold>ArcGIS Login</Text>
      {step === 'portal' && (
        <TextInput
          placeholder="Enter portal URL..."
          value={portal}
          onChange={setPortal}
          onSubmit={() => setStep('username')}
        />
      )}
      {step === 'username' && (
        <TextInput
          placeholder="Enter username..."
          value={username}
          onChange={setUsername}
          onSubmit={handleLogin}
        />
      )}
    </Box>
  );
}
```

### Key Benefits of Ink

1. **Interactive UX**: Real-time feedback, progress indicators, and dynamic updates
2. **Better Error Handling**: Show errors inline without disrupting the interface
3. **Composability**: Reuse UI components across different commands
4. **State Management**: Use React patterns for complex workflows
5. **Testing**: Component-based testing with React testing libraries

### Next Steps

1. Study the example files in `/docs/ink/examples/` for patterns
2. Review @inkjs/ui components for pre-built UI elements
3. Use ink-table for displaying query results and service listings
4. Implement focus management for multi-step workflows
5. Consider the TUI version board design for the full application architecture
