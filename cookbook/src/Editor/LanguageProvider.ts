import { KeywordMetadata }     from '@/Editor/KeywordMetadata';
import { Keywords, Operators } from '@luma/Tokenizer';

const VARIABLE_REGEX = /^(\s*)([a-zA-Z_]\w*)(?:\s*[:=])/;

export class LanguageProvider
{
    private monaco: typeof monaco;

    public setup(): void
    {
        this.monaco = (window as any).monaco;
        const languages = monaco.languages.getLanguages();
        if (languages.some(l => l.id === 'luma')) return;

        this.monaco.languages.register({id: 'luma'});

        this.setLanguageConfiguration();
        this.setMonarchTokensProvider();
        this.registerCompletionItemProvider();
        this.registerHoverProvider();
    }

    private async waitForMonacoAvailability(): Promise<void>
    {
        if (typeof (window as any).monaco !== 'undefined') {
            return Promise.resolve();
        }

        await new Promise((resolve) => setTimeout(resolve, 100));
        return this.waitForMonacoAvailability();
    }

    private setLanguageConfiguration(): void
    {
        this.monaco.languages.setLanguageConfiguration('luma', {
            comments:         {
                lineComment:  '//',
                blockComment: ['/*', '*/'],
            },
            brackets:         [
                ['{', '}'],
                ['[', ']'],
                ['(', ')'],
            ],
            autoClosingPairs: [
                {open: '{', close: '}'},
                {open: '[', close: ']'},
                {open: '(', close: ')'},
                {open: '"', close: '"'},
                {open: '\'', close: '\''},
            ],
            surroundingPairs: [
                {open: '{', close: '}'},
                {open: '[', close: ']'},
                {open: '(', close: ')'},
                {open: '"', close: '"'},
                {open: '\'', close: '\''},
            ],
            onEnterRules:     [
                {
                    beforeText: /:\s*$/,
                    action:     {
                        indentAction: monaco.languages.IndentAction.Indent,
                    },
                },
            ],
        });
    }

