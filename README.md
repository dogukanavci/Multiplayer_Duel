# Multiplayer_Duel
<h2>Gameplay</h2>
A multiplayer duelling game made on phaser game engine, each user needs to signup before playing the game.
Each player has 3 lives and the aim is to shoot as many users as possible which then the score of the player
is updated on realtime. There are so far two sections of the map which could be travelled through a gate.
The movement is done through arrow keys, space is used to shoot and shift button is used to activate shield.
Shield could be used for a limited time so be cautious.


<h2>Instructions</h2>
To play the game, clone this repository to your local machine. Then through the usage of Terminal,
find the repository with app.js file. Make sure node is installed in your machine. The dependencies
in the game are: express, firebase-admin,socket.io,http,request,ejs,body-parser. The command to install
these packages are npm install --save "", (for example npm install --save ejs). To use your own firebase 
database, install the private key provided by firebase and save the file as "serviceAccountKey.json"
You also need to edit the app.js 8th line admin.initializeapp to fit your credentials. Once all the 
packages are installed and the firebase configuration is done, run node app.js command to run the app.
