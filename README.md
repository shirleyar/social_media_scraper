# social_media_scraper

## Description
This is a script that scrapes a specific social media website, "BookFace".
It receives a user name and password of a user and the data of all accessible users from the given user will be scraped.    
Foreach accessible user - returns:
* name
* age
* favorite color
* list of users that the user is following
* list of users that the are following the user

## Getting Started
In order to use the script either run (in terminal, CWD should be project's path):     
`npm start <username> <password>`    
OR     
`node ./src/app.js <username> <password>`

## Open issues
* favorite color decode need some more work. Decoded B value. Use of masks (hex FF0000, FF00) were no use. Need to check the relations between the returned values and the RGB in the website.