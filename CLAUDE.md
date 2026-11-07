# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Remote System Administration Platform — a CSCI 4390 senior project. A web dashboard (Django) will let administrators monitor and manage registered Windows computers, each running a lightweight C#/.NET agent that reports system info and executes approved remote commands over a REST API.

The repo has two independently developed components plus course docs:

```
Django/            Web app, backend, REST API, admin dashboard (active development)
Windows-Agent/     C#/.NET agent for managed computers (not yet started — README only)
Project-Documents/ Proposal/planning docs (.docx), not source
```

The project is early-stage: models, the REST API, and the Windows agent do not exist yet. Most current work is Django templates/views scaffolding and frontend (Bootstrap, dark/light mode).

## Commands

All commands run from `Django/` (the actual Django project root — `manage.py` lives there, not at the repo root).

```bash
cd Django
python manage.py runserver          # run the dev server
python manage.py migrate            # apply migrations
python manage.py makemigrations     # create migrations after model changes
python manage.py test               # run all tests
python manage.py test senior_project_app                # run tests for the app
python manage.py test senior_project_app.tests.ClassName # run a single test case
python manage.py createsuperuser    # create an admin login
```

There is no `requirements.txt`/`Pipfile` committed yet — Django is expected to be installed into a local virtualenv (`venv/`, `.venv/`, or `env/`, all gitignored) via `pip install django`. If you add dependencies, consider generating a `requirements.txt` with `pip freeze`.

No linter or formatter is configured in this repo.

## Architecture

- **Django project**: `senior_project` (settings/urls/wsgi/asgi) — the site-wide config.
- **Django app**: `senior_project_app` — currently the only app; all views, templates, and (future) models live here. New backend features should generally go into this app unless there's a clear reason to split out a new app (e.g. a separate `api` app for the REST endpoints once those are built).
- **URL routing**: root `senior_project/urls.py` includes `senior_project_app.urls` at `/` and Django admin at `/admin/`. App-level routes are added in `senior_project_app/urls.py`.
- **Views**: plain function-based views in `senior_project_app/views.py` (`home`, `login`, `dashboard`). `dashboard` is decorated with `@login_required` — this is the intended pattern for any future admin-only view.
- **Templates**: `senior_project_app/templates/`, using a `base.html` with `{% block title %}`, `{% block content %}`, `{% block extra_css %}`, `{% block extra_js %}`, and shared includes at `templates/includes/` (`navbar.html`, `footer.html`). New pages should extend `base.html` rather than duplicating the `<head>`/Bootstrap boilerplate.
- **Static files**: `Django/static/` (`css/styles.css`, `js/darkmode.js`, `images/`), served via `{% static %}` and Django's `staticfiles` app. Frontend uses Bootstrap 5.3.8 via CDN (loaded in `base.html`) plus a custom dark/light mode toggle.
- **Database**: SQLite (`db.sqlite3`, gitignored) for development. The root README lists PostgreSQL/Supabase as the planned production database — not yet wired up.
- **Settings**: `DEBUG = True` and a hardcoded `SECRET_KEY` are development-only placeholders in `senior_project/settings.py`; these must not be relied upon or copied into a production config.
- **Auth**: uses Django's built-in `django.contrib.auth`; `login` view currently just renders `login.html` and isn't wired to Django's auth backend yet.
- **Windows-Agent**: no code yet. When implemented, it will be a separate C#/.NET solution that talks to the Django REST API (not yet built) over HTTPS/JSON — registration, heartbeats, system/performance info, and remote command execution/results.

## Notes for future work

- The REST API (Django REST Framework, per the planned tech stack) hasn't been added to `INSTALLED_APPS` yet — it will need to be added along with any serializers/viewsets for agent communication.
- No models exist yet (`senior_project_app/models.py` is empty); the "Planned Responsibilities" in `Django/README.MD` (computer registration, system info, process/service info, command management, online/offline status) is the source of truth for what's coming.
