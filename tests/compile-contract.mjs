import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import solc from "solc";

const contractPath = "contracts/MalkutaEngine.sol";
const input = {
  language: "Solidity",
  sources: { [contractPath]: { content: readFileSync(contractPath, "utf8") } },
  settings: {
    optimizer: { enabled: true, runs: 200 },
    outputSelection: { "*": { "*": ["abi", "evm.bytecode.object", "evm.deployedBytecode.object"] } },
  },
};

function resolveImport(importPath) {
  try {
    return { contents: readFileSync(resolve("node_modules", importPath), "utf8") };
  } catch {
    return { error: `Import not found: ${importPath}` };
  }
}

const output = JSON.parse(solc.compile(JSON.stringify(input), { import: resolveImport }));
const errors = (output.errors ?? []).filter((item) => item.severity === "error");
assert.deepEqual(errors, [], errors.map((item) => item.formattedMessage).join("\n"));
const artifact = output.contracts?.[contractPath]?.MalkutaEngine;
assert.ok(artifact?.abi?.length, "Compiled ABI is missing.");
assert.ok(artifact?.evm?.bytecode?.object, "Compiled bytecode is missing.");
const deployedBytes = artifact.evm.deployedBytecode.object.length / 2;
assert.ok(deployedBytes <= 24_576, `Deployed bytecode is ${deployedBytes} bytes and exceeds the EIP-170 limit.`);
console.log(`MalkutaEngine compiled with solc ${solc.version()} (${artifact.abi.length} ABI entries, ${deployedBytes} deployed bytes).`);
