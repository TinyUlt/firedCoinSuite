let fs = require('fs');
let assert = require('assert');
let FServer = require('./internal/server.js');
let MongoClient = require('mongodb').MongoClient;
let Binance = require('./internal/node-binance-api.js');
let firedCoinInfo = JSON.parse(fs.readFileSync(process.env.FiredCoinInfoPath));

MongoClient.connect(firedCoinInfo.MONGODB, function(err, db) {
    assert.equal(null, err);
    console.log('Connected correctly to server.');

    let dbServersManager=db.db(firedCoinInfo.managerName);
    dbServersManager.dropDatabase(function(err, result){
        console.log("Error : "+err);
        console.log("Operation Success ? "+result);
        // after all the operations with db, close it.
        let servers=[];
        let binance = (new Binance()).core;

        binance.options({
            'APIKEY':firedCoinInfo.requestAsksBids.APIKEY,
            'APISECRET':firedCoinInfo.requestAsksBids.APISECRET
        });

        let dbchart = db.db(firedCoinInfo.requestAsksBids.name);


        // updateAvgMinMaxPrice();

        if(firedCoinInfo.SYMBOL === undefined){
            console.log("SYMBOL undefined");
            process.exit();
        }
        let operatorConfig = JSON.parse(fs.readFileSync(`${firedCoinInfo.SYMBOL}/config_operator.json`));
        let simulationConfig = JSON.parse(fs.readFileSync(`${firedCoinInfo.SYMBOL}/config_simulation.json`));


        let managerConfig={};
        for(let i = 0; i < firedCoinInfo.server.length; i ++){
            managerConfig[firedCoinInfo.server[i].name] = {};
            managerConfig[firedCoinInfo.server[i].name].run = firedCoinInfo.server[i].enable;
            let robotDatabase = db.db(firedCoinInfo.server[i].name);
            servers[i] = new FServer( firedCoinInfo.server[i],operatorConfig, simulationConfig,db, robotDatabase, dbchart);
        }
        setConfig();
        update();
        function update(){

            updateInfo();
            getConfig();

        }

        function recieveDepth(tick, ask, bid){
            for(let i = 0; i < firedCoinInfo.server.length; i ++){
                let server = servers[i];
                if(server.GlobalData.simulation !== null){

                    server.GlobalData.simulation.recieveDepth(tick, firedCoinInfo.SYMBOL, ask, bid);
                }
            }
            update();
        }
        let recieveTick = (new Date()).valueOf();

        if (simulationConfig.useManagerAsksBids && simulationConfig.useRealData === 1){
            binance.websockets.depthCache([firedCoinInfo.SYMBOL],function(symbol, depth){
                process.stdout.write("wsk");
                recieveTick = (new Date()).valueOf();
                let max = 1;
                let bids = binance.sortBids(depth.bids, max);
                let asks = binance.sortAsks(depth.asks, max);

                let bid =parseFloat(binance.first(bids)) ;
                let ask = parseFloat(binance.first(asks)) ;

                recieveDepth(recieveTick, ask, bid);
            },10);
        }

        function checkConnecting() {
            let now = (new Date()).valueOf();
            //已经掉线
            if(now - recieveTick > 2000){
                httpsGetDepth();
            }
            setTimeout(checkConnecting,1000);
        }

        checkConnecting();



        function httpsGetDepth(){

            if (simulationConfig.useManagerAsksBids && simulationConfig.useRealData === 1){
                binance.depthRequest(firedCoinInfo.SYMBOL,function(error,json){
                    process.stdout.write("htp");
                    if (error === null){
                        let nowTick = (new Date()).valueOf();

                        let ask =parseFloat(json.asks[0][0]);
                        let bid =parseFloat(json.bids[0][0]);
                        recieveDepth(nowTick, ask, bid);
                    } else {
                        console.log(error);
                    }
                },5);
            }
        }

        function updateInfo() {
            let managerInfo = {};
            let hasValue = false;
            for(let i = 0; i < firedCoinInfo.server.length; i ++){
                let server = servers[i];
                if(server.infoData !== null){
                    managerInfo[server.infoData.serverId] = {
                        run:managerConfig[server.serverInfo.name].run,
                        buyTradCount:server.infoData.buyTradCount,
                        sellTradCount:server.infoData.sellTradCount,
                        robotCount:server.infoData.robotCount,
                        leftUSDT:server.infoData.realBalance.USDT,
                        costUSDT:server.infoData.simulDf.USDT,
                        Property:server.infoData.simulDf.Property,
                        earnUSDT:server.infoData.earnSum,
                        updateTime:server.infoData.updateTime,
                    };
                    hasValue = true;
                }
            }
            if(hasValue === true){
                let where = {_id:0};
                let updateStr = {$set: managerInfo};

                dbServersManager.collection("info").update(where,updateStr,{upsert:true}, function(err) {
                    if (err) throw err;
                });
            }


        }
        function setConfig(){

            let where = {_id:0};
            let updateStr = {$set: managerConfig};

            dbServersManager.collection("config").update(where,updateStr,{upsert:true}, function(err) {
                if (err) throw err;
            });
        }
        function getConfig(){

            dbServersManager.collection("config"). find({_id:0}).toArray(function(err, result) { // 返回集合中所有数据
                if (err) throw err;

                if(result.length !== 0) {
                    managerConfig = result[0];
                    for(let i = 0; i < firedCoinInfo.server.length; i ++){
                        let server = servers[i];
                        server.GlobalData.run = managerConfig[server.serverInfo.name].run
                    }
                }
            });
        }
    });



});

