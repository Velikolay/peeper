Peeper
============

Part of infromation retrieval course 2013

Peeper is a web application that enables monitoring of keywords and phrases in social media portals.
It allows you to keep close look on topics, brands, products, people and events that you are interested in. It makes it easy to identify activity trends in real-time and get understanding about the overall emotions of the things you care.

## Developer`s guide:
1. Install nodejs & npm
2. Checkout the git repository
3. In the project`s root folder execute nmp install
4. Install and run MongoDB ```mongod --dbpath <path_to_the_data_folder> --setParameter textSearchEnabled=true"```
5. Create "dev" database
6. Add twitter credentials in ```./cfg/serviceCfg.js```
7. (optional)Install and run the sentiment analysis service - Contact Me
8. Start the application ```node <proj_root>/app.js```

## Points for improvement
1. Eventually add the ability to monitor multiple phrases simultaneously and easily switch between them
2. Enable monitoring of urls
3. Integrate with social medias other than twitter

