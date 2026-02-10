# Smart Task Management System

A professional, full-stack task management application built with **Django** and **React**. Designed for productivity with a clean UI, smart features, and secure authentication.

## 🚀 Features

- **User Authentication**: Secure Signup/Login using JWT (JSON Web Tokens).
- **Task Dashboard**: A professional overview of all tasks with statistics.
- **Full CRUD**: Create, Read, Update, and Delete tasks with ease.
- **Smart Status Workflow**: Toggle tasks between Pending, In-Progress, and Completed.
- **Priority System**: Categorize tasks as High, Medium, or Low priority.
- **Responsive Design**: Fully optimized for mobile, tablet, and desktop views.
- **Dark Mode**: High-contrast, easy-on-the-eyes theme toggle.
- **Visual Indicators**: Color-coded cards and left-accent strips based on priority and overdue status.

## 🛠️ Tech Stack

- **Frontend**: React.js, Bootstrap 5, Axios, React Router.
- **Backend**: Django, Django REST Framework (DRF).
- **Database**: SQLite (default) / PostgreSQL (production ready).
- **Authentication**: SimpleJWT for secure session management.

## 📦 Installation & Setup

### Backend (Django)
1. Navigate to `smart-task-backend` folder.
2. Create a virtual environment: `python -m venv venv`.
3. Activate venv: `venv\Scripts\activate` (Windows) or `source venv/bin/activate` (Mac/Linux).
4. Install dependencies: `pip install -r requirements.txt`.
5. Run migrations: `python manage.py migrate`.
6. Start server: `python manage.py runserver`.

### Frontend (React)
1. Navigate to `smart-task-frontend` folder.
2. Install packages: `npm install`.
3. Start development server: `npm start`.
4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 💡 Product Thinking & Decisions

- **UI/UX Strategy**: Focused on a "Distraction-Free" interface. Tasks are displayed in clear cards with soft pastel badges to prevent visual clutter while maintaining high information density.
- **Security Decisions**: Implemented password hashing (Django default) and JWT stored in localStorage with expiration checks to ensure data privacy.
- **Challenge Faced**: Synchronizing the Navbar state with the browser's localStorage was a challenge (hydration flicker). Solved by using a custom event-based emitter (`stm_auth_changed`) to force immediate UI updates upon login/logout.

## 🔮 Future Roadmap

- **Push Notifications**: Browser-based alerts for overdue tasks.
- **Team Collaboration**: Shared task boards and mentions.
- **AI Task Analysis**: Automatically suggest priority based on task descriptions and user history.
- **Mobile App**: Native mobile support using React Native.

---
*Created as part of the Full Stack Developer Screening Assignment.*
