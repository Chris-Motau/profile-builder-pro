# Profile Builder Pro

Create an Admin dashboard: 

As Admin I should be able to Create/write a Bio For my profile. 

Allow admin to save bio. 

Admin can edit the Bio and update the bio. 

Create a dedicated section where I add my Education Background. 

Inputs: 

School name. 

Qualification name. 

Start and end date. 

Modules completed(Note students can complete module many modules) 

Allow admin to add new module and save it. 

Number of years it took to complete The qualification. 

Allow admin to Upload certificate. 

Allow admin to add new education background and save it. 

Allow Admin to add their technical skills: 

Allow admin to add Technical skill category.  

Added Technical skill category should be saved so that admin can add technical skills of the same category as a list. E.g. frontend, backend 

Allow admin to edit Technical skills and update. 

Allow Admin to add Professional Skills: 

Admin can add a professional skill Header and a summary and save. 

Allow admin to update professional skill Header and summary. 

Allow Admin to add featured projects: 

Admin can add project title. 

Admin can add project Problem statement and solution. 

Allow admin to add Technologies used per project. 

Allow admin to add project link. 

Allow admin to add project images and videos. 

Allow admin to edit featured projects details. 

List saved projects for admin. 

Allow admin To add projects case studies. 

Allow admin to write OR PASTE PROJECT CASE STUDY and/or upload project document/s. 

 Admin can add project title per added project case study/document. 

Admin can delete or remove project documents. 

Allow admin to edit project pasted case study. 

Allow admin to add their experience: 

Allow admin to add: 

 company name. 

Position Title. 

Description. 

Start and end date. 

Allow admin to add certifications per experience. 

Allow admin to upload their CV 

Allow admin to add additional profile links. 

Linked-in 

Git-hub 

Tiktok 

Other 

Allow admin to add contact me information: 

Inputs: 

Email. 

Contact no. 

Whats-app. 

Allow admin to edit all inputs. 

we will consider the user side later. note the project will use firebase 

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "@secret:GOOGLE_API_KEY ",
  authDomain: "c-motau-profile.firebaseapp.com",
  projectId: "c-motau-profile",
  storageBucket: "c-motau-profile.firebasestorage.app",
  messagingSenderId: "532102197453",
  appId: "1:532102197453:web:fe36fbb65b47de4d3b3984"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/ed09d31e-c23f-4925-abe8-66c2f910f267).

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
