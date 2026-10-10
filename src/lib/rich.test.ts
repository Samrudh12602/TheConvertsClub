import { describe, expect, it } from "vitest";
import { imageIds, splitRich, stripMarkup } from "./rich";

describe("rich text", () => {
  it("splits underlined words and pictures, and leaves everything else as plain text", () => {
    expect(splitRich("a <u>b</u> c [[img:abc123|320]] <b>d</b>")).toEqual([
      { text: "a ", underline: false }, { text: "b", underline: true }, { text: " c ", underline: false },
      { text: "", underline: false, image: { id: "abc123", width: 320 } }, { text: " <b>d</b>", underline: false },
    ]);
  });
  it("a picture without a width, and a malformed marker", () => {
    expect(splitRich("[[img:x1]]")[0].image).toEqual({ id: "x1", width: null });
    expect(splitRich("[[img:../etc]]")).toEqual([{ text: "[[img:../etc]]", underline: false }]);
  });
  it("strips the markup for titles and finds picture ids", () => {
    expect(stripMarkup("see <u>this</u> [[img:q9|10]] now")).toBe("see this [figure] now");
    expect(imageIds("[[img:a1]] and [[img:b2|9]]")).toEqual(["a1", "b2"]);
    expect(imageIds(null)).toEqual([]);
  });
});
