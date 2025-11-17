#!/bin/bash

# Find all AGENTS.md files in current directory and subdirectories
# This is a temporary solution until Claude Code supports AGENTS.md files directly.
# https://github.com/anthropics/claude-code/issues/6235
echo "=== AGENTS.md Files Found ==="
find "$CLAUDE_PROJECT_DIR" -name "AGENTS.md" -type f | while read -r file; do
    echo "--- File: $file ---"
    cat "$file"
    echo ""
done
