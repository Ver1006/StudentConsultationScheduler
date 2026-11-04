# Student Consultation Scheduler

## Run locally with MongoDB

1. Start a local MongoDB server on `127.0.0.1:27017`.
2. Copy `.env.example` to `.env` if you want to customize the MongoDB URI,
   database name, or API port. The defaults connect to the local MongoDB server
   and use the `student_consultation_scheduler` database.
3. Run Terminal then use this command, `pnpm install`, then `pnpm dev`.
4. Open the Vite URL shown in the terminal (by default, `http://localhost:8443`).

The development command starts both the Vite app and a loopback-only API at
`http://127.0.0.1:3001`. Vite forwards `/api` requests to that API. The API
creates the `consultations` and `settings` collections as needed.

Consultation bookings, review decisions, user accounts, and instructor
availability are stored in MongoDB. Sign-in checks the seeded users in the
`users` collection and uses an HTTP-only local session cookie. This is a local
development demo, not production authentication; do not expose the API to a
network or use it with real student data.

Here is the account credentials needed:

Student:
Name: Oliver Aniate
Student ID: 9342832738
Email: 9342832738@ms.bulsu.edu.ph
Password: ANIATE9342832738

Name: Precious Abby De Castro
Student ID: 4944405311
Email: 4944405311@ms.bulsu.edu.ph
Password: DECASTRO4944405311

Name: Jonathan Espiritu
Student ID: 9942988820
Email: 9942988820@ms.bulsu.edu.ph
Password: ESPIRITU9942988820

Instructor:
Name: Dr. Monaliza Jimenez
Email: monalizajimenez@ms.bulsu.edu.ph
Password: jimenez123

Name: Dr. Lech Walesa Navarra
Email: lechwalesanavarra @ms.bulsu.edu.ph
Password: navarra123

Name: Dr. Maria Lorena SP Villena
Email: marialorenavillena @ms.bulsu.edu.ph
Password: villena123
