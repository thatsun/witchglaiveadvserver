const app = require('express')();
const server = require('http').Server(app);
const io = require('socket.io')(server);

const port= 3000 || process.ENV_PORT;

server.listen(port);


let enemies=[];
let playerSpawnPoints=[];
let clients=[];

app.get('/', (req,res)=>{
    res.send('server up and runing');

});

io.on('connection',(socket)=>{

    let currentPlayer={};
    currentPlayer.name='uknown';

    socket.on('player connect',()=>{
        console.log(currentPlayer.name+' recv: player connect');
        
        for(let i=0; i<clients.length; i++ ){
            let playerConnected={
                name: clients[i].name,
                position: clients[i].position,
                rotation: clients[i].rotation,
                health: clients[i].health

            };
            socket.emit('other player connected', playerConnected);
            console.log(currentPlayer.name + 'emit: other player connected: '+ JSON.stringify(playerConnected) );

            

        }


    });


    socket.on('play',(data)=>{
        console.log(currentPlayer.name+' recv: play: '+JSON.stringify(data));
        if(clients.length===0){
            numberOfenemies=data.enemySpawnPoints.length;
            enemies=[];
            data.enemySpawnPoints.forEach(_enemySpawnPoint => {
                var enemy={
                    name:guid(),
                    position: _enemySpawnPoint.position,
                    rotation: _enemySpawnPoint.rotation,
                    health: 100

                };
                enemies.push(enemy);


                
            });
            playerSpawnPoints=[];
            data.playerSpawnPoints.forEach(_playerSpawnPoint => {
                var playerSpawnPoint={
                    position: _playerSpawnPoint.position,
                    rotation: _playerSpawnPoint.rotation
                }
                playerSpawnPoints.push(playerSpawnPoint);
            }); 
        }
        var enemiesResponse={
            enemies:enemies


        }
        console.log(currentPlayer.name+ 'emit: enemies: '+ JSON.stringify(enemiesResponse));

        socket.emit('enemies',enemiesResponse);

        var randomSpawnPoint=playerSpawnPoints[Math.floor(Math.random()*playerSpawnPoints.length)];
        currentPlayer={
            name: data.name,
            position: randomSpawnPoint.position,
            rotation: randomSpawnPoint.rotation,
            health:100
        };
        clients.push(currentPlayer);
        //in your current game, tell you that you have joined
        console.log(currentPlayer.name + ' emit: play: '+JSON.stringify(currentPlayer));
        socket.emit('play',currentPlayer);
        //in your current game we need to tell to the other players about you
        socket.broadcast.emit('other player connected',currentPlayer);


    });

    socket.on('player move',(data)=>{
        console.log('recv: move: '+ JSON.stringify(data));
        currentPlayer.position= data.position;
        socket.broadcast.emit('player move',currentPlayer);


    });

    socket.on('player turn',(data)=>{
        console.log('recv: turn: '+ JSON.stringify(data));
        currentPlayer.rotation= data.rotation;
        socket.broadcast.emit('player turn',currentPlayer);

    });

    socket.on('player hit',(data)=>{
        console.log('recv: hit: '+ JSON.stringify(data));
        
        socket.broadcast.emit('player hit',data);

    });

    socket.on('player hited',(data)=>{
        console.log('recv: hited: '+ JSON.stringify(data));       
        if(data.name===currentPlayer.name){
            var indexDamaged = 0 ;
            if(!data.isEnemy){
                clients=clients.map( (client,index)=>{
                    if(client.name==data.name){
                        indexDamaged = index ;
                        client.health-= data.healthChange;
                    }
                    return client;
                });
            }else{
                enemies=enemies.map( (enemy,index)=>{
                    if(enemy.name===data.name){
                        indexDamaged = index ;
                        enemy.health-=data.healthChange;



                    }
                    return enemy;

                });


            }
        }
        socket.broadcast.emit('player hited',data);
        var response={
            name:(!data.isEnemy) ? clients[indexDamaged].name : enemies[indexDamaged].name,
            health: (!data.isEnemy) ? clients[indexDamaged].health : enemies[indexDamaged].health
        }
        socket.emit('health',response);
        socket.broadcast.emit('health',response);

    });

    socket.on('health', (data)=>{
        console.log(currentPlayer.name+ 'recv: health: '+ JSON.stringify(data));
        if(data.from===currentPlayer.name){
            var indexDamaged = 0 ;
            if(!data.isEnemy){
                clients=clients.map( (client,index)=>{
                    if(client.name==data.name){
                        indexDamaged=index;
                        client.health-= data.healthChange;
                    }
                    return client;
                });
            }else{
                enemies=enemies.map( (enemy,index)=>{
                    if(enemy.name===data.name){
                        indexDamaged=index;
                        enemy.health-=healthChange;



                    }
                    return enemy;

                });


            }
            var response={
                name:(!data.isEnemy) ? clients[indexDamaged].name : enemies[indexDamaged].name,
                health: (!data.isEnemy) ? clients[indexDamaged].health : enemies[indexDamaged].health
            }
            console.log(currentPlayer.name+' bcst: halth: '+JSON.stringify(response));
            socket.emit('health',response);
            socket.broadcast.emit('health',response);


        }
    });
    socket.on('player jump',(data)=>{
        console.log('recv: jump: '+ JSON.stringify(data));
        
        socket.broadcast.emit('player jump',data);

    });


    socket.on('disconnect',()=>{
        console.log(currentPlayer.name+' recv: disconnect' + currentPlayer.name);
        socket.broadcast.emit('other player disconnected', currentPlayer);
        console.log(currentPlayer.name+' bcst: other player disconnected '+ JSON.stringify(currentPlayer));

        
        for(var i=0 ; i < clients.length;i++){
            if(clients[i].name===currentPlayer.name){
                clients.splice(i,1);
    
            }
    
        }        
        currentPlayer={};
        currentPlayer.name='uknown';

        

    });

});

console.log('--- server is runing');

function guid(){
    function s4(){
        return Math.floor((1+Math.random())* 0x10000).toString(16).substring(1);
    }
    return s4() + s4() +'-'+ s4() +'-' + s4() + '-'+ s4() + '-' + s4() + s4() +s4();
}