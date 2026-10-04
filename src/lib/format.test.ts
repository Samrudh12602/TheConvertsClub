import { describe, expect, it } from "vitest";
import { tidyName } from "./format";

describe("tidyName", () => {
  it("fixes all-caps and all-lowercase names", () => {
    expect(tidyName("ANKIT SINHA")).toBe("Ankit Sinha");
    expect(tidyName("ankit sinha")).toBe("Ankit Sinha");
    expect(tidyName("ANNA-MARIA O'NEIL")).toBe("Anna-Maria O'Neil");
  });
  it("leaves mixed-case names exactly as typed", () => {
    expect(tidyName("McDonald")).toBe("McDonald");
    expect(tidyName("Rohit Kulkarni")).toBe("Rohit Kulkarni");
  });
  it("copes with nothing", () => expect(tidyName(null)).toBe(""));
});
