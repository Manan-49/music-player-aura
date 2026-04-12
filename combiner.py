#!/usr/bin/env python3
"""
combiner.py — Universal File Combiner for LLM Context / Code Review
────────────────────────────────────────────────────────────────────
Usage:
  python combiner.py                          # uses input.txt (creates template if missing)
  python combiner.py src/main.py src/utils.py # direct file args
  python combiner.py src/ --ext .py .ts       # scan directory
  python combiner.py input.txt --out ctx.md   # custom output file
  python combiner.py src/ --dry-run           # preview without writing
  python combiner.py src/ --format xml        # XML format (Claude/GPT friendly)
  python combiner.py src/ --ignore-file .gitignore --exclude tests/ build/

Options:
  --out <file>          Output filename          (default: output.txt)
  --format <fmt>        Output format: md | xml | plain  (default: md)
  --ext <exts>          File extensions to include when scanning a dir
  --exclude <dirs>      Dirs/files to skip (space-separated)
  --ignore-file <file>  Parse a .gitignore-style file for exclusions
  --max-size <kb>       Skip files larger than N KB  (default: 500)
  --dry-run             List files that would be included, don't write output
  --no-tree             Don't prepend directory tree to output
  --help                Show this help
"""

import os
import sys
import glob
import fnmatch
import argparse
import datetime
from pathlib import Path


# ── Constants ────────────────────────────────────────────────────────────────

ALWAYS_EXCLUDE = {
    '.git', '__pycache__', '.pytest_cache', '.mypy_cache',
    'node_modules', '.next', 'dist', 'build', 'out',
    '.dart_tool', '.pub-cache', 'venv', '.venv', 'env',
    '.turbo', '.vercel', 'coverage', 'htmlcov', '.tox',
    '*.egg-info', '.DS_Store', 'Thumbs.db',
}

BINARY_EXTENSIONS = {
    '.png', '.jpg', '.jpeg', '.gif', '.bmp', '.ico', '.webp', '.svg',
    '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
    '.zip', '.tar', '.gz', '.bz2', '.7z', '.rar',
    '.exe', '.dll', '.so', '.dylib', '.bin', '.o', '.a',
    '.mp3', '.mp4', '.wav', '.avi', '.mov', '.flac',
    '.ttf', '.otf', '.woff', '.woff2',
    '.pyc', '.pyo', '.pyd', '.class',
    '.lock',  # package-lock, yarn.lock, etc.
}

# Approximate chars-per-token for estimation
CHARS_PER_TOKEN = 4

# ANSI colors
class C:
    RESET  = '\x1b[0m'
    BOLD   = '\x1b[1m'
    DIM    = '\x1b[2m'
    GREEN  = '\x1b[32m'
    YELLOW = '\x1b[33m'
    RED    = '\x1b[31m'
    CYAN   = '\x1b[36m'
    GRAY   = '\x1b[90m'

def bold(s):   return f"{C.BOLD}{s}{C.RESET}"
def green(s):  return f"{C.GREEN}{s}{C.RESET}"
def yellow(s): return f"{C.YELLOW}{s}{C.RESET}"
def red(s):    return f"{C.RED}{s}{C.RESET}"
def cyan(s):   return f"{C.CYAN}{s}{C.RESET}"
def gray(s):   return f"{C.GRAY}{s}{C.RESET}"
def dim(s):    return f"{C.DIM}{s}{C.RESET}"


# ── Helpers ──────────────────────────────────────────────────────────────────

def is_binary_file(filepath: str) -> bool:
    ext = Path(filepath).suffix.lower()
    if ext in BINARY_EXTENSIONS:
        return True
    try:
        with open(filepath, 'rb') as f:
            return b'\x00' in f.read(8192)
    except Exception:
        return True


def escape_backticks(content: str) -> str:
    return content.replace('```', '` ` `')


def lang_hint(filepath: str) -> str:
    """Return markdown language hint from file extension."""
    ext_map = {
        '.py': 'python', '.js': 'javascript', '.ts': 'typescript',
        '.jsx': 'jsx', '.tsx': 'tsx', '.html': 'html', '.css': 'css',
        '.scss': 'scss', '.json': 'json', '.yaml': 'yaml', '.yml': 'yaml',
        '.toml': 'toml', '.md': 'markdown', '.sh': 'bash', '.bash': 'bash',
        '.zsh': 'bash', '.rs': 'rust', '.go': 'go', '.java': 'java',
        '.kt': 'kotlin', '.dart': 'dart', '.swift': 'swift', '.cpp': 'cpp',
        '.c': 'c', '.h': 'c', '.rb': 'ruby', '.php': 'php', '.sql': 'sql',
        '.tf': 'hcl', '.hcl': 'hcl', '.xml': 'xml', '.env': 'bash',
        '.dockerfile': 'dockerfile', '.vue': 'vue', '.svelte': 'svelte',
        '.graphql': 'graphql', '.proto': 'protobuf',
    }
    name = Path(filepath).name.lower()
    if name == 'dockerfile':
        return 'dockerfile'
    return ext_map.get(Path(filepath).suffix.lower(), '')


