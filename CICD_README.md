# HMS CI/CD Pipeline

This repository uses GitHub Actions for Continuous Integration and Continuous Deployment (CI/CD) to an AWS EC2 instance.

## Pipeline Overview

The pipeline (`.github/workflows/deploy.yml`) triggers on every push to the `main` branch. It performs the following steps:

1.  **Build Backend**: Installs PHP dependencies and optimizes Laravel configuration.
2.  **Build Frontend**: Installs Node.js dependencies and builds assets (Vite).
3.  **Deploy**: Connects to the EC2 server via SSH and updates the application.

## Deployment Steps on EC2

The deployment job executes the following on the server:
-   Pulls the latest code from `git`.
-   Installs Composer dependencies (`--no-dev`).
-   Installs NPM dependencies and builds assets.
-   Runs database migrations (`--force`).
-   Optimizes Laravel caches (config, route, view).
-   Sets proper file permissions for `storage` and `bootstrap/cache`.
-   Restarts Nginx.
-   Restarts Supervisor queue workers.

## Required Secrets

To make the deployment work, you must configure the following **Secrets** in GitHub (Settings > Secrets and variables > Actions):

| Secret Name     | Description                                                                 |
| :-------------- | :-------------------------------------------------------------------------- |
| `EC2_SSH_KEY`   | The **content** of your private SSH key (`.pem` file).                      |
| `EC2_HOST`      | The Public IP address of your EC2 instance (e.g., `43.204.94.213`).          |
| `EC2_USER`      | The SSH username (default: `ubuntu`).                                       |
| `DB_PASSWORD`   | (Optional) Your RDS/Database password if needed for migration env variable. |

## First-Time Setup on Server

Ensure your server is ready:
1.  **Clone the Repo**: The app should be cloned at `/var/www/html` (or update the path in `deploy.yml`).
2.  **Permissions**: Ensure the `ubuntu` user has permissions to write to the directory and run sudo commands for nginx/supervisor without password (or configure visudo).
3.  **Env File**: A `.env` file should exist on the server with production settings.

## Troubleshooting

-   **Permission Denied (publickey)**: Verify `EC2_SSH_KEY` is correct and matches the key on the server (`~/.ssh/authorized_keys`).
-   **Directory not found**: Check if `APP_DIR` in `deploy.yml` matches your server path.
-   **Migration Errors**: Check if the database credentials in `.env` are correct.
