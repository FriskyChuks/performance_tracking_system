THINGS TO DISCUSS WITH STAKE HOLDERS
1. Project Name
2. Project flow
3. Who does what and at what point?
4. At what point are reports approved marked as complete and readonly

src/
├── components/
│   ├── Layout/
│   │   ├── Navbar.jsx
│   │   ├── Footer.jsx
│   │   └── Sidebar.jsx
│   ├── Auth/
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   └── PrivateRoute.jsx
│   ├── Landing/
│   │   ├── Hero.jsx
│   │   ├── Features.jsx
│   │   ├── Stats.jsx
│   │   └── CTA.jsx
│   └── Dashboard/
│       ├── DashboardHome.jsx
│       ├── ProjectList.jsx
│       ├── ProjectForm.jsx
│       └── Charts.jsx
├── pages/
│   ├── LandingPage.jsx
│   ├── Dashboard.jsx
│   └── Reports.jsx
├── services/
│   ├── api.js
│   └── auth.js
├── hooks/
│   └── useAuth.js
├── utils/
│   └── constants.js
├── App.jsx
└── main.jsx


EXPLAINATION
1. Priority Areas are the areas of focus within a ministry.
e.g, Ministry of Agriculture --> Priority Area (Boost Food Production) --> Deliverables (Empower 500 farmers)

COMPLETION RATE
1. System should mark a percent of the actual data to the target data always

USER ENGAGEMENT
Add a user engagement portal to the project. People can comment against a project to offer feedbacks.
While projects are initiated and be stakeholders, project updates captured by a certain user (stakeholder),
the general public can make comments/post againt a project.
Here's how it works:
Lets say the project is being excuted in my locality, the project manager (executors) would state the project
update (status) on the app. I can login to this portal, see all projects, click the one concerning to make comment,
either confirming the project status or debunking lies about it. People can also react to my comment.

SUGGESTION
1. I think it would be wise that they fill in some biodata (Register) to be able to make comments (Or use Anonymous)
2. We can display few projects on the landing page, a click of any would take us to the project detail page where 
   the public engages
3. we need to refactor the project page to accept images of the project, find a good way to display them for each project.
   We can  have a maximum number of image to be uploaded per project (maybe 3 or 4)
4. That user engagement portal should be different from what we have worked on this far, we could necessarily create a new fronend for it (may be not)

I welcome better suggestions from you if you have


NEW UPDATE ON REQUIREMENTS:
Hey DS, there seem to be a shift. I did not quite get clients requirements completely. 
Now this project is for ministry of Environment, so needless having a dropdown to select a ministry when creating a project. Its a software for Federal Ministry of Environment.

So a project is tied to the following order:
1. Tied to a depart Department (e.g Forestry, Climate change etc) or an Agency(e.g NOSDRA,) 
2. Could be Project (package projects or sponsored projects by World Bank, EU, UN etc) or a Programs(here we define the )

So we do not need a ministry form in the frontend, we need to create the following models:
Departments --> Agencies --> Projects --> Programs