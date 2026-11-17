import { describe, expect, test } from "bun:test";

import { PAGE_ROUTE_FILENAME_PATTERN, ROUTE_FILE_GLOB } from "./route-filenames";

/** Whether `filename` satisfies the Astro/Next.js page-route grammar */
function isPageRoute(filename: string): boolean {
  return new RegExp(PAGE_ROUTE_FILENAME_PATTERN, "u").test(filename);
}

describe("PAGE_ROUTE_FILENAME_PATTERN", () => {
  test.each(["index", "posts", "my-page", "logo", "style.css", "rss.xml"])(
    "accepts the plain page name %p",
    (filename) => expect(isPageRoute(filename)).toBe(true),
  );

  test.each(["_app", "_document", "_error", "_private"])(
    "accepts the special page %p behind an underscore",
    (filename) => expect(isPageRoute(filename)).toBe(true),
  );

  test.each(["[slug]", "[...slug]", "[[...slug]]", "[lang]-[version]", "[a-b]"])(
    "accepts the route param form %p",
    (filename) => expect(isPageRoute(filename)).toBe(true),
  );

  test("accepts a route param with one dotted suffix", () => {
    expect(isPageRoute("[slug].json")).toBe(true);
  });

  test.each(["[Slug]", "my_page", "a.b.c", "[slug].rss.xml", ""])("rejects %p", (filename) =>
    expect(isPageRoute(filename)).toBe(false),
  );
});

describe("ROUTE_FILE_GLOB", () => {
  test("covers the route directory in every source extension", () => {
    for (const extension of ["js", "jsx", "ts", "tsx"])
      expect(ROUTE_FILE_GLOB).toContain(extension);
  });

  test("is anchored on a routes directory", () => {
    expect(ROUTE_FILE_GLOB.startsWith("**/routes/")).toBe(true);
  });
});
