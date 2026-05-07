# Pin2Win Partner Simulator Testing Scope of Work

## Purpose

Pin2Win is requesting a limited, controlled testing session at the partner simulator location to validate an off-site challenge workflow. The purpose of this testing phase is to confirm that Pin2Win can accurately create test sessions, record verified simulator results, export testing data, and document future integration requirements without disrupting the partner's simulator operations.

This phase is not a full software integration and will not modify, replace, or reconfigure the partner's simulator system.

## Primary Goals

- Confirm the simulator hardware and software environment.
- Run controlled test sessions for Closest to the Pin and/or Longest Drive challenges.
- Capture verified results from the simulator screen, report, screenshot, or operator confirmation.
- Compare Pin2Win test records against the simulator's displayed or exported results.
- Identify whether future automation is possible through approved methods.
- Protect the simulator PC, software license, network, and operational setup throughout testing.

## Systems In Scope

- Pin2Win testing portal.
- Pin2Win local test session workflow.
- Pin2Win local Windows agent, if approved for use on the operator PC.
- Manual result capture from the simulator.
- Simulator challenge settings, observed and documented by the Pin2Win team.
- Exported Pin2Win test data in CSV and JSON format.

## Systems Out of Scope

- No changes to simulator software licensing.
- No changes to E6, TruGolf, Apogee, FlightScope, or other simulator configuration unless explicitly approved by the owner/operator.
- No reverse engineering of proprietary software during this testing phase.
- No network scanning.
- No credential collection.
- No payment processing tests using real customer payment methods.
- No public leaderboard publishing from test results.
- No permanent software installation without approval.
- No automation that launches or controls simulator software without written approval.

## Access Requested

Pin2Win may request temporary, supervised access to:

- Simulator make/model and launch monitor details.
- Simulator software name and version.
- Operator PC Windows version.
- Available simulator reports, screenshots, exports, or result screens.
- Challenge setup options such as course, hole, tee box, pin placement, attempts, and play time.
- A test bay or scheduled testing window.
- Internet access only if needed to reach the Pin2Win testing portal.
- Permission to run the Pin2Win local test agent only if the owner approves.

## What Pin2Win Will Do During Testing

1. Confirm the simulator environment with the owner or operator.
2. Create a Pin2Win test session in the testing portal.
3. Document the selected challenge type and setup options.
4. Have the simulator operator manually launch the challenge in the simulator software.
5. Observe the test session and record the result shown by the simulator.
6. Save the verified result in the Pin2Win testing portal.
7. Attach or note supporting evidence such as screenshot location, report name, or operator confirmation.
8. Export the test data as CSV and JSON.
9. Review the exported Pin2Win data against the simulator evidence.
10. Document any approved future integration path.

## What Pin2Win Will Not Do

- Pin2Win will not alter simulator software settings without permission.
- Pin2Win will not install background services without permission.
- Pin2Win will not disable antivirus, firewall, simulator protections, or Windows security settings.
- Pin2Win will not access unrelated business files.
- Pin2Win will not collect customer data from the partner's system.
- Pin2Win will not store simulator credentials.
- Pin2Win will not interfere with paid customer play.
- Pin2Win will not publish test results publicly.
- Pin2Win will not automate clicks, launches, or simulator control during this testing phase unless separately approved.

## Security and Risk Controls

Pin2Win will follow a conservative testing approach:

- Testing will be performed in a supervised window.
- Test sessions will be isolated from the public Pin2Win website flow.
- Test entries will not process real payments.
- Test results will be marked as testing data.
- Any local agent use will be limited to creating Pin2Win sessions and submitting verified test results.
- The local agent will communicate only with the Pin2Win testing API endpoint configured for the test.
- No inbound access to the simulator PC is required.
- No remote control access is required unless the owner separately approves it.
- Any file collection will be limited to owner-approved screenshots, reports, or exports related to the test.

## Data Captured

Pin2Win may capture:

- Test session ID.
- Venue and bay name.
- Challenge type.
- Simulator software name and version.
- Simulator device model.
- Course, hole, tee, pin location, attempts, and play time.
- Player alias.
- Result value.
- Result unit.
- Verifier name.
- Evidence note or approved evidence file reference.
- Session timestamps.
- Exported CSV/JSON test records.

Pin2Win will not intentionally capture unrelated customer, employee, payment, credential, or private business data.

## Owner Responsibilities

The partner owner/operator should:

- Confirm the testing date and time.
- Identify the approved simulator bay.
- Confirm who may operate the simulator during testing.
- Confirm whether Pin2Win may connect a laptop or use the operator PC.
- Confirm whether the operator PC can access the Pin2Win testing portal.
- Confirm whether the Pin2Win local agent may be run.
- Provide approval before any local software is installed or executed.
- Identify any operational boundaries Pin2Win must follow.

## Pin2Win Responsibilities

Pin2Win will:

- Arrive with the testing portal and workflow prepared.
- Keep the test focused and limited.
- Avoid disrupting customer play or business operations.
- Clearly explain each step before interacting with the simulator environment.
- Record only the information needed for the testing phase.
- Export and review test data with the owner/operator if requested.
- Provide a summary of findings and recommended next steps after testing.

## Success Criteria

The testing phase is successful if:

- Pin2Win can create a test session.
- The simulator operator can run the matching challenge.
- Pin2Win can save the verified result.
- The result appears on the test leaderboard.
- The result survives a system/app restart through database persistence.
- Pin2Win can export the session/result data.
- The exported data matches the simulator evidence.
- The owner understands what was tested and what was not changed.

## Future Integration Considerations

Future automation may be considered only after this testing phase confirms the simulator environment and owner-approved options. Possible future paths include:

- Manual verified entry workflow.
- CSV/report import.
- Screenshot/evidence-assisted verification.
- Local agent result submission.
- Vendor-approved API integration.
- Owner-approved simulator launch or session automation.

Any future integration that controls simulator software, reads local files automatically, or runs persistent software on the operator PC will require separate review and approval.

## Summary

This testing phase is designed to be low risk, transparent, and reversible. Pin2Win's immediate objective is to validate the challenge workflow and result-capture process while protecting the partner's simulator system, software, network, and daily operations.