def read_file(filepath: str):
    """Try reading a file with multiple encodings. Returns (content, encoding) or (None, None)."""
    for enc in ('utf-8', 'utf-8-sig', 'latin-1', 'cp1252'):
        try:
            with open(filepath, 'r', encoding=enc) as f:
                return f.read(), enc
        except (UnicodeDecodeError, PermissionError):
            continue
    return None, None


def parse_ignore_file(ignore_path: str) -> list[str]:
    """Parse a .gitignore-style file into a list of patterns."""
    patterns = []
    if not os.path.exists(ignore_path):
        return patterns
    with open(ignore_path, 'r', encoding='utf-8', errors='ignore') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#'):
                # Strip leading slash (gitignore anchoring)
                patterns.append(line.lstrip('/'))
    return patterns


def is_excluded(path_str: str, exclude_patterns: list[str]) -> bool:
    """Check if any path component matches exclusion patterns."""
    parts = Path(path_str).parts
    for pattern in exclude_patterns:
        for part in parts:
            if fnmatch.fnmatch(part, pattern):
                return True
        if fnmatch.fnmatch(path_str, pattern):
            return True
        if fnmatch.fnmatch(path_str, f'*/{pattern}') or fnmatch.fnmatch(path_str, f'*/{pattern}/*'):
            return True
    return False


def build_tree(filepaths: list[str], root: str) -> str:
    """Build a simple ASCII directory tree from a list of file paths."""
    tree = {}
    for fp in filepaths:
        try:
            rel = os.path.relpath(fp, root)
        except ValueError:
            rel = fp
        parts = Path(rel).parts
        node = tree
        for part in parts:
            node = node.setdefault(part, {})

    lines = [f"{os.path.basename(root) or root}/"]

    def render(node, prefix=''):
        items = sorted(node.keys())
        for i, name in enumerate(items):
            is_last = (i == len(items) - 1)
            connector = '└── ' if is_last else '├── '
            lines.append(f"{prefix}{connector}{name}")
            child = node[name]
            if child:
                extension = '    ' if is_last else '│   '
                render(child, prefix + extension)

    render(tree)
    return '\n'.join(lines)


def estimate_tokens(text: str) -> str:
    tokens = len(text) // CHARS_PER_TOKEN
    if tokens >= 1000:
        return f"~{tokens // 1000}k tokens"
    return f"~{tokens} tokens"


# ── File resolution ───────────────────────────────────────────────────────────

def resolve_from_input_file(input_file: str) -> list[str]:
    with open(input_file, 'r', encoding='utf-8') as f:
        raw = [
            line.strip() for line in f
            if line.strip() and not line.strip().startswith('#')
        ]
    resolved = []
    seen = set()
    for pattern in raw:
        expanded = glob.glob(pattern, recursive=True)
        targets = sorted(expanded) if expanded else [pattern]
        for p in targets:
            norm = os.path.normpath(p)
            if norm not in seen:
                resolved.append(norm)
                seen.add(norm)
    return resolved


def resolve_from_directory(directory: str, extensions: list[str],
                            exclude_patterns: list[str], max_size_kb: int) -> list[str]:
    resolved = []
    all_excludes = list(ALWAYS_EXCLUDE) + exclude_patterns
    max_bytes = max_size_kb * 1024

    for dirpath, dirnames, filenames in os.walk(directory):
        # Prune excluded dirs in-place so os.walk skips them
        dirnames[:] = [
            d for d in sorted(dirnames)
            if not is_excluded(os.path.join(dirpath, d), all_excludes)
            and not d.startswith('.')
        ]

        for filename in sorted(filenames):
            if filename.startswith('.'):
                continue
            fullpath = os.path.normpath(os.path.join(dirpath, filename))
            if is_excluded(fullpath, all_excludes):
                continue
            ext = Path(filename).suffix.lower()
            if extensions and ext not in extensions:
                continue
            try:
                if os.path.getsize(fullpath) > max_bytes:
                    continue
            except OSError:
                continue
            resolved.append(fullpath)

    return resolved


# ── Output formatters ─────────────────────────────────────────────────────────

