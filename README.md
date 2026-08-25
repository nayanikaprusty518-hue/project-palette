# Project Palette

Build a production-ready web application called "ProjectMatch"—a smart team formation platform for university projects, hackathons, and research teams.
1. Database Architecture

Create and execute the database tables with proper foreign keys and permissions:

profiles: id (UUID, primary key), full_name (text), department (text), year_of_study (text), bio (text), skills (text array), weekly_hours (integer), avatar_url (text).

projects: id (UUID, primary key), owner_id (references profiles), title (text), tagline (text), description (text), domain (e.g. AI/ML, Robotics, Web3, FinTech), deadline (date), created_at (timestamp).

roles: id (UUID, primary key), project_id (references projects), role_name (e.g. Frontend Dev, ML Engineer, UI/UX Designer), required_skills (text array), slots_total (integer default 1), slots_filled (integer default 0), is_open (boolean default true).

applications: id (UUID, primary key), project_id (references projects), role_id (references roles), applicant_id (references profiles), pitch_note (text), status (text: 'pending', 'accepted', 'rejected'), created_at (timestamp).
2. Core UI & Views

Theme: Modern, sleek dark mode (slate/indigo palette) with clean card elevations and badge tags.

Dashboard / Explore Feed:

Filter projects by Domain, Skill match, and Open Roles.

Project card showing title, domain badge, list of missing roles, and a dynamic "Match Score %" comparing the logged-in user's skills to the project's needed skills.

Project Details & Role Application:

Visual breakdown of open vs filled roles.

1-Click "Apply to Role" modal with a quick message field.

Create Project Studio: Multi-step or modal flow to add a project and dynamically add 1 to 5 role openings with taggable required skills.

Applicant Review Dashboard: For project creators to view applicants, see their match percentage, and click Accept or Reject (Accepting automatically updates slots_filled and closes the role if filled).

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/37e2d1a8-94b9-4950-a38c-d74443fda55a).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
