// A list of common TypeScript/JavaScript keywords
const TS_KEYWORDS = new Set([
    "abstract", "any", "as", "async", "await", "boolean", "break", "case", "catch", "class",
    "const", "continue", "debugger", "declare", "default", "delete", "do", "else", "enum",
    "export", "extends", "false", "finally", "for", "from", "function", "get", "if",
    "implements", "import", "in", "instanceof", "interface", "is", "keyof", "let", "module",
    "namespace", "new", "null", "number", "object", "of", "package", "private", "protected",
    "public", "readonly", "require", "return", "set", "static", "string", "super", "switch",
    "symbol", "this", "throw", "true", "try", "type", "typeof", "undefined", "var", "void",
    "while", "with", "yield"
]);

export function highlightTypeScript(code: string): string {
    // Master Regex
    // 1. Comments (Single line // or Multi line /* ... */)
    // 2. Strings (Double ", Single ', or Template `)
    // 3. Numbers
    // 4. Identifiers (Allow $ and _)
    // 5. Operators (Includes =>, ..., ===, !==, etc.)
    // 6. Punctuation
    const tokenRegex = /(\/\/.*|\/\*[\s\S]*?\*\/)|("(?:\\[\s\S]|[^"])*"|'(?:\\[\s\S]|[^'])*'|`(?:\\[\s\S]|[^`])*`)|(\b\d+(?:\.\d+)?\b)|(\b[a-zA-Z_$]\w*\b)|(\+{1,2}|-{1,2}|\*|\/|%|\^|&{1,2}|\|{1,2}|={1,3}|!={1,2}|<=|>=|<|>|!|\?{1,2}|\.{3}|=>)|([(){}\[\],.;:])/g;

    let match;
    let lastIndex = 0;
    let html = '';

    while ((match = tokenRegex.exec(code)) !== null) {
        // 1. Handle skipped text (whitespace/unknown)
        if (match.index > lastIndex) {
            html += escapeHtml(code.slice(lastIndex, match.index));
        }

        const fullMatch = match[0];

        // 2. Determine Token Type
        if (match[1]) { // Comment
            html += `<span class="comment">${escapeHtml(fullMatch)}</span>`;
        } else if (match[2]) { // String
            html += `<span class="string">${escapeHtml(fullMatch)}</span>`;
        } else if (match[3]) { // Number
            html += `<span class="number">${escapeHtml(fullMatch)}</span>`;
        } else if (match[4]) { // Identifier
            if (TS_KEYWORDS.has(fullMatch)) {
                html += `<span class="keyword">${escapeHtml(fullMatch)}</span>`;
            } else if (code[tokenRegex.lastIndex] === '(') {
                // Function Call Peek
                html += `<span class="function">${escapeHtml(fullMatch)}</span>`;
            } else if (/^[A-Z]/.test(fullMatch)) {
                // Heuristic: PascalCase usually indicates a Class or Type in TS
                html += `<span class="class">${escapeHtml(fullMatch)}</span>`;
            } else {
                html += `<span class="identifier">${escapeHtml(fullMatch)}</span>`;
            }
        } else if (match[5]) { // Operator
            html += `<span class="operator">${escapeHtml(fullMatch)}</span>`;
        } else if (match[6]) { // Punctuation
            html += `<span class="punctuation">${escapeHtml(fullMatch)}</span>`;
        }

        lastIndex = tokenRegex.lastIndex;
    }

    // 3. Append remaining text
    if (lastIndex < code.length) {
        html += escapeHtml(code.slice(lastIndex));
    }

    return html;
}

function escapeHtml(text: string): string {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
