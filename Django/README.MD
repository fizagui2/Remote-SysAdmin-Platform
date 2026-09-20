# Django Web Application

This directory contains the web application and backend for the **Remote System Administration Platform**.

The Django application will provide the administrator dashboard and REST API used to communicate with registered Windows agents.

## Planned Technologies

* Python
* Django
* Django REST Framework
* Django Templates
* Bootstrap
* JavaScript
* Supabase / PostgreSQL

## Planned Responsibilities

* Administrator authentication
* Computer registration and management
* REST API for Windows agent communication
* System information and performance data
* Process and service information
* Remote command management
* Agent online/offline status
* Web based administrator dashboard

## Development

### First-time setup

Requires Python 3.12 or newer. Django 6.1.1 will not run on 3.11.

1. Create the virtual environment, from the repository root:

   ```
   py -3.13 -m venv venv
   venv\Scripts\python.exe -m pip install -r requirements.txt
   ```

2. Create your environment file:

   ```
   copy Django\.env.example Django\.env
   ```

3. Generate your own secret key and paste it into `Django/.env`:

   ```
   venv\Scripts\python.exe -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
   ```

   Every member generates their own key. Database credentials are shared.

4. Run the server from the `Django/` directory:

   ```
   ..\venv\Scripts\python.exe manage.py runserver
   ```

Django will not start without `DJANGO_SECRET_KEY`. The error message says how to fix it.

### Database

`DATABASE_URL` in `Django/.env` points at Supabase Postgres. Leave it empty and Django
falls back to a local SQLite file, which is enough for work that does not touch shared data.

Use the **session pooler** connection string from the Supabase dashboard, not the direct
connection. Direct is IPv6-only on the free plan and will hang on IPv4-only networks.

Schema changes go through Django migrations only. Do not create or alter tables in the
Supabase dashboard.
