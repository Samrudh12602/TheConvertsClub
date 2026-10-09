import { describe, expect, it } from "vitest";
import { areaFor, topicFor } from "./mock-topics";

describe("topic tagging", () => {
  it("recognises common SNAP question types from the text", () => {
    expect(topicFor("General English", "Directions: Select the option that correctly expresses the given sentence in Passive Voice.")).toBe("Voice (active/passive)");
    expect(topicFor("General English", "Directions: Choose the word that is most nearly OPPOSITE in meaning to the underlined word")).toBe("Antonyms");
    expect(topicFor("Reasoning", 'In a certain code language, "PLANET" is written as "RKCMGS".')).toBe("Coding-decoding");
    expect(topicFor("Quant", "The 5th term of an arithmetic progression is 23")).toBe("Progressions");
    expect(topicFor("Quant", "If sin θ = 3/5 and θ is acute, find tan θ")).toBe("Trigonometry");
    expect(topicFor("Quant", "Is the positive integer n divisible by 6? Statement 1: n is divisible by 3.")).toBe("Data sufficiency");
    expect(topicFor("Quant", "A train 240 m long crosses a platform 360 m long in 30 seconds. What is the speed of the train?")).toBe("Time, speed & distance");
  });
  it("tags every question in the ethics section the same way", () => {
    expect(topicFor("Ethics, Morality & Values", "You notice an error in a report you sent a client.")).toBe("Ethical dilemmas");
  });
  it("falls back to the section name when nothing matches", () => {
    expect(topicFor("Analytical & Logical Reasoning", "zzz qqq")).toBe("Analytical and Logical Reasoning");
  });
});

describe("skill areas", () => {
  it("groups related topics", () => {
    expect(areaFor("Antonyms", "General English")).toBe("Vocabulary");
    expect(areaFor("Error spotting", "General English")).toBe("Grammar and usage");
    expect(areaFor("Probability", "Quant")).toBe("Data and counting");
    expect(areaFor("Ethical dilemmas", "Ethics")).toBe("Ethics and values");
  });
  it("uses the section name for a topic it doesn't know", () => {
    expect(areaFor("Something new", "Quantitative Ability & DI")).toBe("Quantitative Ability and DI");
    expect(areaFor(null, "General English")).toBe("General English");
  });
});
