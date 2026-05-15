import { describe, it, expect } from "vitest";
import { stripHtml } from "./seed-parser";

describe("stripHtml", () => {
  it("removes plain HTML tags", () => {
    expect(stripHtml("<b>And</b> it came to pass")).toBe("And it came to pass");
  });

  it("handles > inside a quoted attribute value without mangling text", () => {
    // CodeQL js/incomplete-multi-character-sanitization: <[^>]+> would stop at
    // the > inside the attribute and leave 'b">' as raw text.
    expect(stripHtml('<img alt="a>b"> word')).toBe("word");
  });

  it("decodes named HTML entities", () => {
    expect(stripHtml("two&nbsp;words")).toBe("two words");
    expect(stripHtml("AT&amp;T")).toBe("AT&T");
    expect(stripHtml("&lt;tag&gt;")).toBe("<tag>");
    expect(stripHtml("she said &quot;yes&quot;")).toBe('she said "yes"');
  });

  it("decodes decimal and hex numeric entities", () => {
    expect(stripHtml("it&#39;s")).toBe("it's");
    expect(stripHtml("it&#x27;s")).toBe("it's");
  });

  it("does not double-decode — &amp;lt; becomes &lt;, not <", () => {
    // CodeQL js/double-escaping: a sequential replace chain turns &amp;lt; → &lt; → <.
    // Single-pass decoding stops at one level: &amp; is consumed, leaving literal "lt;".
    expect(stripHtml("&amp;lt;")).toBe("&lt;");
    // Similarly &amp;amp; → "&" + "amp;" = "&amp;", not bare "&"
    expect(stripHtml("&amp;amp;")).toBe("&amp;");
  });

  it("collapses internal whitespace and trims", () => {
    expect(stripHtml("  two   spaces  ")).toBe("two spaces");
    expect(stripHtml("<span> \n\t word \n </span>")).toBe("word");
  });
});
