import { isString, mapValues, omit, remove, template } from "lodash-es";
import micromatch from "micromatch";
import { getBranches } from "../git.js";

export default async (repositoryUrl, { cwd }, branches) => {
  const gitBranches = await getBranches(repositoryUrl, { cwd });

  return branches.reduce(
    (branches, branch) => [
      ...branches,
      ...remove(gitBranches, (name) => {
        let finalBranchName = branch.name;
        let version = branch.name;

        if (branch.version) {
          version = branch.version;
          finalBranchName = template(finalBranchName)({ version });
        }

        const result = micromatch(gitBranches, finalBranchName).includes(name);

        return result;
      }).map((name) => {
        let version = name;
        if (branch.version) {
          // we need to wrap branch.version on brackets to be able to capture version
          const branchName = template(branch.name)({ version: `(${branch.version})` });
          version = micromatch.capture(branchName, name)[0];
        }

        const result = {
          name,
          version,
          ...mapValues(omit(branch, ["name", "version"]), (value) =>
            isString(value) ? template(value)({ name }) : value
          ),
        };

        return result;
      }),
    ],
    []
  );
};