    private setMonarchTokensProvider(): void
    {
        this.monaco.languages.setMonarchTokensProvider('luma', {
            keywords:  Keywords,
            operators: Object.values(Operators),
            symbols:   /[=><!~?:&|+\-*\/^%]+/,

            tokenizer: {
                root: [
                    // Identifiers and keywords
                    [/[a-z_$][\w$]*/, {
                        cases: {
                            '@keywords': 'keyword',
                            '@default':  'identifier',
                        },
                    }],

                    // Type identifiers (Capitalized words like 'Actor', 'Player')
                    [/[A-Z][\w$]*/, 'type.identifier'],

                    // Whitespace
                    {include: '@whitespace'},

                    // Delimiters and operators
                    [/[{}()\[\]]/, '@brackets'],
                    [/[<>](?!@symbols)/, '@brackets'],
                    [/@symbols/, {
                        cases: {
                            '@operators': 'operator',
                            '@default':   '',
                        },
                    }],

                    // Numbers
                    [/\d*\.\d+([eE][\-+]?\d+)?/, 'number.float'],
                    [/\d+/, 'number'],

                    // Strings
                    [/"/, {token: 'string.quote', bracket: '@open', next: '@string'}],
                ],

                string: [
                    [/[^\\"]+/, 'string'],
                    [/\\./, 'string.escape.invalid'],
                    [/"/, {token: 'string.quote', bracket: '@close', next: '@pop'}],
                ],

                whitespace: [
                    [/[ \t\r\n]+/, 'white'],
                    [/\/\*/, 'comment', '@comment'],
                    [/\/\/.*$/, 'comment'],
                ],

                comment: [
                    [/[^\/*]+/, 'comment'],
                    [/\/\*/, 'comment', '@push'],    // nested comment support
                    ['\\*/', 'comment', '@pop'],
                    [/[\/*]/, 'comment'],
                ],
            },
        });
    }

    private registerCompletionItemProvider(): void
    {
        this.monaco.languages.registerCompletionItemProvider('luma', {
            provideCompletionItems: (model, position) => {
                const word  = model.getWordUntilPosition(position);
                const range = {
                    startLineNumber: position.lineNumber,
                    endLineNumber:   position.lineNumber,
                    startColumn:     word.startColumn,
                    endColumn:       word.endColumn,
                };

                const suggestions         = Keywords.map((keyword: string) => this.createKeywordItem(keyword, range));
                const variableSuggestions = this.getScopedVariables(model, position).map(v => ({
                    label:         v.name,
                    kind:          this.monaco.languages.CompletionItemKind.Variable,
                    detail:        `(Line ${v.line})`,
                    documentation: `Defined in parent scope at line ${v.line}`,
                    insertText:    v.name,
                    range:         range,
                }));

                return {suggestions: [...suggestions, ...variableSuggestions]};
            },
        });
    }

    private registerHoverProvider(): void
    {
        this.monaco.languages.registerHoverProvider('luma', {
            provideHover: (model, position) => {
                const word = model.getWordAtPosition(position);

                if (! word || ! KeywordMetadata[word.word]) {
                    return null;
                }

                return {
                    range:    new this.monaco.Range(
                        position.lineNumber, word.startColumn,
                        position.lineNumber, word.endColumn,
                    ),
                    contents: [
                        {value: this.getDocumentationOf(word.word)},
                    ],
                };
            },
        });
    }

    /**
     * Scans upwards from the cursor to find variables visible in the current scope.
     */
    private getScopedVariables(model: monaco.editor.ITextModel, position: monaco.Position)
    {
        const variables: { name: string; line: number }[] = [];
        const seenNames                                   = new Set<string>();

        // Start looking from the line above the cursor
        let lineIndex = position.lineNumber - 1;

        // We only care about lines with indentation <= cursor's current indentation
        // (i.e. parents and siblings, not children of previous blocks)
        // We approximate indentation by column count for simplicity.
        let minIndent = model.getLineContent(position.lineNumber).search(/\S|$/);
        if (minIndent === -1) minIndent = 0; // Handle empty lines

        while (lineIndex > 0) {
            const lineContent = model.getLineContent(lineIndex);

            // Skip empty lines/comments if needed (simplified here)
            if (! lineContent.trim() || lineContent.trim().startsWith('//')) {
                lineIndex--;
                continue;
            }

            // 1. Calculate indentation of this line
            const currentIndent = lineContent.search(/\S|$/);

            // 2. Scope Logic:
            // If this line is deeper than our current scope "ceiling", we skip it.
            // (It belongs to a block that closed before we reached our cursor)
            if (currentIndent <= minIndent) {

                // Try to match a variable definition
                const match = lineContent.match(VARIABLE_REGEX);
                if (match) {
                    const varName = match[2];

                    // Avoid duplicates (shadowing)
                    if (! seenNames.has(varName)) {
                        variables.push({name: varName, line: lineIndex});
                        seenNames.add(varName);
                    }
                }

                // "Step out": If we found a valid line at a lower indentation,
                // that becomes our new ceiling. We can't see deeper than this anymore.
                minIndent = currentIndent;
            }

            lineIndex--;
        }

        return variables;
    }

    // Helper to keep the main provider clean
    private createKeywordItem(keyword: string, range: any)
    {
        const helpKey  = keyword.toLowerCase();
        const metadata = KeywordMetadata[helpKey];

        let kind            = this.monaco.languages.CompletionItemKind.Keyword;
        let insertText      = keyword;
        let detail          = 'Keyword';
        let insertTextRules = undefined;

        if (metadata) {
            detail = metadata.help.split('.')[0]; // Take just the first sentence

            if (metadata.snippet) {
                kind            = this.monaco.languages.CompletionItemKind.Snippet;
                insertText      = metadata.snippet;
                insertTextRules = this.monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet;
            }
        }

        return {
            label:           keyword,
            kind:            kind,
            detail:          detail,
            documentation:   {value: this.getDocumentationOf(keyword)},
            insertText:      insertText,
            insertTextRules: insertTextRules,
            range:           range,
        };
    }

    private getDocumentationOf(keyword: string): string | undefined
    {
        const helpKey  = keyword.toLowerCase();
        const metadata = KeywordMetadata[helpKey];

        if (! metadata) {
            return undefined;
        }

        let doc = `### ${keyword[0].toUpperCase() + keyword.slice(1).toLowerCase()}\n\n${metadata.help}\n\n`;

        if (metadata.syntax) {
            doc += `\n\n\n\n### Usage:\n\`\`\`luma\n${metadata.syntax}\n\`\`\`\n`;
        }

        return doc;
    }
}
