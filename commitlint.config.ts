import type { UserConfig, Rule } from "@commitlint/types";

const config: UserConfig = {
  parserPreset: {
    parserOpts: {
      headerPattern: /^\[([^\]]+)\]:\s(.+)$/,
      headerCorrespondence: ["taskId", "subject"],
    },
  },
  rules: {
    "task-id-empty": [2, "always"],
    "subject-empty": [2, "never"],
    "subject-case": [0],
  },
  plugins: [
    {
      rules: {
        "task-id-empty": ((parsed) => {
          const { taskId } = parsed as { taskId?: string };
          return [!!taskId, "Task ID may not be empty — expected format: [taskId]: message (e.g. [CU-86e0d06jy]: add component)"];
        }) as Rule,
      },
    },
  ],
};

export default config;