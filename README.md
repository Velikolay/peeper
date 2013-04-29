Peeper
============

Part of infromation retrieval course 2013

Peeper is a web application that enables monitoring of keywords and phrases in social network sites.
It allow you to keep close look on topics, brands, products, people and event that you are interested in, identify activity trends in real-time and get understanding about the overall emotions.

## Developer`s guide:
1. Install nodejs & npm
2. Checkout the git repository
3. In the project`s root folder execute nmp install
4. Install and run MongoDB ```mongod --dbpath <path_to_the_data_folder> --setParameter textSearchEnabled=true"```
5. Create "dev" database
6. Add twitter credentials in ```./cfg/serviceCfg.js```
7. (optional)Install and run the sentiment analysis service - Contact Me
8. Start the application ```node <proj_root>/app.js```

## Current project status:
1. The application constantly retrieves tweets(using Twitter Streaming API) related to a give set of phrases.
2. You can add new phrases to be monitored as well as get rid of unwanted ones.
3. The retrieved tweets get evaluated by sentiment analysis service and then stored in the database, together with the sentiment meta-data.
4. One can query any of the monitored phrases and the related results will show up in the browser.
5. When new relevant results are kept by the server it automatically pushes them to the client(e.g. websocket integration for real-time feeling) 
6. There is a client with quite lame user interface, which was so far used only for the sake of testing. EJS module is integrated on the client-side for building HTML from templates

## TODO
1. Improve server-side logic for handling monitoring requests. 
2. Create fancy user interface
3. Eventually add the ability to monitor multiple phrases simultaneously
4. Enable monitoring of urls
5. Integrate with other social medias twitter
6. More...
