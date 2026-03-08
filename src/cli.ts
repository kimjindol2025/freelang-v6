#!/usr/bin/env node
// FreeLang v6: CLI + REPL

import * as fs from "fs";
import * as path from "path";
import * as readline from "readline";
import { run, runWithTrace } from "./index";
import { lex } from "./lexer";
import { parse } from "./parser";
import { compile } from "./compiler";
import { VM } from "./vm";
import { CCodegen } from "./codegen/c-codegen";

const VERSION = "6.0.0";

function usage() {
  console.log(`FreeLang v${VERSION}
Usage:
  freelang run <file>     Run a .fl file
  freelang eval "<code>"  Evaluate code string
  freelang trace "<code>" Evaluate code with PC trace
  freelang repl           Start interactive REPL
  freelang --version      Show version
  freelang --help         Show help`);
}

function runFile(filePath: string) {
  const resolved = path.resolve(filePath);
  if (!fs.existsSync(resolved)) {
    console.error(`Error: File not found: ${resolved}`);
    process.exit(1);
  }
  const source = fs.readFileSync(resolved, "utf-8");
  try {
    const output = run(source, path.dirname(resolved));
    for (const line of output) process.stdout.write(line);
  } catch (e: any) {
    console.error(e.message);
    process.exit(1);
  }
}

function evalCode(code: string) {
  try {
    const output = run(code);
    for (const line of output) process.stdout.write(line);
  } catch (e: any) {
    console.error(e.message);
    process.exit(1);
  }
}

function emitC(filePath: string) {
  const resolved = path.resolve(filePath);
  if (!fs.existsSync(resolved)) {
    console.error(`Error: File not found: ${resolved}`);
    process.exit(1);
  }
  const source = fs.readFileSync(resolved, "utf-8");
  try {
    const tokens = lex(source);
    const ast = parse(tokens);
    const codegen = new CCodegen();
    const cCode = codegen.generate(ast);
    console.log(cCode);
  } catch (e: any) {
    console.error(e.message);
    process.exit(1);
  }
}

function startRepl() {
  console.log(`FreeLang v${VERSION} REPL (type "exit" to quit)`);
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, prompt: ">> " });

  // Persistent VM state for REPL
  let globals = new Map<string, any>();

  rl.prompt();
  rl.on("line", (line) => {
    const input = line.trim();
    if (input === "exit" || input === "quit") { rl.close(); return; }
    if (input === "") { rl.prompt(); return; }
    try {
      const tokens = lex(input);
      const ast = parse(tokens);
      const chunk = compile(ast);
      const vm = new VM(chunk, globals);
      const result = vm.run();
      globals = vm.getGlobals();
      for (const line of result.output) process.stdout.write(line);
    } catch (e: any) {
      console.error(`Error: ${e.message}`);
    }
    rl.prompt();
  });
  rl.on("close", () => { console.log("Bye!"); process.exit(0); });
}

// Main entry point
export function main(args: string[]) {
  if (args.length === 0 || args[0] === "repl") {
    startRepl();
  } else if (args[0] === "run" && args[1]) {
    runFile(args[1]);
  } else if (args[0] === "eval" && args[1]) {
    evalCode(args[1]);
  } else if (args[0] === "trace" && args[1]) {
    // Trace mode: eval code with PC tracing
    try {
      const result = runWithTrace(args[1]);
      for (const line of result.output) process.stdout.write(line);
      console.log("\n=== PC Trace Log ===");
      for (const log of result.trace) console.log(log);
    } catch (e: any) {
      console.error(e.message);
      process.exit(1);
    }
  } else if (args[0] === "--emit-c" && args[1]) {
    emitC(args[1]);
  } else if (args[0] === "--version" || args[0] === "-v") {
    console.log(`FreeLang v${VERSION}`);
  } else if (args[0] === "--help" || args[0] === "-h") {
    usage();
  } else if (args[0].endsWith(".fl") || args[0].endsWith(".freelang")) {
    runFile(args[0]);
  } else {
    usage();
    process.exit(1);
  }
}

// Run immediately if called as main script
if (require.main === module) {
  main(process.argv.slice(2));
}
