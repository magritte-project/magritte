const READ_MORE = /\s*<a\b[^>]*>\s*Read more on Last\.fm\s*<\/a>\s*\.?\s*$/i

/** The `Read more on Last.fm` link Last.fm appends to every bio and wiki */
export function extractReadMoreUrl(html: string): string | undefined {
    const match = READ_MORE.exec(html)
    if (match === null) {
        return undefined
    }
    const href = /href="([^"]+)"/i.exec(match[0])
    return href?.[1] ? decodeEntities(href[1]) : undefined
}

/** Drop Last.fm's trailing `Read more` link, and the full stop it leaves behind */
export function stripReadMoreTail(html: string): string {
    return html.replace(READ_MORE, "").trim()
}

function decodeEntities(text: string): string {
    const parser = new DOMParser()
    return parser.parseFromString(text, "text/html").documentElement.textContent ?? ""
}

/**
 * Reduce HTML to plain text, keeping paragraph breaks as blank lines. Nothing
 * from an external source is ever rendered as HTML, so this is the only route
 * prose takes onto the page.
 */
export function htmlToText(html: string): string {
    const document = new DOMParser().parseFromString(html, "text/html")
    // Block elements become paragraph breaks, line breaks stay line breaks
    for (const br of document.querySelectorAll("br")) {
        br.replaceWith("\n")
    }
    for (const block of document.querySelectorAll(
        "p, div, li, h1, h2, h3, h4, h5, h6, blockquote",
    )) {
        block.prepend("\n\n")
        block.append("\n\n")
    }
    const text = document.body.textContent ?? ""
    return text
        .replace(/\r/g, "")
        .split(/\n{2,}/)
        .map((paragraph) =>
            paragraph
                .split("\n")
                .map((line) => line.replace(/[ \t ]+/g, " ").trim())
                .filter((line) => line.length > 0)
                .join("\n"),
        )
        .filter((paragraph) => paragraph.length > 0)
        .join("\n\n")
}
