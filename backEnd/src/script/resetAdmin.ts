import readline from "readline";
import { getConfig } from "../config/config";
import { saveAndCloseProjectDb } from "../db/dbManager";
import { resetAccount, validateCredentials } from "../auth/authStore";

/**
 * Replace the single account's username and password and invalidate every
 * session. The caller must make sure the backend is stopped first: LokiJS is
 * memory-backed with periodic autosave and a running process would overwrite
 * the change.
 */
export async function resetAdmin(
  dbPath: string,
  username: string,
  password: string
): Promise<void> {
  const error = validateCredentials(username, password);
  if (error) {
    throw new Error(error);
  }
  await resetAccount(dbPath, username.trim(), password);
}

function createHiddenQuestioner() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  const originalWrite = (rl as any)._writeToOutput.bind(rl);
  (rl as any)._writeToOutput = (text: string) => {
    if (!(rl as any).muted) {
      originalWrite(text);
    }
  };
  // Answers may arrive before their question is asked (piped input), so both
  // waiting resolvers and already-received lines are kept.
  const pending: Array<(line: string) => void> = [];
  const answers: string[] = [];
  rl.on("line", (line: string) => {
    const resolve = pending.shift();
    if (resolve) {
      (rl as any).muted = false;
      process.stdout.write("\n");
      resolve(line);
    } else {
      answers.push(line);
    }
  });
  return {
    question(prompt: string): Promise<string> {
      (rl as any).muted = true;
      process.stdout.write(prompt);
      const buffered = answers.shift();
      if (buffered !== undefined) {
        process.stdout.write("\n");
        (rl as any).muted = false;
        return Promise.resolve(buffered);
      }
      return new Promise((resolve) => {
        pending.push(resolve);
      });
    },
    close() {
      rl.close();
    },
  };
}

async function main() {
  const username = process.argv[2];
  if (!username) {
    console.error(
      "usage: yarn workspace back-end reset-admin <new-username>"
    );
    process.exit(1);
  }
  const prompt = createHiddenQuestioner();
  try {
    const password = await prompt.question("New password: ");
    const confirmation = await prompt.question("Confirm new password: ");
    if (password !== confirmation) {
      console.error("passwords do not match");
      process.exit(1);
    }
    const config = getConfig();
    await resetAdmin(config.database.path, username, password);
    await saveAndCloseProjectDb(config.database.path);
  } finally {
    prompt.close();
  }
  process.stdout.write(
    `account reset for "${username.trim()}"\nstart the backend again and log in with the new credentials\n`,
    () => process.exit(0)
  );
}

if (require.main === module) {
  main().catch((error) => {
    process.stderr.write(`${error.message}\n`, () => process.exit(1));
  });
}
