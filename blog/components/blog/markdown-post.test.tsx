import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MarkdownPost } from "./markdown-post";

describe("MarkdownPost", () => {
  it("renders markdown headings, lists and links to HTML", () => {
    const md = "## Заголовок\n\n- пункт один\n- пункт два\n\n[ссылка](https://example.com)";
    const html = renderToStaticMarkup(<MarkdownPost content={md} lang="ru" />);
    expect(html).toContain("<h2>Заголовок</h2>");
    expect(html).toContain("<li>пункт один</li>");
    expect(html).toContain('href="https://example.com"');
    expect(html).toContain('lang="ru"');
  });

  it("renders empty content without crashing", () => {
    const html = renderToStaticMarkup(<MarkdownPost content="" />);
    expect(typeof html).toBe("string");
  });
});
