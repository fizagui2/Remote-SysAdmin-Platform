## Omar Vi (Sprint #2)
- Improvements on Styles (set styles to recognize and identify our website)
- Improved Dark/Clear mode (working properly for all templates)
- Restructure of templates
- Created Website Logo

## Frank Izaguirre (Sprint #2)
- Windows agent sends the full system info report at startup (CPU, RAM, drives, IP/MAC, uptime, logged-in user)
- Added heartbeat, performance (CPU/RAM/disk usage), and process list reports (sent every 10 seconds by default)
- Added Django endpoints to receive each report (MVP features 1-4 done, 5-7 in progress)
- Merged the proof of concept report endpoint into main
- Wrote the JSON format and DB schema document (MVP-JSON-DBFields.docx)

## Mauricio Garza (Sprint #2)
- Added agent status endpoint (returns the latest data received from the agent)
- Added 15 automated tests for the agent endpoints and page views (one uses a real agent JSON payload)
- Worked on the Supabase PostgreSQL connection and pinned package versions in requirements.txt

## Luis Chavez (Sprint #2)
- Moved Django settings into a .env file (.env.example as the template)
- Added Supabase PostgreSQL connection config (falls back to local SQLite without a database URL)
- Replaced the secret key that was committed to the public repo
- Added requirements.txt and setup instructions to the Django README
- Reviewed and merged PRs #16 and #17

# Website Logo:
<img width="2000" height="2000" alt="RSA-logo" src="https://github.com/user-attachments/assets/856e8004-3495-44de-bd9c-7b63542360a7" />
