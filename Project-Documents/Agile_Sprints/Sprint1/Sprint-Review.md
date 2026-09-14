# Sprint 1 Review

**September 13, 2026 · Draft**

## Overview

This sprint established the Django application and a Windows agent that sends basic system information to it. The agent is merged into `main`, the report receiver and additional dashboard work are still on separate branches.

## Work completed

- **Windows agent — Frank:** Collects the hostname and Windows version/build, prints the data as JSON, and sends it to Django once per launch. The sender and JSON request-format fix are merged.
- **Django foundation — Omar and Luis:** Added the project structure, home page, shared templates, navigation, and styling. Luis moved the application into `Django/`. Login and dashboard routes still need to be connected.
- **Report receiver — Frank, unmerged:** Added `POST /api/agent/report/` and `/agent/` to display the latest report. Data stays in memory, is overwritten by the next report, and is lost on restart.
- **Dashboard — Omar, unmerged:** Added dashboard layout, sample content, and theme styling. It is not yet connected to agent data.

## Agent reporting

The agent sends JSON directly in an HTTP request, there is no file handoff. It uses `AGENT_API_BASE_URL`, defaulting to `http://localhost:8000/`, and posts to `/api/agent/report/`:

```json
{
  "Hostname": "LAB-PC-01",
  "WindowsVersion": "Windows 11 Pro 24H2 (Build 26100)"
}
```

These values are examples. The receiver acknowledges receipt but does not validate fields, authenticate devices, or save reports to a database. Device IDs and the additional fields in the OS features document remain planned.

## MVP progress

| MVP feature | Status |
| --- | --- |
| System information report | Partial: hostname and Windows version/build collected; remaining fields, authenticated receipt, and persistence pending. |
| Live CPU/RAM/disk monitoring | Not implemented. |
| Heartbeat and online status | Not implemented. |
| View running processes and memory | Not implemented. |
| Terminate a process | Not implemented. |
| View services and state | Not implemented. |
| Start/stop/restart a service | Not implemented. |

## Security and integration gaps

The proof of concept lacks device authentication, protected report access, input validation, and safe HTML rendering. The report page currently inserts submitted data directly into HTML. Development settings are the same from setup.

The team discussed HTTPS communication through Supabase for a future sprint. The request route and Django/Supabase responsibilities still need to be defined.

## Next steps

1. **Frank and Mauricio:** Agree on device identity, JSON fields, authentication, and response/error handling; review the receiver's security gaps.
2. **Mauricio:** Add device/report models, validation, and database storage.
3. **Frank and Mauricio:** Run and record an agent-to-Django demo, including persistence and failed-request checks.
4. **Omar and Mauricio:** Integrate dashboard work, connect login and dashboard routes, and replace sample content with authorized device data.
5. **Frank and Mauricio, with Luis coordinating:** Add heartbeat reporting and remaining system fields, then continue monitoring and process/service features.
6. **Luis, Frank, and Mauricio:** Define the Supabase/HTTPS architecture and deployment settings for a future sprint.

These are suggested owners for this draft.

## Review basis

This review summarizes repository history and source inspection as of September 13. No runtime or end-to-end tests were run for the review.

| Reviewed branch | Commit | State |
| --- | --- | --- |
| `origin/main` | `839053e` | Django foundation, restructuring, and agent merged. |
| `origin/francisco-branch-ProofOfConcept` | `00797ad` | Receiver and report page unmerged. |
| `origin/oumarvi_branch` | `14ac4f4` | Four additional frontend commits unmerged. |

Project references: [Proposal](../../Project-Documents/Proposal-Document.docx), [MVP scope](../../Project-Documents/FeaturesList-MVP.docx), and [OS features](../../Project-Documents/OS-Features.docx).
