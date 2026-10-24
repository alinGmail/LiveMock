import { runResetAdminCli } from "../script/resetAdmin";

// Thin entry for the `yarn reset-admin <username>` script. It contains no
// action of its own, so it can safely be inlined into the server bundle.
runResetAdminCli(process.argv.slice(2), "yarn workspace livemock reset-admin <new-username>").catch(
  (error) => {
    process.stderr.write(`${error.message}\n`, () => process.exit(1));
  }
);
