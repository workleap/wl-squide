// Copies the workleap-squide agent skill into the package at pack time so pnpm can link it into consumer projects.
// The skill source of truth stays in agent-skills/ for the skills.sh installation.
import { cpSync, rmSync } from "node:fs";
import { resolve } from "node:path";

const source = resolve(import.meta.dirname, "../../../agent-skills/workleap-squide");
const destination = resolve(import.meta.dirname, "../skills");

const command = process.argv[2];

rmSync(destination, { recursive: true, force: true });

if (command === "copy") {
    cpSync(source, resolve(destination, "workleap-squide"), { recursive: true });
} else if (command !== "clean") {
    throw new Error(`Unknown command "${command}". Expected "copy" or "clean".`);
}
