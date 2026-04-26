# alstonshi.com

Source for [alstonshi.com](https://alstonshi.com) (photography portfolio) and `/personal` (digital portfolio), hosted on Dreamhost.

## Auto-deploy

Pushes to `main` are mirrored to the live site over SFTP via [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).

The workflow uses these GitHub Actions secrets:

| Secret | Purpose |
| --- | --- |
| `FTP_SERVER` | Dreamhost SFTP host (e.g. `pdx1-shared-a1-37.dreamhost.com`) |
| `FTP_USERNAME` | SFTP username |
| `FTP_PASSWORD` | SFTP password |
| `FTP_REMOTE_DIR` | Absolute path to the site root on the server (e.g. `/home/USER/public_html`) |

## First-time bootstrap

Trigger **Actions → Initial pull from SFTP → Run workflow** once to import the current live site contents into the repo. After that initial commit, delete `.github/workflows/initial-pull.yml`.

## Making changes

Edit files on `main` (or merge a PR into `main`). The deploy workflow runs automatically and mirrors the repo to the site root. The `.git`, `.github`, `.gitignore`, `.gitattributes`, and `README.md` files are excluded from the upload.
