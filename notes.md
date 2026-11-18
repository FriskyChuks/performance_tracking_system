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

<!-- WORKFLOW -->
// Step 1: Admin creates ProjectActivity
// They select which Indicators this activity will contribute to
// NO target values set here - those come from the Indicator

// Step 2: For each selected Indicator, quarterly progress entries are auto-created
// The target_value is pre-filled from the Indicator
// Delivery Officer only enters actual_value

// Example:
Indicator: "Number of erosion sites restored"
Target: 500 sites (set at Indicator level)

ProjectActivity: "Gully Erosion Control - North Region"
- Contributes to above Indicator
- Quarterly progress entries have target = 125 (quarterly share, can be customized)
- Delivery Officer enters actual sites restored each quarter

--------------------------------------------------------------------------------------------------------------------------
<!-- MAIN APP ----------------------------- -->
WHAT WE HAVE NOW (WHICH IS WRONG)
1. Each projectinitiative focuses on a PriorityArea and has one or more Delierables (already captured)
2. Each deliverable has a base_line value, target value, actual value per quarter. This means that a project milstone is captured per quarter. 
3. The target and actual values are per deliverable. This means that for each deliverale, we have a target value and an actual value.
If the Initiative was setup with 3 deliverable, then we shall have 3 target_values and 3 actual values.
4. At the end of the 4th quarter, the system auto computes the annual values and the mean value.

WHAT WE NEED (right Requirement)
1. The Federal Government has 8 PriorityAreas they are targeting. This software is for the Federal Ministry of Environmnet.
   They're concerned with 3 of the 8 priorityarea:
   a. Boost Agriculture To Achieve Food Security (Major)
   b. Unlock Energy And Natural Resources For Sustainable Development (minor)
   c. Improve Governance For Effective Service Delivery (This is cross-cutting many ministries)
1. Each PriorityArea has one or more Deliverables (already captured). This is usually a federal govt PriorityArea, 
   not primary to the ministry   but the ministry work would bear it in mind. Ministry focus actually starts from deliverables, but for the purpose of being able to report to the Federal govt when the need arises, they tie their deliverables to federal goverment PriorityAreas concerning them
2. Each Deliverable has Indicators with which your succcess is measured. For Instance:
   Deliverables -> (Effective implementation of control measures across the country). We may have more than one indicators that speak to this deliverable (atleast one)
   Indicators -> (1. Number of Erosion sites identified; 2. No of Erosion sites restored).
   Now to achieve these indicators, the ministry departments/agencies execute ProjectActivities
3. The ProjectActivities can be a Project or a Program

PROJECTS ACTIVITY
So a project Activity is tied to the following order:
1. Tied to a Department (e.g Forestry, Climate change etc) or an Agency(e.g National Oil Spill Detection and Response Agency, 
   National Parks Service) 
2. Could be a Project (package projects or sponsored projects by World Bank, EU, UN etc) or a Programs(here we define them)
3. Answers to an indicator/indicators which ultimately answers to a deliverable -> speaks to a priority area


-----------------------------------------------------------------------------------------------------------------------------------
<!-- ACCOUNTS APP -->
ROLE BASED DUTIES
We have 4 basic user groups. I'll describe their functions.
1. ProjectAdmin => they create/setup the projectactivity. At the point of creation, some fields would be invisible to them on that projectactivity form. The 'actual_value' (Actual) should be disabled/hidden at creation. The image field should also be unavailable.
The performance assessment should also not be available to him. 

2. Delivery Officer (I used staff for them earlier, we might need to update that) => They are the real field workers whose duty it is to act on created projectactivity. They update the project status, the Actual value (under performance metrics) and the image. They upload the actual image as seen on site.
They do not have create project privilege, can only update by filling the specified fields. Other fields are readoly to them.

3. The Directors => They approve projects completed by the Staff before it is submitted. Their action marks a project as completed/done. After acting on a project, the staff can no longer act on it. They view project as readonly, simply approve.

4. Sector Experts => They are responsible for scoring/assessing the ProjectInitiatives after submission. Their only business is the assessment portion. We may have to create a project assesment model because they have more inputs to do.
They check options like
 - Data not available (where data was not provided by the department or agency)
 - Data Not accurate (Data was provided but the expert deems it inacurate based on verifiable evidence)
 - Data not verifiable (data was provided but can not be verified by the expert)
 - Efforts towards achieving goals (%) (Experts scores the depart/agency's efforts towards achieving the stated goal)
 - Comments/performance comment


---------------------------------------------------------------------------------------------------------------------------------------
<!-- ENGAGEMENT APP -->
This is a public page for citizens to engage the ProjectActivities being executed (mostly within their localities)
They have a public page, (already built) where they see all ongoing projects (with their images and map locations).
They can track project by location.
They can make comments regarding the project.
Ananymous users have limited comments to make, they can also not respond to other comments.
This app is almost perfect except for our recent refactor, we may need some change.





