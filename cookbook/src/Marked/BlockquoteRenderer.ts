import { MarkedExtension, Tokens } from 'marked';

const iconMap: { [key: string]: string } = {
    note:    'fa fa-sticky-note',
    info:    'fa fa-info-circle',
    tip:     'fa fa-lightbulb',
    warning: 'fa fa-triangle-exclamation',
    caution: 'fa fa-exclamation-triangle',
};

export const blockquoteRenderer: MarkedExtension = {
    renderer: {
        blockquote(token)
        {
            // 1. Peek at the first token to check if it's a paragraph containing the alert tag
            const firstToken = token.tokens?.[0];

            // Define the regex to find the [!TYPE]
            const regex = /^\s*\[!(\w+)]\s*/;

            let alertType = null;

            // Check if the first token is a paragraph and contains the tag in its raw text
            if (firstToken?.type === 'paragraph' && regex.test(firstToken.text)) {
                const match = firstToken.text.match(regex);

                if (match) {
                    const type = match[1].toLowerCase();

                    // Only process if it is a known type
                    if (iconMap[type]) {
                        alertType = type;

                        // 2. STRIP THE TAG
                        // We must remove the [!NOTE] text from the paragraph token
                        // so it doesn't appear in the final rendered output.

                        // Remove from the raw text of the paragraph
                        firstToken.text = firstToken.text.replace(regex, '').trim();

                        // CRITICAL: Marked has already tokenized the paragraph into inline tokens.
                        // We must also clean the specific inline 'text' token that holds the tag.
                        if (firstToken.tokens && firstToken.tokens[0]?.type === 'text') {
                            const firstInlineToken = firstToken.tokens[0] as Tokens.Text;
                            firstInlineToken.text = firstInlineToken.text.replace(regex, '');
                        }
                    }
                }
            }

            // 3. Parse the content
            // Now that we've cleaned the tokens, we parse them.
            // this.parser.parse() handles block tokens (like paragraphs) correctly.
            const content = this.parser.parse(token.tokens!);

            // 4. Return default blockquote if no valid type found
            if (! alertType) {
                return `<blockquote>${content}</blockquote>`;
            }

            // 5. Return the custom alert structure
            return `
                <blockquote class="rich-block ${alertType}">
                    <div class="icon"><i class="${iconMap[alertType]}"></i></div>
                    <div class="text">${content}</div>
                </blockquote>`;
        },
    },
};
