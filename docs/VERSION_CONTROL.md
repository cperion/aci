# Version Control Guide

This project uses **Jujutsu (jj)** as the primary version control system, with Git as the underlying backend for remote repository compatibility.

## Why Jujutsu?

### Advantages Over Traditional Git Workflow

**Conflict-Free Operations**
- No merge conflicts during regular development
- Automatic conflict resolution for most scenarios
- Simplified branching and merging workflow

**Automatic Change Tracking**
- Every modification is automatically tracked
- No risk of losing work due to uncommitted changes  
- Built-in backup system for all development work

**Git Compatibility**
- Full interoperability with Git repositories
- Can push/pull to/from any Git remote
- Existing Git workflows remain functional

**Improved Developer Experience**
- Simplified rebasing and history editing
- Better handling of work-in-progress changes
- More intuitive branching model

## Installation

### Install Jujutsu

```bash
# macOS (via Homebrew)
brew install jj

# Ubuntu/Debian
sudo snap install --edge jujutsu

# Windows (via Scoop)
scoop install jujutsu

# From source
cargo install --git https://github.com/martinvonz/jj jj-cli
```

### Verify Installation

```bash
jj --version
```

## Repository Setup

### Initialize New Repository

```bash
# Create new repository with jj
jj init --git aci
cd aci

# Add files and make first commit
jj commit -m "Initial commit"
```

### Work with Existing Git Repository

```bash
# Initialize jj in existing Git repository
jj git init --git-repo .

# Import existing Git history
jj git import
```

## Daily Workflow

### Basic Operations

```bash
# Check current status
jj status

# View change history
jj log

# View detailed log with file changes
jj log -p
```

### Making Changes

```bash
# Edit files normally (no need to stage)
# All changes are automatically tracked

# Check what's changed
jj diff

# Create a commit with current changes
jj commit -m "Implement user authentication"

# Or describe the current working change
jj describe -m "WIP: Adding federation support"
```

### Working with Remotes

```bash
# Add Git remote
jj git remote add origin https://github.com/user/aci.git

# Push changes to Git remote
jj git push

# Fetch from Git remote
jj git fetch

# Update local changes with remote changes
jj rebase
```

## Advanced Workflows

### Branch Management

```bash
# Create new change (similar to Git branch)
jj new -m "Feature: batch processing"

# Switch to different change
jj edit <change-id>

# View all changes
jj log --all
```

### History Editing

```bash
# Amend the current change
jj describe -m "Updated commit message"

# Split a change into multiple commits
jj split

# Combine multiple changes
jj squash --into <target-change>
```

### Collaboration

```bash
# Sync with remote repository
jj git fetch
jj rebase

# Push your changes
jj git push

# Handle conflicts (rare with jj)
jj resolve  # if needed
```

## Project-Specific Workflow

### Development Cycle

1. **Start new feature**:
   ```bash
   jj new -m "Feature: environment management"
   ```

2. **Develop and test**:
   ```bash
   # Make changes to files
   jj describe -m "WIP: adding environment config parsing"
   
   # Run tests
   bun run typecheck
   ```

3. **Commit completed work**:
   ```bash
   jj commit -m "Add environment management with .arcgisrc support"
   ```

4. **Sync with remote**:
   ```bash
   jj git push
   ```

### Release Process

1. **Prepare release**:
   ```bash
   jj new -m "Prepare v0.1.0 release"
   # Update CHANGELOG.md, package.json version
   jj commit -m "Bump version to 0.1.0"
   ```

2. **Tag release**:
   ```bash
   jj git push
   git tag v0.1.0  # Use git for tagging
   git push origin v0.1.0
   ```

## Integration with Development Tools

### VS Code Integration

Install the Jujutsu extension for VS Code:
- Syntax highlighting for jj commands
- Change visualization
- Integrated diff views

### Command Aliases

Add to your shell configuration:

```bash
# ~/.bashrc or ~/.zshrc
alias js="jj status"
alias jl="jj log"
alias jd="jj diff"
alias jc="jj commit"
alias jp="jj git push"
```

## Troubleshooting

### Common Issues

**Working copy is stale**
```bash
jj workspace update-stale
```

**Conflicts during rebase**
```bash
jj resolve
# Edit conflicted files
jj continue
```

**Lost changes**
```bash
# View all changes including "hidden" ones
jj log --all --hidden

# Restore a specific change
jj restore <change-id>
```

### Git Interoperability

**Converting Git commits to jj**
```bash
jj git import
```

**Accessing Git commands when needed**
```bash
# Use git commands directly for operations not available in jj
git tag v1.0.0
git push origin v1.0.0
```

## Best Practices

### Commit Messages

Follow conventional commit format:
```bash
jj commit -m "feat: add environment switching support"
jj commit -m "fix: resolve portal URL normalization bug"
jj commit -m "docs: update installation instructions"
```

### Change Organization

- Keep changes focused and atomic
- Use descriptive commit messages
- Leverage jj's ability to easily edit history
- Don't worry about perfect commits during development

### Collaboration

- Regularly sync with remote: `jj git fetch && jj rebase`
- Push completed features: `jj git push`
- Use descriptive change descriptions for work-in-progress

### Backup Strategy

Jujutsu automatically backs up all changes, but for critical work:
- Regularly push to remote repository
- Use multiple remotes for redundancy
- Export important changes: `jj git export`

## Migration from Git

### For Git Users

Key differences to remember:
- No staging area - all changes are automatically tracked
- `jj commit` creates a new change, doesn't require staging
- `jj describe` modifies the current change description
- `jj new` creates a new change (like `git checkout -b`)
- `jj edit` switches to a different change (like `git checkout`)

### Gradual Migration

You can use both Git and Jujutsu commands:
- Use `jj` for daily development workflow
- Use `git` for operations like tagging and advanced remote operations
- Both systems work on the same repository

## Resources

- [Jujutsu Documentation](https://github.com/martinvonz/jj/tree/main/docs)
- [Jujutsu Tutorial](https://github.com/martinvonz/jj/blob/main/docs/tutorial.md)
- [Git Comparison](https://github.com/martinvonz/jj/blob/main/docs/git-comparison.md)
- [Community Discord](https://discord.gg/dkmfj3aGQN)