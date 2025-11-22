This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

```bash
npm install:all
```

Init the database.

```
# sets the database location in prisma/dev.dbs
cp .env.sample .env
# creates the database
npx prisma migrate dev --name initial_migration
# generates prisma library to interact with database
npx prisma generate
# generate test data
npm run seed
```

(copy and pasted from Gemini)
# Start the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

This command launches the development server, typically accessible at http://localhost:5173 (or a similar port). Your React application will be served from this address, and any changes you make to the code will trigger a hot-reload in the browser.

## Additional npm run commands:
npm run build: This command creates a production-ready build of your application in the dist directory.
npm run preview: After building, this command serves the production build locally, allowing you to test it before deployment.
npm run test: If you have configured testing with a framework like Vitest, this command will run your tests. The specific setup for testing might require additional configuration in your package.json and a testing configuration file (e.g., vite.config.ts).

# Vite default README (for client)

# React + TypeScript + Vite
Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
