# Fashion-Avatar-Project

**All UI development and logic should occur inside the `src/` directory. For example:** 

*  `src/wardrobe/` — (Assigned to: [Member 1])
*  `src/avatar/` — (Assigned to: [Member 2])
*  `src/ai-textbot/` — (Assigned to: [Member 3])


**The `src/app` folder is ONLY for URLs.**
* All webpages will be in `src/app`. Folders inside here are other pages that can be routed to each other, including the main homepage.
* The main dashboard layout will now be located in `src/app/dashboard`.


**What is being used:**
* Programming Language: Typescript
* UI Library: React
* Styling: Tailwind CSS
* Framework: Next.js


**Downloading the dependencies yourself**

The `node_modules` and `.next` folders are intentionally ignored by Git to save space and prevent OS conflicts. 
When you clone this repository to your laptop for <ins>the first time</ins>, you MUST download the dependencies yourself.

<br>
In the terminal:
* First run `npm install`
* Then run `npm install @supabase/supabase-js @supabase/ssr`
* Finally, run `npm run dev`
