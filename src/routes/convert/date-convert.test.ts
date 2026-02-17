import { DateConvert } from "./date-convert.utils";

describe("date convert tests", () => {
  const dateConvert = new DateConvert();

  describe("dateToSeconds tests", () => {
    it("should convert date to seconds", () => {
      const date = new Date("2000-01-01T00:00:00Z");

      const result = dateConvert.dateToSeconds(date);

      expect(result).toBe(946684800);
    });
  });

  describe("secondsToDate tests", () => {
    it("should convert seconds to date", () => {
      const seconds = 946684800;

      const result = dateConvert.secondsToDate(seconds);

      expect(result.getTime()).toBe(seconds * 1000);
    });
  });
});
