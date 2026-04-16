✅ COMPLETED SO FAR
Backend (Django)

    Unified User System - PublicUser merged with accounts.User
    User Groups & Permissions - Role-based access control
    Engagement Models - Comments, reactions, images with unified User
    ProjectInitiative Model - Unified Projects and Programs
    Department & Agency Models - Replaced Ministry structure
    Priority Area & Deliverable Models - Hierarchical tracking
    Location Tracking - Latitude, longitude, address fields
    Image Upload API - Multiple images per initiative
    Activity Logging - User action tracking
    Rate Limiting - Anonymous user restrictions

Frontend - Dashboard

    Premium UI - Glassmorphism design, sidebar, topnav
    Initiative Management - Create, edit, delete, view
    Department & Agency Management - Full CRUD
    Priority Area & Deliverable Management - Full CRUD
    Location Picker - Map + manual entry with instructions
    Image Upload - Drag & drop, gallery view
    Reports - PDF/Excel export
    User Management - Admin user upgrade interface
    Settings - Profile, security, notifications
    Activity Log - User activity display

Frontend - Public Portal

    Public Layout - With authentication awareness
    Project Listing - Search, filters, grid view
    Project Detail - Full view with images, map, comments
    Comment System - Nested replies, reactions
    Anonymous Commenting - With rate limiting
    Location Display - Interactive map, directions
    Image Gallery - Full-screen viewer


--------------------------------------------------------------------------------------------------------

THINGS TO DISCUSS WITH STAKE HOLDERS
1. Project Name
2. Project flow
3. Who does what and at what point?
4. At what point are reports approved marked as complete and readonly

---------------------------------------------------------------------------------------------------------

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

-----------------------------------------------------------------------------------------------------------------------

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

A. PROJECTS
So a project is tied to the following order:
1. Tied to a depart Department (e.g Forestry, Climate change etc) or an Agency(e.g NOSDRA,) 
2. Could be Project (package projects or sponsored projects by World Bank, EU, UN etc) or a Programs(here we define the )

So we do not need a ministry form in the frontend, we need to create the following models:
Departments --> Agencies --> Projects --> Programs
NOTE
a. We also need to tie coordinates to a project, such that when a citizen clicks the image (or project title), the loaction (map) can be seen, directions to the eact place can be obtained
b. performance_historics (performance history) and target_historics(target history) are simply computed from history op previous data


B. PRIORITY AREAS
For each priority area, there are metrics (deliverables) to be achieved

--------------------------------------------------------------------------------------------------------------------------
PROJECT ADJUSTMENT
The requirements have been made clearer:
1. Each projectinitiative focuses on a PriorityArea and has one or more Delierables (already captured)
2. Each deliverable has a base_line value, target value, actual value per quarter. This means that a project milstone is captured per quarter. 
3. The target and actual values are per deliverable. This means that for each deliverale, we have a target value and an actual value.
If the Initiative was setup with 3 deliverable, then we shall have 3 target_values and 3 actual values.
4. At the end of the 4th quarter, the system auto computes the annual values and the mean value.

ROLE BASED DUTIES
Hi DS, we need some more adjustments, having created user groups, its time we use them.
We have 4 basic user groups I am not sure the names of two groups but we can give the place holder names for now. I'll describe their functions.
1. ProjectAdmin => they create/setup the Initiations. At the point of creation, some fields would be invisible to them on that initiation form. The 'actual_value' (Actual) should be disabled/hidden at creation. The image field should also be unavailable.
The performance assessment should also not be available to him. 

2. Staff (Placeholder name for now) => They are the real field workers whose duty it is to act on created ProjectInitiations. They update the project status, the Actual value (under performance metrics) and the image. They upload the actual image as seen on site.
They do not have create project privilege, can only update by filling the specified fields. Other fields are readoly to them.

3. The Directors => They approve projects completed by the Staff before it is submitted. Their action marks a project as completed/done. After acting on a project, the staff can no longer act on it. They view project as readonly, simply approve.

4. Sector Experts => They are responsible for scoring/assessing the ProjectInitiatives after submission. Their only business is the assessment portion. We may have to create a project assesment model because they have more inputs to do.
They check options like
 - Data not available (where data was not provided by the department or agency)
 - Data Not accurate (Data was provided but the expert deems it inacurate based on verifiable evidence)
 - Data not verifiable (data was provided but can not be verified by the expert)
 - Efforts towards achieving goals (%) (Experts scores the depart/agency's efforts towards achieving the stated goal)
 - Comments/performance comment

 NOTE
 I think the performance_rating should be automated, calculated as a funtion of the actual_value / target_value.
 However. we shall also add such field to the Initiative Assessment model for the sector expert


 UPDATES
 1. HOMEPAGE: Use deliverables in the features section with images
 2. Use image for the home page --> possibly carousel
 3. 
 