#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const configPath =
  process.env.PIN2WIN_AGENT_CONFIG ??
  path.join(process.cwd(), "tools", "windows-agent", "pin2win-agent.config.json");

function readConfig() {
  const raw = fs.readFileSync(configPath, "utf8");
  return JSON.parse(raw);
}

async function requestJson(baseUrl, route, options = {}) {
  const response = await fetch(`${baseUrl}${route}`, {
    ...options,
    headers: {
      "content-type": "application/json",
      ...(options.headers ?? {}),
    },
  });
  const body = await response.json();

  if (!response.ok) {
    throw new Error(`${response.status} ${JSON.stringify(body)}`);
  }

  return body;
}

async function createSession(config) {
  return requestJson(config.pin2WinApiBaseUrl, "/api/simulator/sessions", {
    method: "POST",
    body: JSON.stringify(config.defaultSession),
  });
}

function challengeTypeFromArg(value) {
  const challengeArg = value?.toUpperCase();

  if (challengeArg === "LONGEST_DRIVE" || challengeArg === "LONGEST") {
    return "LONGEST_DRIVE";
  }

  if (challengeArg === "CLOSEST_TO_PIN" || challengeArg === "CLOSEST") {
    return "CLOSEST_TO_PIN";
  }

  return undefined;
}

async function submitResult(config, sessionId, result) {
  return requestJson(
    config.pin2WinApiBaseUrl,
    `/api/simulator/sessions/${sessionId}/results`,
    {
      method: "POST",
      body: JSON.stringify({
        source: "LOCAL_AGENT",
        verifierName: config.operatorName,
        ...result,
      }),
    },
  );
}

async function main() {
  const command = process.argv[2] ?? "help";
  const config = readConfig();

  if (command === "create-session") {
    const challengeType = challengeTypeFromArg(process.argv[3]);
    const sessionConfig = challengeType
      ? {
          ...config,
          defaultSession: {
            ...config.defaultSession,
            challengeType,
            resultUnit: challengeType === "LONGEST_DRIVE" ? "yd" : "ft/in",
          },
        }
      : config;
    const { session } = await createSession(sessionConfig);

    console.log("Created Pin2Win simulator session:");
    console.log(JSON.stringify(session, null, 2));
    return;
  }

  if (command === "submit-result") {
    const sessionId = process.argv[3];
    const rawResult = process.argv[4];
    const challengeType = challengeTypeFromArg(process.argv[5]);

    if (!sessionId || !rawResult) {
      throw new Error(
        "Usage: submit-result <P2W session id> <result> [LONGEST_DRIVE|CLOSEST_TO_PIN]",
      );
    }

    const { result } = await submitResult(config, sessionId, {
      challengeType,
      rawResult,
      evidenceUrl: "Operator verified from simulator screen",
      notes: "Submitted by local Windows agent scaffold.",
    });

    console.log("Submitted simulator result:");
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  console.log(`Pin2Win Windows Agent Scaffold

Commands:
  create-session [LONGEST_DRIVE|CLOSEST_TO_PIN]
  submit-result <P2W session id> <result> [LONGEST_DRIVE|CLOSEST_TO_PIN]

Config:
  ${configPath}
`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
