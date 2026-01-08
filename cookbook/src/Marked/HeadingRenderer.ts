import {MarkedExtension} from 'marked';

let headingStack: {text: string, slug: string, depth: number}[] = [];

export const headingRenderer: MarkedExtension<string, string> = {
    renderer: {
        heading({tokens, depth}) {
            const text = this.parser.parseInline(tokens);
            const escaped = text.toLowerCase().replace(/[^\w]+/g, '-');

            // Maintain a stack of headings to build a proper hierarchy
            while (headingStack.length > 0 && headingStack[headingStack.length - 1].depth >= depth) {
                headingStack.pop();
            }

            headingStack.push({text, slug: escaped, depth});

            const fullSlug = headingStack.map(h => h.slug).join('-');

            return `<h${depth} id="${fullSlug}">${text}</h${depth}>`;
        }
    }
}
