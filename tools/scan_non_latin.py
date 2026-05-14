#!/usr/bin/env python3
import sys
import os
import json
import argparse

def is_binary_string(bytes_data):
    # Heuristic: if null byte present or many non-text bytes
    if b"\x00" in bytes_data:
        return True
    # if more than 30% of bytes are non-ASCII control, mark binary
    text_chars = bytearray(range(32, 127)) + b"\n\r\t\f\b"
    if not bytes_data:
        return False
    nontext = sum(1 for b in bytes_data if b not in text_chars)
    return (nontext / len(bytes_data)) > 0.3


def scan_file(path, allow_ranges):
    findings = []
    try:
        with open(path, 'rb') as f:
            data = f.read()
            if is_binary_string(data[:4096]):
                return findings
        # try utf-8 then latin-1
        try:
            text = data.decode('utf-8')
        except UnicodeDecodeError:
            try:
                text = data.decode('latin-1')
            except Exception:
                return findings

        for lineno, line in enumerate(text.splitlines(), start=1):
            for col, ch in enumerate(line, start=1):
                cp = ord(ch)
                ok = False
                for (a,b) in allow_ranges:
                    if a <= cp <= b:
                        ok = True
                        break
                if not ok:
                    findings.append({
                        'line': lineno,
                        'col': col,
                        'char': ch,
                        'codepoint': f'U+{cp:04X}',
                        'context': line[max(0,col-20):col+20]
                    })
                    # limit per file to keep report readable
                    if len(findings) >= 300:
                        return findings
    except Exception as e:
        return findings
    return findings


def main():
    p = argparse.ArgumentParser(description='Scan files for characters outside Arabic/English ranges')
    p.add_argument('root', nargs='?', default='.', help='Root folder to scan')
    p.add_argument('out', nargs='?', default='scan-report.json', help='Output JSON file')
    args = p.parse_args()

    # Allowed Unicode ranges (inclusive)
    allow_ranges = [
        (0x0000, 0x00FF),   # Basic Latin + Latin-1 Supplement
        (0x0600, 0x06FF),   # Arabic
        (0x0750, 0x077F),   # Arabic Supplement
        (0x08A0, 0x08FF),   # Arabic Extended-A
        (0xFB50, 0xFDFF),   # Arabic Presentation Forms-A
        (0xFE70, 0xFEFF),   # Arabic Presentation Forms-B
        (0x2000, 0x206F),   # General Punctuation (allow common punctuation)
    ]

    root = os.path.abspath(args.root)
    results = {}
    skipped = 0
    for dirpath, dirnames, filenames in os.walk(root):
        # skip common binary or dependency folders
        base = os.path.basename(dirpath)
        if base in ('.git', 'node_modules', '__pycache__'):
            continue
        for name in filenames:
            path = os.path.join(dirpath, name)
            # skip large binary file types
            low = name.lower()
            if low.endswith(('.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico', '.ttf', '.woff', '.woff2', '.otf', '.eot', '.exe', '.dll')):
                skipped += 1
                continue
            rel = os.path.relpath(path, root)
            f = scan_file(path, allow_ranges)
            if f:
                results[rel.replace('\\', '/')] = f

    out = {
        'scanned_root': root,
        'files_with_issues': len(results),
        'skipped_binary_files': skipped,
        'details': results
    }
    with open(args.out, 'w', encoding='utf-8') as fo:
        json.dump(out, fo, ensure_ascii=False, indent=2)
    print('Scan complete. Files with issues:', len(results))
    print('Report written to', args.out)


if __name__ == '__main__':
    main()
