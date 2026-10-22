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

  describe("startOfDayInTimeZone tests", () => {
    it("should return the instant the day starts in São Paulo (UTC-3)", () => {
      const result = dateConvert.startOfDayInTimeZone(new Date("2026-03-01T00:00:00Z"));

      expect(result.toISOString()).toBe("2026-03-01T03:00:00.000Z");
    });

    it("should ignore the time of the informed date", () => {
      const result = dateConvert.startOfDayInTimeZone(new Date("2026-03-01T18:45:00Z"));

      expect(result.toISOString()).toBe("2026-03-01T03:00:00.000Z");
    });

    it("should keep UTC midnight when the time zone is UTC", () => {
      const utc = new DateConvert("UTC");

      expect(utc.startOfDayInTimeZone(new Date("2026-03-01T00:00:00Z")).toISOString()).toBe("2026-03-01T00:00:00.000Z");
    });

    it("should handle time zones ahead of UTC", () => {
      const tokyo = new DateConvert("Asia/Tokyo");

      expect(tokyo.startOfDayInTimeZone(new Date("2026-03-01T00:00:00Z")).toISOString()).toBe("2026-02-28T15:00:00.000Z");
    });

    it("should handle daylight saving time transitions", () => {
      const newYork = new DateConvert("America/New_York");

      expect(newYork.startOfDayInTimeZone(new Date("2026-03-08T00:00:00Z")).toISOString()).toBe("2026-03-08T05:00:00.000Z");
      expect(newYork.startOfDayInTimeZone(new Date("2026-03-09T00:00:00Z")).toISOString()).toBe("2026-03-09T04:00:00.000Z");
    });
  });
});
