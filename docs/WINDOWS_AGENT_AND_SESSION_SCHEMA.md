# Pin2Win Local Windows Agent and Simulator Session Schema

This is the first integration slice for simulator testing. It does not control E6 or APOGEE yet. It creates the contract we will use when the operator PC is ready.

## What Was Created

- Prisma schema models for simulator devices, sessions, and results.
- API endpoints for a local Windows agent or testing portal.
- A lightweight Node-based Windows agent scaffold.
- A config template for the operator PC.
- Prisma-backed persistence when `DATABASE_URL` is configured, with an in-memory fallback for local UI testing.

## Backend Session Schema

The durable database schema lives in `prisma/schema.prisma`.

Primary objects:

- `SimulatorDevice`: the operator PC/simulator bay setup.
- `SimulatorSession`: one Pin2Win-controlled simulator challenge session.
- `SimulatorResult`: one verified result from manual entry, local agent, CSV import, screenshot, or future vendor API.

Important session fields:

- `pin2WinSessionId`: Pin2Win's own stable session ID.
- `provider`: `TRUGOLF_APOGEE_E6`, `E6_CONNECT`, `FLIGHTSCOPE_E6`, `MANUAL`, or `OTHER`.
- `challengeType`: `CLOSEST_TO_PIN` or `LONGEST_DRIVE`.
- `course`, `hole`, `teeBox`, `pinLocation`, `attempts`, `playTimeMinutes`.
- `e6SessionName`, `e6SessionId`, `externalSessionId`.
- `status`: created, launched, in progress, verified, synced, etc.
- `syncEligible`: protects test results from accidentally becoming production data.

## API Endpoints

Run the Next app, then call these from the portal or Windows agent.

Create a session:

```bash
curl -X POST http://localhost:3000/api/simulator/sessions \
  -H "content-type: application/json" \
  -d '{
    "provider": "TRUGOLF_APOGEE_E6",
    "challengeType": "CLOSEST_TO_PIN",
    "playerAlias": "Test Player",
    "venueName": "Partner Simulator Lab",
    "bayName": "Bay 01",
    "course": "TBD",
    "hole": 3,
    "attempts": 10
  }'
```

List sessions/results:

```bash
curl http://localhost:3000/api/simulator/sessions
```

Update a session:

```bash
curl -X PATCH http://localhost:3000/api/simulator/sessions/P2W-TEST-20260506-0001 \
  -H "content-type: application/json" \
  -d '{ "status": "LAUNCHED", "e6SessionName": "P2W-TEST-0001 | Bay 01 | CTP" }'
```

Submit a verified result:

```bash
curl -X POST http://localhost:3000/api/simulator/sessions/P2W-TEST-20260506-0001/results \
  -H "content-type: application/json" \
  -d '{
    "source": "LOCAL_AGENT",
    "rawResult": "4 ft 8 in",
    "resultUnit": "ft/in",
    "verifierName": "Operator",
    "evidenceUrl": "Screenshot saved locally"
  }'
```

## Local Windows Agent Scaffold

Files:

- `tools/windows-agent/pin2win-agent.mjs`
- `tools/windows-agent/pin2win-agent.config.example.json`

On the operator PC:

1. Install Node.js LTS.
2. Copy `tools/windows-agent` to the operator PC.
3. Copy `pin2win-agent.config.example.json` to `pin2win-agent.config.json`.
4. Edit the config with the venue, bay, operator, and default challenge.
5. Run:

```bash
node pin2win-agent.mjs create-session
```

After the operator verifies a simulator result:

```bash
node pin2win-agent.mjs submit-result P2W-TEST-20260506-0001 "4 ft 8 in"
```

## Database Persistence

The simulator API now checks for `DATABASE_URL`.

- If `DATABASE_URL` is set, sessions and results are stored through Prisma/Postgres.
- If `DATABASE_URL` is missing, the API uses the temporary in-memory store so the testing portal still works locally.

To turn on durable persistence:

1. Add a valid Postgres connection string to `.env`:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
```

2. Generate the Prisma client:

```bash
npm run db:generate
```

3. Create/apply the migration:

```bash
npm run db:migrate
```

4. Restart the Next dev server.

After that, `/testing-portal` and the Windows agent will write to the database-backed simulator tables.

## What To Do With This Now

1. Keep using `/testing-portal` for manual off-site tests.
2. Add `DATABASE_URL` and run the Prisma migration when a development database is available.
3. Use the API endpoints and Windows agent to prove the session/result contract.
4. At the simulator bay, collect E6/APOGEE software version, available export/report options, and operator PC constraints.
5. Do not automate E6 launch until TruGolf or the owner approves an integration method.

## Next Build Step

The next useful increment is to add an operator-facing session detail screen that shows the exact challenge setup, launch checklist, and verified results for one `pin2WinSessionId`.
