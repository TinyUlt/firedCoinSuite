let fs = require('fs');
let assert = require('assert');
let FServer = require('./internal/server.js');
let MongoClient = require('mongodb').MongoClient;
let firedCoinInfo = JSON.parse(fs.readFileSync(process.env.FiredCoinInfoPath));

MongoClient.connect(firedCoinInfo.MONGODB, function(err, db) {
    assert.equal(null, err);
    console.log('Connected correctly to server.');



    let dbchart = db.db(firedCoinInfo.requestAsksBids.name);
    // updateAvgMinMaxPrice();

    if(firedCoinInfo.SYMBOL === undefined){
        console.log("SYMBOL undefined");
        process.exit();
    }
    let operatorConfig = JSON.parse(fs.readFileSync(`${firedCoinInfo.SYMBOL}/config_operator.json`));
    let simulationConfig = JSON.parse(fs.readFileSync(`${firedCoinInfo.SYMBOL}/config_simulation.json`));

    for(let i = 0; i < firedCoinInfo.server.length; i ++){
        let robotDatabase = db.db(firedCoinInfo.server[i].name);
        let server = new FServer( firedCoinInfo.server[i],operatorConfig, simulationConfig,db, robotDatabase, dbchart);
    }

});