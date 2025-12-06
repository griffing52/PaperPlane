![Test Badge](https://github.com/griffing52/paperplane/actions/workflows/test.yml/badge.svg)

# PaperPlane

PaperPlane is a modern aviation logbook application designed to help pilots track their flights, currency, and proficiency. It features a Next.js frontend, an Express/Node.js backend, and a Python-based OCR service for digitizing physical logbook entries.

## Features

*   **Digital Logbook**: View, add, edit, and delete flight entries.
*   **OCR Integration**: Upload photos of your paper logbook to automatically extract flight data.
*   **Flight Verification**: Verify your logged flights against a database of archived flight records to ensure accuracy.
*   **Pilot Status**: Track your flight times!

## Prerequisites

Before you begin, ensure you have the following installed:

*   **Node.js** (v18 or higher)
*   **Python** (v3.8 or higher)
*   **npm** (usually comes with Node.js)

## Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/griffing52/PaperPlane.git
    cd PaperPlane
    ```
2.  **Setup the virtual environment for the OCR Service**
    ```bash
    python3 -m venv .venv
    source .venv/bin/activate
    pip install -r ocr/requirements.txt
    ```
3.  **Install Node.js dependencies (Frontend & Backend):**
    ```bash
    npm run install:all
    ```
4.  **Install Python dependencies (OCR Service):**
    ```bash
    npm run install:ocr
    # OR manually:
    ```

## Configuration

### TA Setup Instructions

1. Put the `.env` file sent to their email in the root of the project.
2. Put the `serviceAccountKey.json` sent in your email in the `server/` directory of the project.

### Setup

1.  **Environment Variables:**
    Copy the sample environment file to `.env`:
    ```bash
    cp .env.sample .env
    ```
    Edit `.env` to add your configuration (e.g., Firebase API keys, OCR provider settings).

2.  **Firebase Setup:**
    *   Obtain your Firebase service account private key.
    *   Save it as `serviceAccountKey.json` in the `server/` directory.

## Database Setup

This project uses SQLite. You need to initialize the database and seed it with data.

1.  **Run Migrations:**
    ```bash
    npx prisma migrate dev --name initial_migration
    ```

2.  **Generate Prisma Client:**
    ```bash
    npx prisma generate
    ```

3.  **Seed the Database:**
    This populates the database with sample users and archived flight data for verification.
    ```bash
    npm run seed
    ```

## Running the Application

You can run all services (Frontend, Backend, OCR) concurrently with a single command:

```bash
npm run dev:all
```

Alternatively, you can run them individually in separate terminals:

*   **Frontend** (http://localhost:3000):
    ```bash
    npm run dev:frontend
    ```

*   **Backend** (http://localhost:3002):
    ```bash
    npm run dev:server
    ```

*   **OCR Service** (http://localhost:8000):
    ```bash
    npm run dev:ocr
    ```

## Testing

### Automatic Testing

To run all tests (Frontend, Backend, OCR):

```bash
npm run test:all
```

Or run them individually:

*   **Backend Tests:** `npm run test:server`
*   **Frontend Tests:** `npm run test:frontend` (if configured)
*   **OCR Tests:** `npm run test:ocr`
*   **E2E Tests:** `npm run test:e2e`

### Manual Testing

1. Visit the home page at [localhost:3000](http://localhost:3000/).
2. Signup and login to your account.
3. Play around with manual entries.
    - Incorrect entries should show the errors in the user interface.
4. Use the provided example image in `ocr/images/handwritten.png` to import several entries.
5. Test verification with the verify button (there is a tolerance of 60 minutes on the duration).
6. After you do that, delete the invalid entries.

#### Notes

We also implemented a hybrid approach to OCR by using Textract to get raw outputs and Gemini to format into JSON.
To test this, please change the environment variable `OCR_PROVIDER` to `HYBRID` in `.env`.
The `ocr/images/handwritten-2.png` sample image will fail on the AWS provider but pass on the hybrid provider.

## Verification Feature

The dashboard includes a **Verify** button. This feature checks your logbook entries against the archived flight data in the database.

*   **Green Checkmark**: The flight matches an archived record (same date, duration, and route).
*   **Red X**: No matching flight was found in the archives.

To see the archived flights available for verification, you can use Prisma Studio:

```bash
cd server
npx prisma studio
```

## Architecture Diagrams

We have two entities corresponding to a flight in our database. We have a "FlightEntry", which is what a pilot enters in their logbook.
We also have a "Flight", which is what we get from our external flight database. When we verify a flight, a FlightEntry is associated with a Flight.
A flight can be associated with any number of flight entries because there could be multiple pilots.

<img width="951" height="1379" alt="image" src="https://github.com/user-attachments/assets/b5698b4d-e501-4b90-8990-8248e9fc628a" />

The following diagram provides a high-level overview of the app's components:
<img width="1237" height="211" alt="Paper Plane components" src="https://github.com/user-attachments/assets/dcceca21-5b6a-4d67-9761-d68550079c5e" />

