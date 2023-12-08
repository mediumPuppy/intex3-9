# README for Social Media Usage and Mental Health Project

## Overview
This project, aimed for the Fall 2023 INTEX Case, focuses on exploring the relationship between social media usage and mental health within the Provo community. It involves an investigation into a dataset from Plainsville, the creation of a website for data collection from Provo citizens, and a dashboard to visualize the relationship between social media usage and mental health.

## Technical Requirements
- **Node.js**: The server-side logic is managed by Node.js.
- **Database Management**: A PostgreSQL RDS instance is used for database operations.
- **Data Communications**: The platform is deployed on AWS and includes appropriate AWS services (RDS, Elastic Beanstalk, Code Pipeline). HTTPS is used for secure access.
- **Dependencies**:
  - `express`
  - `knex`
  - `path`
  - `dotenv`
  - `serve-favicon`
  - `express-validator`
  - `express-session`
  - `bcrypt`

## Website Usage Guide
- **URL**: intex39.is404.net (URL of the deployed website)
- **Admin Access**: For admin login, use the username: `admin` and password: `Intex39!`.
- **Survey Submission**: Users can fill out the survey on the `/survey` route.
- **Dashboard Interaction**: The dashboard is accessible on the `/learn` route, allowing users to filter and view data.

## Database Information
- **Normalization Process**: See the attached spreadsheet here: https://docs.google.com/spreadsheets/d/1fnX0E3RiPZVKZWyOxXHKLJQNGuHgsGcY-g_OwWeteHk/edit?usp=share_link for steps of normalization to 3rd Normal Form.
- **ERD**: The Entity-Relationship Diagram is included in the project files.

## Dashboard Functionality
The dashboard, embedded on the website, allows users to interact with data filtered by age, gender, occupation status, etc. It showcases the high-level relationship between social media usage and mental health.

## Source Code
- **Repository**: The source code is available at: https://github.com/mediumPuppy/intex3-9 (Link to GitHub repository)

## Python Exploratory Analysis
The exploratory analysis using Python is documented in the provided file (link: https://colab.research.google.com/drive/1W1-0ov9zHx8ASnhp8oFxmhrn66dWGCNb?usp=sharing). This file details the statistical insights that informed our project.

## Presentation Information
- **PowerPoint Slides**: The presentation slides can be found at: __________ (Link or file path)
- **Video Demonstration**: A video demonstration of the project is available at: __________ (Link to the video)

## Additional Notes
- For queries or additional information, please contact: @mediumPuppy (https://github.com/mediumPuppy/)