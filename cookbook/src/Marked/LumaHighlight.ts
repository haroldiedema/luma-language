import {Keywords} from '@luma/Tokenizer';

export function highlightLuma(code: string): string {
    // Master Regex to capture all tokens
    // 1. Comments
    // 2. Strings
    // 3. Numbers
    // 4. Identifiers (Keywords checked later)
    // 5. Operators
    // 6. Punctuation
    const tokenRegex = /(\/\/.*|\/\*[\s\S]*?\*\/)|("(?:\\[\s\S]|[^"])*"|'(?:\\[\s\S]|[^'])*')|(\b\d+(?:\.\d+)?\b)|(\b[a-zA-Z_]\w*\b)|(\+|-|\*|\/|%|\^|==|!=|<=|>=|<|>|=|!|\.\.|is)|([(){}\[\],.])/g;

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
            html += `<span class="luma-comment">${escapeHtml(fullMatch)}</span>`;
        } else if (match[2]) { // String
            html += `<span class="luma-string">${escapeHtml(fullMatch)}</span>`;
        } else if (match[3]) { // Number
            html += `<span class="luma-number">${escapeHtml(fullMatch)}</span>`;
        } else if (match[4]) { // Identifier
            if (Keywords.includes(fullMatch as any)) {
                html += `<span class="luma-keyword">${escapeHtml(fullMatch)}</span>`;
            } else if (code[tokenRegex.lastIndex] === '(') {
                // Peek ahead: is it a function call?
                html += `<span class="luma-function">${escapeHtml(fullMatch)}</span>`;
            } else {
                // Just a regular identifier
                html += `<span class="luma-identifier">${escapeHtml(fullMatch)}</span>`;
            }
        } else if (match[5]) { // Operator
            html += `<span class="luma-operator">${escapeHtml(fullMatch)}</span>`;
        } else if (match[6]) { // Punctuation
            html += `<span class="luma-punctuation">${escapeHtml(fullMatch)}</span>`;
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
