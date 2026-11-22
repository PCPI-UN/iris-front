import { TutorsList } from "../tutors-list";

import { rtlRender, screen } from "@/testing/test-utils";

test("shows linked tutors first and marks the pending ones", () => {
  rtlRender(
    <TutorsList
      tutors={[
        {
          firstName: "Laura",
          lastName: "Gómez",
          pending: true,
          email: "l@uni.edu",
        },
        { userId: 4, firstName: "Ana", lastName: "Ruiz", pending: false },
      ]}
    />,
  );

  const items = screen.getAllByRole("listitem").map((item) => item.textContent);

  expect(items).toEqual(["Ana Ruiz", "Laura Gómez · Pendiente"]);
});

test("a project without tutors says so", () => {
  rtlRender(<TutorsList tutors={[]} />);

  expect(screen.getByText("Sin tutor registrado")).toBeInTheDocument();
});

test("a project read before tutors existed does not break", () => {
  rtlRender(<TutorsList />);

  expect(screen.getByText("Sin tutor registrado")).toBeInTheDocument();
});
