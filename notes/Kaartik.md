

# Making next.js skeleton app and installing firebase



How to use:

1. Follow ReadMe set up

```
npm run dev
```
To see sign up:

http://localhost:3000/signup

To see dashboard:

http://localhost:3000/dashboard

To log in 

http://localhost:3000/login

example account that should be saved:
test@gmail.com
happyFACE123!

12/1 Commit(s)

Refactor signup page UI and extract backend user helper

- Redesigned signup page with background image and new PaperPlane logo
- Improved layout and styling for a more polished, professional look
- Moved API base URL and createBackendUser logic into lib/backendUser.ts
- Cleaned up imports and updated signup page to use shared helper