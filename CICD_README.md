# HMS CI/CD Pipeline

This repository uses GitHub Actions for Continuous Deployment (CD) to an AWS EC2 instance via Docker Compose.

## Pipeline Overview

The pipeline ([.github/workflows/deploy.yml](.github/workflows/deploy.yml)) triggers on every push to the `main` branch (and can be run manually). It performs the following steps:

1.  **Build Images**: Builds backend and frontend Docker images on the GitHub runner.
2.  **Ship Images**: Uploads the built images and `docker-compose.ec2.yml` to the EC2 server.
3.  **Docker Deploy**: Loads the images, runs migrations, and starts services with `docker compose`.

## Deployment Steps on EC2

The deployment job executes the following on the server:
-   Ensures Docker and Docker Compose are installed.
-   Loads images built on the runner.
-   Writes a `.env` file using GitHub Secrets.
-   Runs migrations using the backend container.
-   Starts the services defined in `docker-compose.ec2.yml`.

## Required Secrets

To make the deployment work, you must configure the following **Secrets** in GitHub (Settings > Secrets and variables > Actions):

| Secret Name     | Description                                                                 |
| :-------------- | :-------------------------------------------------------------------------- |
| `EC2_SSH_KEY`   | The **content** of your private SSH key (`.pem` file).                      |
| `EC2_HOST`      | The Public IP address of your EC2 instance (e.g., `13.233.254.140`).         |
| `EC2_USER`      | The SSH username (default: `ubuntu`).                                       |
| `DB_HOST`       | RDS endpoint hostname.                                                      |
| `DB_PORT`       | RDS port (default: `3306`).                                                 |
| `DB_DATABASE`   | Database name.                                                              |
| `DB_USERNAME`   | Database username.                                                          |
| `DB_PASSWORD`   | Database password.                                                          |
| `SECRET_KEY`    | JWT secret key for the API.                                                 |

## First-Time Setup on Server

Ensure your server is ready:
1.  **App Directory**: The workflow uses `/var/www/hms` as the deployment directory.
2.  **Permissions**: Ensure the `ubuntu` user has permissions to write to the directory and run Docker without prompts.
3.  **Env Files**: The workflow writes `.env` from GitHub Secrets on each deploy.

## Troubleshooting

-   **Permission Denied (publickey)**: Verify `EC2_SSH_KEY` is correct and matches the key on the server (`~/.ssh/authorized_keys`).
-   **Directory not found**: Check if `APP_DIR` in `deploy.yml` matches your server path.
-   **Docker Errors**: Verify Docker/Compose are installed and the compose file builds locally on EC2.

## Local Docker Run (MySQL)

1. Copy env example and edit values:
	```bash
	cp .env.docker.example .env
	```
2. Start services:
	```bash
	docker compose up -d --build
	```
3. Verify endpoints:
	```bash
	bash scripts/verify_endpoints.sh http://localhost
	```
