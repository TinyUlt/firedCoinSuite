let fs = require('fs');
let assert = require('assert');
let FServer = require('./internal/server.js');
let MongoClient = require('mongodb').MongoClient;
let firedCoinInfo = JSON.parse(fs.readFileSync(process.env.FiredCoinInfoPath));

MongoClient.connect(firedCoinInfo.MONGODB, function(err, db) {
    assert.equal(null, err);
    console.log('Connected correctly to server.');

    let servers=[];

    let dbchart = db.db(firedCoinInfo.requestAsksBids.name);
    let dbServersManager=db.db(firedCoinInfo.managerName);

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
        managerConfig[firedCoinInfo.server[i].name].run = true;
        let robotDatabase = db.db(firedCoinInfo.server[i].name);
        servers[i] = new FServer( firedCoinInfo.server[i],operatorConfig, simulationConfig,db, robotDatabase, dbchart);
    }
    setConfig();
    update();

    function update(){

        updateInfo();
        getConfig();
        setTimeout(update,1000);
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

