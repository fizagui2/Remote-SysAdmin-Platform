# Agent enrollment

How the Windows agent gets a device token and uses it. The server side is
done; this is what the agent needs to do.

## The flow

1. The user logs in to the website, opens **Add device** (`/add-device/`) and
   clicks **Generate a code**. They get a code like `K7QF-2M9P`. It works once
   and expires after 15 minutes.
2. The agent starts with no saved token, so it asks for the code in the
   console and enrolls.
3. The agent saves the token and sends it on every request from then on.

## Enrolling

```
POST /api/agent/enroll/
Content-Type: application/json

{"EnrollmentCode": "K7QF-2M9P", "Hostname": "LAB-PC-01"}
```

- `EnrollmentCode`: what the user typed. Case, spaces and the dash don't
  matter, so pass it through as typed.
- `Hostname`: the same value the agent already sends in its reports
  (`Environment.MachineName`).

| Response | Meaning | Agent should |
|---|---|---|
| `200 {"DeviceToken": "...", "Hostname": "LAB-PC-01"}` | Enrolled | Save `DeviceToken`, carry on |
| `403 {"error": "Invalid or expired enrollment code"}` | Wrong, expired or already-used code | Say so and ask for a code again |
| `400` | Malformed request | Bug in the agent |

The token is only ever sent in this response. If it's lost, the machine has to
enroll again with a new code.

## Every request after that

Send the token in a header on **all** agent requests, including the command
poll and command results:

```
Authorization: Token <DeviceToken>
```

In C#, once, on the shared `HttpClient`:

```csharp
_httpClient.DefaultRequestHeaders.Authorization =
    new AuthenticationHeaderValue("Token", deviceToken);
```

Nothing else changes. Request bodies, PascalCase field names and responses are
the same as now. With a token, the server knows which machine is calling, so
the `?hostname=` on `/api/agent/commands/` is ignored. It's harmless to keep
sending it.

## When the server says 401

Any `401` on any request means the token is no good: the user removed the
machine on the Add device page, or the server's database was reset. The agent
should delete its saved token and ask for a new enrollment code, the same as on
first run. That way it fixes itself instead of failing forever.

## Saving the token

- A file under `%LocalAppData%`, for example
  `Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData)`
  + `\RemoteSysAdminAgent\device-token.txt`. If the agent ever runs as a
  Windows service, `%ProgramData%` instead.
- Treat it like a password: don't print it or write it to logs.

## Rollout

The server still accepts requests without a token until we turn on
`AGENT_TOKEN_REQUIRED=True` in `.env`, so the current agent keeps working while
this is built. Without a token, requests only reach machines that haven't
enrolled. Order:

1. Agent with enrollment ships.
2. Each machine enrolls once.
3. We set `AGENT_TOKEN_REQUIRED=True`, and requests without a token get `401`.

## Trying it locally

Run the server, register an account, open `/add-device/`, generate a code, and
start the agent. The machine shows up in the "Your devices" list on the same page.
