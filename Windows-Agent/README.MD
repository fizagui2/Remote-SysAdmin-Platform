# Windows Agent

This directory contains the Windows agent for the **Remote System Administration Platform**.

The agent will run on registered Windows computers and communicate with the Django REST API. It will collect system information, monitor computer resources, and execute approved remote management commands received from the server.

## Planned Technologies

* C#
* .NET
* Windows APIs
* HTTP/HTTPS
* JSON
* Django REST API communication

## Planned Features

### System Information

* Computer name
* Windows version
* CPU information
* RAM information
* Disk information
* IP/network information
* System uptime

### Performance Monitoring

* CPU usage
* RAM usage
* Disk usage

### Process Management

* View running processes
* View process information
* Start approved programs
* Terminate processes

### Windows Service Management

* View Windows services
* Start services
* Stop services
* Restart services

### Basic File Management

* View files and directories
* Create directories
* Rename or move files
* Delete approved files

### Agent Communication

* Register with the Django server
* Send system information
* Send performance information
* Send periodic heartbeats
* Receive remote commands
* Report command results

## Development

Build, configuration, and API connection instructions will be added as the Windows agent is implemented.
