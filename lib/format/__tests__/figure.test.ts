import { splitFigure } from "../figure";

describe("splitFigure", () => {
  it("separates the decimals so they can be set smaller", () => {
    expect(splitFigure("10.51")).toEqual(["10", ".51"]);
    expect(splitFigure("0.70")).toEqual(["0", ".70"]);
  });

  it("handles the French comma", () => {
    expect(splitFigure("1,5")).toEqual(["1", ",5"]);
  });

  it("leaves a whole number alone", () => {
    expect(splitFigure("83")).toEqual(["83", null]);
    expect(splitFigure("—")).toEqual(["—", null]);
  });

  it("keeps a signed value's sign with the whole part", () => {
    expect(splitFigure("-12.40")).toEqual(["-12", ".40"]);
    expect(splitFigure("+8.25")).toEqual(["+8", ".25"]);
  });

  // adjustsFontSizeToFit shrinks the whole part on its own; a separately
  // sized fraction would then be left oversized next to it.
  it("does not split a long whole part", () => {
    expect(splitFigure("123456.78")).toEqual(["123456.78", null]);
  });
});