def format_md(filepath: str, content: str, rel_path: str) -> str:
    hint = lang_hint(filepath)
    lines = content.count('\n') + (0 if content.endswith('\n') else 1)
    header = f"### `{rel_path}` ({lines} lines)"
    fence = f"```{hint}"
    return f"{header}\n{fence}\n{escape_backticks(content)}{'.' if not content.endswith(chr(10)) else ''}```\n"


def format_xml(filepath: str, content: str, rel_path: str) -> str:
    # XML-safe: escape < > & inside content
    safe = content.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
    lines = content.count('\n') + (0 if content.endswith('\n') else 1)
    lang = lang_hint(filepath) or 'text'
    return (
        f'<file path="{rel_path}" language="{lang}" lines="{lines}">\n'
        f'<![CDATA[\n{content}]]>\n'
        f'</file>\n'
    )


def format_plain(filepath: str, content: str, rel_path: str) -> str:
    sep = '=' * 60
    lines = content.count('\n') + (0 if content.endswith('\n') else 1)
    return f"{sep}\nFILE: {rel_path} ({lines} lines)\n{sep}\n{content}\n"


FORMATTERS = {
    'md':    format_md,
    'xml':   format_xml,
    'plain': format_plain,
}


# ── Template ──────────────────────────────────────────────────────────────────

TEMPLATE = """# combiner.py — input file
# Add file paths below, one per line.
# Lines starting with '#' are comments and will be ignored.
# Blank lines are ignored.
# Glob patterns like src/*.py are supported.
#
# Examples:
# src/main.py
# src/utils.py
# lib/*.js
# **/*.ts
"""


