# Remote System Administration Platform

Senior Project for **CSCI 4390 – Senior Project**

## Members

* Francisco Izaguirre - GitGub: fizagui2
* Luis Chavez - GitHub: LuisJC-creator
* Mauricio Garza - GitHub: mgdgit
* Omar Villalobos - GitHub: oumarvi76

## Overview

The Remote System Administration Platform is a web-based application that allows authorized administrators to monitor and manage registered Windows computers remotely.

Each managed computer will run a lightweight **C#/.NET agent** that collects system information and communicates with a central **Django REST API**. Administrators will use a Django-based web dashboard to view computer status, system performance, running processes, Windows services, and perform approved remote management operations.

## Planned Features

* Monitor CPU, RAM, and disk usage
* View computer and operating system information
* View running processes
* Start and terminate processes
* View and manage Windows services
* Monitor whether registered computers are online or offline
* Basic file and directory management
* Secure administrator authentication
* Remote communication between Windows agents and the server

## Planned Tech Stack

* **Backend:** Django
* **API:** Django REST Framework
* **Frontend:** Django Templates, Bootstrap, JavaScript
* **Windows Agent:** C# / .NET
* **Database:** PostgreSQL / Supabase
* **Communication:** REST API using HTTPS and JSON
* **Cloud Hosting:** To be determined
* **Version Control:** Git & GitHub

## Development

The project will be developed incrementally, beginning with basic communication between the Windows agent and Django server. Additional monitoring and remote-management features will be implemented and integrated throughout development.

This repository is currently under active development as part of the CSCI 4390 Senior Project.
