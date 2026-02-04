# HMS CI/CD Pipeline

This repository uses GitHub Actions for Continuous Deployment (CD) to an AWS EC2 instance via Docker Compose.

## Pipeline Overview

The pipeline ([.github/workflows/deploy.yml](.github/workflows/deploy.yml)) triggers on every push to the `main` branch (and can be run manually). It performs the following steps:

1.  **SSH Connect**: Connects to the EC2 server via SSH.
2.  **Update Repo**: Resets and pulls the latest code on the instance.
3.  **Docker Deploy**: Runs `docker compose -f docker-compose.prod.yml up -d --build --remove-orphans`.

## Deployment Steps on EC2

The deployment job executes the following on the server:
-   Pulls the latest code from `git`.
-   Ensures Docker and Docker Compose are installed.
-   Builds and starts the services defined in `docker-compose.prod.yml`.

## Required Secrets

To make the deployment work, you must configure the following **Secrets** in GitHub (Settings > Secrets and variables > Actions):

| Secret Name     | Description                                                                 |
| :-------------- | :-------------------------------------------------------------------------- |
| `EC2_SSH_KEY`   | The **content** of your private SSH key (`.pem` file).                      |
| `EC2_HOST`      | The Public IP address of your EC2 instance (e.g., `43.204.94.213`).          |
| `EC2_USER`      | The SSH username (default: `ubuntu`).                                       |

## First-Time Setup on Server

Ensure your server is ready:
1.  **Clone the Repo**: The app should be cloned at `/var/www/hms-app` (or update the path in `deploy.yml`).
2.  **Permissions**: Ensure the `ubuntu` user has permissions to write to the directory and run Docker without prompts.
3.  **Env Files**: Provide any required environment variables for Docker Compose on the server (e.g., `.env`).

## Troubleshooting

-   **Permission Denied (publickey)**: Verify `EC2_SSH_KEY` is correct and matches the key on the server (`~/.ssh/authorized_keys`).
-   **Directory not found**: Check if `APP_DIR` in `deploy.yml` matches your server path.
-   **Docker Errors**: Verify Docker/Compose are installed and the compose file builds locally on EC2.