# ── Main ─────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description='Universal File Combiner — merge files into a single context file',
        add_help=False,
    )
    parser.add_argument('inputs', nargs='*', help='Files, directories, or input.txt to process')
    parser.add_argument('--out',         default=None,    help='Output filename (default: output.txt / output.md / output.xml)')
    parser.add_argument('--format',      default='md',    choices=['md', 'xml', 'plain'], help='Output format')
    parser.add_argument('--ext',         nargs='+',       default=[], help='Extensions to include when scanning dir (e.g. .py .ts)')
    parser.add_argument('--exclude',     nargs='+',       default=[], help='Extra dirs/patterns to exclude')
    parser.add_argument('--ignore-file', default=None,    dest='ignore_file', help='.gitignore-style exclusion file')
    parser.add_argument('--max-size',    default=500,     type=int,  dest='max_size', help='Max file size in KB (default: 500)')
    parser.add_argument('--dry-run',     action='store_true', help='Preview files without writing output')
    parser.add_argument('--no-tree',     action='store_true', help="Don't prepend directory tree")
    parser.add_argument('--help',        action='store_true', help='Show help')

    args = parser.parse_args()

    if args.help:
        print(__doc__)
        sys.exit(0)

    # ── Resolve exclusion patterns
    exclude_patterns = list(ALWAYS_EXCLUDE) + args.exclude
    if args.ignore_file:
        ignore_patterns = parse_ignore_file(args.ignore_file)
        exclude_patterns += ignore_patterns
        print(dim(f"   Loaded {len(ignore_patterns)} patterns from '{args.ignore_file}'"))

    # ── Normalise extensions
    extensions = [e if e.startswith('.') else f'.{e}' for e in args.ext]

    # ── Figure out what we're scanning
    filepaths: list[str] = []
    scan_root = '.'

    if not args.inputs:
        # Default: use input.txt
        if not os.path.exists('input.txt'):
            with open('input.txt', 'w', encoding='utf-8') as f:
                f.write(TEMPLATE)
            print(green("✓ Created template 'input.txt'. Add your file paths and run again."))
            return
        filepaths = resolve_from_input_file('input.txt')

    else:
        for inp in args.inputs:
            if os.path.isdir(inp):
                scan_root = inp
                found = resolve_from_directory(inp, extensions, exclude_patterns, args.max_size)
                filepaths.extend(found)
            elif inp.endswith('.txt') and os.path.exists(inp) and inp not in glob.glob('*.py'):
                # Treat as an input-list file
                filepaths.extend(resolve_from_input_file(inp))
            else:
                # Direct file or glob pattern
                expanded = glob.glob(inp, recursive=True)
                if expanded:
                    filepaths.extend([os.path.normpath(p) for p in sorted(expanded)])
                else:
                    filepaths.append(inp)  # will be caught as missing later

    # Deduplicate preserving order
    seen = set()
    unique = []
    for f in filepaths:
        if f not in seen:
            unique.append(f)
            seen.add(f)
    filepaths = unique

    if not filepaths:
        print(red("✗ No files found to process."))
        sys.exit(1)

    # ── Output filename default
    ext_suffix = {'md': '.md', 'xml': '.xml', 'plain': '.txt'}
    out_file = args.out or f"output{ext_suffix[args.format]}"

    formatter = FORMATTERS[args.format]

    # ── Print header
    print()
    print(bold("  📦 combiner.py"))
    print(dim(f"  Format : {args.format}  |  Max size : {args.max_size}KB  |  Output : {out_file}"))
    if extensions:
        print(dim(f"  Extensions filter: {', '.join(extensions)}"))
    print()

    # ── Process files
    success_files = []
    skipped_files = []
    output_parts  = []
    total_lines   = 0
    total_chars   = 0

    for filepath in filepaths:
        rel = os.path.relpath(filepath, scan_root)

        if not os.path.exists(filepath):
            print(f"  {red('[MISS]')} {gray(rel)}")
            skipped_files.append((filepath, 'not found'))
            continue

        if os.path.isdir(filepath):
            print(f"  {yellow('[DIR] ')} {gray(rel)}")
            skipped_files.append((filepath, 'directory'))
            continue

        try:
            size_kb = os.path.getsize(filepath) / 1024
        except OSError:
            size_kb = 0

        if size_kb > args.max_size:
            print(f"  {yellow('[SIZE]')} {gray(rel)} {dim(f'({size_kb:.0f}KB > {args.max_size}KB limit)')}")
            skipped_files.append((filepath, f'too large ({size_kb:.0f}KB)'))
            continue

        if is_binary_file(filepath):
            print(f"  {yellow('[BIN] ')} {gray(rel)}")
            skipped_files.append((filepath, 'binary'))
            continue

        content, encoding = read_file(filepath)
        if content is None:
            print(f"  {red('[ERR] ')} {gray(rel)} {dim('(could not read)')}")
            skipped_files.append((filepath, 'read error'))
            continue

        lines = content.count('\n') + (0 if content.endswith('\n') else 1)
        total_lines += lines
        total_chars += len(content)

        if not args.dry_run:
            output_parts.append(formatter(filepath, content, rel))

        success_files.append(filepath)
        print(f"  {green('[OK]  ')} {rel}  {dim(f'{lines} lines · {size_kb:.1f}KB')}")

    # ── Build and write output
    if not args.dry_run and success_files:
        out_sections = []

        # Header block
        timestamp = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        if args.format == 'xml':
            out_sections.append(
                f'<?xml version="1.0" encoding="UTF-8"?>\n'
                f'<!-- Generated by combiner.py | {timestamp} | {len(success_files)} files -->\n'
                f'<context>\n'
            )
        else:
            out_sections.append(
                f"# Combined Context\n"
                f"*Generated by combiner.py · {timestamp} · {len(success_files)} files · "
                f"{total_lines} lines · {estimate_tokens(chr(32) * total_chars)}*\n\n"
            )

        # Directory tree
        if not args.no_tree and success_files:
            tree_str = build_tree(success_files, scan_root)
            if args.format == 'xml':
                out_sections.append(f'<tree><![CDATA[\n{tree_str}\n]]></tree>\n\n')
            else:
                out_sections.append(f"## File Tree\n```\n{tree_str}\n```\n\n## Files\n\n")

        out_sections.extend(output_parts)

        if args.format == 'xml':
            out_sections.append('</context>\n')

        full_output = '\n'.join(out_sections) if args.format != 'xml' else ''.join(out_sections)

        with open(out_file, 'w', encoding='utf-8') as f:
            f.write(full_output)

    # ── Summary
    out_size_kb = os.path.getsize(out_file) / 1024 if not args.dry_run and os.path.exists(out_file) else 0
    token_est   = estimate_tokens(' ' * total_chars)

    print()
    print(dim('  ' + '─' * 44))
    mode_label = '  🔍 DRY RUN — no output written' if args.dry_run else f'  ✅ Output : {bold(out_file)}'
    print(mode_label)
    print(f"  {'Files processed':16}: {bold(str(len(success_files)))}")
    if skipped_files:
        print(f"  {'Files skipped':16}: {yellow(str(len(skipped_files)))} ({', '.join(set(r for _, r in skipped_files))})")
    print(f"  {'Total lines':16}: {bold(str(total_lines))}")
    print(f"  {'Token estimate':16}: {bold(token_est)}")
    if not args.dry_run and out_size_kb:
        print(f"  {'Output size':16}: {bold(f'{out_size_kb:.1f} KB')}")
    print(dim('  ' + '─' * 44))
    print()


if __name__ == '__main__':
    main()