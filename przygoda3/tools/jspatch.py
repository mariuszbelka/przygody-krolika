import re, sys

def find_block_end(src, open_idx):
    """Given index of '{', return index just after the matching '}' (JS-aware)."""
    i = open_idx
    n = len(src)
    stack = []  # 'code' or 'tpl'
    depth_stack = [0]
    mode = 'code'
    modes = ['code']
    depth = 0
    # simpler: explicit state machine
    i = open_idx
    brace = 0
    ctx = ['code']
    while i < n:
        c = src[i]
        m = ctx[-1]
        if m == 'code':
            if c == '/' and src[i+1] == '/':
                j = src.find('\n', i); i = j; continue
            if c == '/' and src[i+1] == '*':
                j = src.find('*/', i); i = j + 2; continue
            if c in '\'"':
                q = c; i += 1
                while src[i] != q:
                    if src[i] == '\\': i += 1
                    i += 1
                i += 1; continue
            if c == '`':
                ctx.append('tpl'); i += 1; continue
            if c == '{':
                ctx.append('brace')
                i += 1; continue
            i += 1; continue
        if m == 'brace':
            # same as code but closing pops
            if c == '}':
                ctx.pop(); i += 1
                if len(ctx) == 1:
                    return i
                continue
            if c == '/' and src[i+1] == '/':
                j = src.find('\n', i); i = j; continue
            if c == '/' and src[i+1] == '*':
                j = src.find('*/', i); i = j + 2; continue
            if c in '\'"':
                q = c; i += 1
                while src[i] != q:
                    if src[i] == '\\': i += 1
                    i += 1
                i += 1; continue
            if c == '`':
                ctx.append('tpl'); i += 1; continue
            if c == '{':
                ctx.append('brace'); i += 1; continue
            i += 1; continue
        if m == 'tpl':
            if c == '\\': i += 2; continue
            if c == '`': ctx.pop(); i += 1; continue
            if c == '$' and src[i+1] == '{':
                ctx.append('tplexpr'); i += 2; continue
            i += 1; continue
        if m == 'tplexpr':
            if c == '}': ctx.pop(); i += 1; continue
            if c == '{': ctx.append('brace2'); i += 1; continue
            if c in '\'"':
                q = c; i += 1
                while src[i] != q:
                    if src[i] == '\\': i += 1
                    i += 1
                i += 1; continue
            if c == '`': ctx.append('tpl'); i += 1; continue
            i += 1; continue
        if m == 'brace2':
            if c == '}': ctx.pop(); i += 1; continue
            if c == '{': ctx.append('brace2'); i += 1; continue
            if c == '`': ctx.append('tpl'); i += 1; continue
            if c in '\'"':
                q = c; i += 1
                while src[i] != q:
                    if src[i] == '\\': i += 1
                    i += 1
                i += 1; continue
            i += 1; continue
    raise ValueError('unbalanced')


def func_span(src, name):
    pat = re.compile(r'^([ \t]*)function ' + re.escape(name) + r'\s*\(', re.M)
    ms = list(pat.finditer(src))
    if len(ms) != 1:
        raise ValueError(f'function {name}: found {len(ms)}')
    m = ms[0]
    start = m.start()
    # find '{' after params: match parens
    i = m.end() - 1
    depth = 0
    while True:
        c = src[i]
        if c == '(': depth += 1
        elif c == ')':
            depth -= 1
            if depth == 0: break
        elif c in '\'"':
            q = c; i += 1
            while src[i] != q:
                if src[i] == '\\': i += 1
                i += 1
        i += 1
    ob = src.index('{', i)
    end = find_block_end(src, ob)
    return start, end


def replace_func(src, name, code):
    s, e = func_span(src, name)
    return src[:s] + code.strip('\n').rstrip() + src[e:]


def insert_after_func(src, name, code):
    s, e = func_span(src, name)
    return src[:e] + '\n\n' + code.strip('\n').rstrip() + src[e:]


def sub1(src, old, new, count=1):
    c = src.count(old)
    if c != count:
        raise ValueError(f'expected {count} of {old[:60]!r}, found {c}')
    return src.replace(old, new)
