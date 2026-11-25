import {
  teachingProfileFromSlug,
  teachingProfilesOf,
} from "../utils/academic-profiles";

describe("academic profiles", () => {
  it("keeps only the profiles with a teaching screen, professor first", () => {
    expect(teachingProfilesOf(["DEAN", "TUTOR", "PROFESSOR"])).toEqual([
      "PROFESSOR",
      "TUTOR",
    ]);
    expect(teachingProfilesOf(["DIRECTOR"])).toEqual([]);
  });

  it("reads the profile from the URL segment", () => {
    expect(teachingProfileFromSlug("tutor")).toBe("TUTOR");
    expect(teachingProfileFromSlug("dean")).toBeUndefined();
  });
});
