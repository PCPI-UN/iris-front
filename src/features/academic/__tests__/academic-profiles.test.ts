import {
  teachingProfileFromSlug,
  teachingProfilesOf,
} from "../utils/academic-profiles";

describe("academic profiles", () => {
  it("keeps only the profiles with a teaching screen, professor first", () => {
    expect(
      teachingProfilesOf(["DEAN", "DIRECTOR", "TUTOR", "PROFESSOR"]),
    ).toEqual(["PROFESSOR", "TUTOR", "DIRECTOR", "DEAN"]);
    expect(teachingProfilesOf([])).toEqual([]);
  });

  it("reads the profile from the URL segment", () => {
    expect(teachingProfileFromSlug("tutor")).toBe("TUTOR");
    expect(teachingProfileFromSlug("dean")).toBe("DEAN");
    expect(teachingProfileFromSlug("director")).toBe("DIRECTOR");
    expect(teachingProfileFromSlug("admin")).toBeUndefined();
  });
});
