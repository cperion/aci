# Adding MCP Language Server to Claude Code

This guide shows how to integrate the MCP Language Server with Claude Code to provide semantic code analysis tools like definitions, references, diagnostics, hover information, symbol renaming, and file editing capabilities.

## Prerequisites

1. **Claude Code CLI** installed and configured
2. **Go 1.24+** installed on your system
3. **gopls** (Go language server) installed

## Installation Steps

### 1. Install Required Tools

```bash
# Install the MCP Language Server
go install github.com/isaacphi/mcp-language-server@latest

# Install or update gopls
go install golang.org/x/tools/gopls@latest
```

### 2. Add MCP Server to Claude Code

Use the `claude mcp add` command to configure the server:

```bash
claude mcp add -e GOPATH=/home/username/go -e GOCACHE=/home/username/.cache/go-build -e GOMODCACHE=/home/username/go/pkg/mod -- language-server mcp-language-server --workspace /path/to/your/project --lsp gopls
```

**Important:** Replace the following paths with your actual values:
- `/home/username/go` - Your GOPATH
- `/home/username/.cache/go-build` - Your Go build cache
- `/home/username/go/pkg/mod` - Your Go module cache
- `/path/to/your/project` - Your project's root directory

### 3. Verify Installation

Check that the server was added successfully:

```bash
claude mcp list
```

You should see output like:
```
language-server: mcp-language-server --workspace /path/to/your/project --lsp gopls
```

## Available Tools

Once configured, you'll have access to these semantic code analysis tools:

- **`definition`** - Get complete source code definitions of symbols
- **`references`** - Find all usages of a symbol throughout the codebase
- **`diagnostics`** - Get warnings and errors for specific files
- **`hover`** - Display documentation and type information
- **`rename_symbol`** - Rename symbols across the entire project
- **`edit_file`** - Apply multiple text edits to files using line numbers

## Language Support

The MCP Language Server supports multiple programming languages:

### Go (gopls)
```bash
claude mcp add -e GOPATH=/home/username/go -e GOCACHE=/home/username/.cache/go-build -e GOMODCACHE=/home/username/go/pkg/mod -- language-server mcp-language-server --workspace /path/to/project --lsp gopls
```

### Python (pyright)
```bash
# First install: npm install -g pyright
claude mcp add -- language-server mcp-language-server --workspace /path/to/project --lsp pyright-langserver -- --stdio
```

### TypeScript (typescript-language-server)
```bash
# First install: npm install -g typescript typescript-language-server
claude mcp add -- language-server mcp-language-server --workspace /path/to/project --lsp typescript-language-server -- --stdio
```

### Rust (rust-analyzer)
```bash
# First install: rustup component add rust-analyzer
claude mcp add -- language-server mcp-language-server --workspace /path/to/project --lsp rust-analyzer
```

### C/C++ (clangd)
```bash
# First install clangd (varies by system)
claude mcp add -- language-server mcp-language-server --workspace /path/to/project --lsp /path/to/clangd -- --compile-commands-dir=/path/to/compile_commands_dir
```

## Configuration Scopes

You can configure servers at different scopes:

- **`local`** (default) - Project-specific, private to you
- **`project`** - Shared via `.mcp.json`, visible to team members
- **`user`** - Available across all your projects

Add `--scope project` or `--scope user` to change the scope:

```bash
claude mcp add --scope user -e GOPATH=/home/username/go -- language-server mcp-language-server --workspace /path/to/project --lsp gopls
```

## Troubleshooting

### Common Issues

1. **Environment Variables**: Ensure Go environment variables match your system:
   ```bash
   echo "GOPATH: $(go env GOPATH)"
   echo "GOCACHE: $(go env GOCACHE)" 
   echo "GOMODCACHE: $(go env GOMODCACHE)"
   ```

2. **Binary Not Found**: Verify installations:
   ```bash
   which mcp-language-server
   which gopls
   ```

3. **Permission Issues**: Ensure binaries are executable and in your PATH

4. **Workspace Path**: Use absolute paths for the `--workspace` parameter

### Debug Mode

Enable debug logging by adding environment variables:

```bash
claude mcp add -e LOG_LEVEL=DEBUG -e GOPATH=/home/username/go -- language-server mcp-language-server --workspace /path/to/project --lsp gopls
```

## Example Usage

Once configured, you can use the tools in Claude Code:

```
# Get definition of a symbol
What is the definition of DocumentUri?

# Find all references to a function
Show me all references to ParseDocumentUri

# Get diagnostics for a file
Check for errors in internal/protocol/uri.go

# Rename a symbol
Rename the variable 'uri' to 'documentUri' in uri.go at line 42, column 6
```

## Benefits

- **Semantic Understanding**: Go beyond text search with language-aware analysis
- **Cross-File Navigation**: Follow symbols across your entire codebase
- **Error Detection**: Get real-time diagnostics from the language server
- **Safe Refactoring**: Rename symbols with confidence across the project
- **Rich Context**: Access documentation and type information instantly

This integration transforms Claude Code into a powerful code analysis tool that understands your codebase's structure and semantics.