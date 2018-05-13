let MongoClient = require('mongodb').MongoClient;
const binance = require('./internal/node-binance-api.js');
let fs = require('fs');
let assert = require('assert');

let FiredCoinInfo = process.env.FiredCoinInfoPath;
FiredCoinInfo = JSON.parse(fs.readFileSync(FiredCoinInfo));
console.log(FiredCoinInfo);


if(FiredCoinInfo.SYMBOL === undefined){
    console.log("SYMBOL undefined");
    process.exit();
}

let dbase = null;

binance.options({
    'APIKEY':FiredCoinInfo.requestAsksBids.APIKEY,
    'APISECRET':FiredCoinInfo.requestAsksBids.APISECRET
});
MongoClient.connect(FiredCoinInfo.MONGODB, function(err, db) {
    assert.equal(null, err);
    console.log('Connected correctly to server.');

    dbase = db.db(FiredCoinInfo.requestAsksBids.name);
    if(FiredCoinInfo.requestAsksBids.OverWrite === "1"){
        dbase.dropDatabase(function(err, result){
            depthCache();
        });
    }else{
        depthCache();
    }
});
function depthCache() {

    let roll = function () {

        binance.depthRequest(FiredCoinInfo.SYMBOL, function (error, json) {

            if (error === null) {
                let nowTick = (new Date()).valueOf();

                let ask = parseFloat(json.asks[0][0]);
                let bid = parseFloat(json.bids[0][0]);
                // console.log(ask, bid);

                addDepthToDatabase(nowTick, ask, bid);
            } else {
                console.log(error);
            }
        }, 5);
        setTimeout(roll, 1000);
    };
    roll();
}

let depths={
    count:[0,0,0,0,0,0,0,0],
    prvtick:[0,0,0,0,0,0,0,0],
    ticksName:["t_1s","t_30s","t_1m","t_5m","t_10m","t_1h","t_12h","t_1d"],
    ticks:[0,1000*30, 1000*60, 1000*60*5, 1000*60*10, 1000*60*60, 1000*60*60*12, 1000*60*60*24],
    askAmount:[0,0,0,0,0,0,0,0],
    bidAmount:[0,0,0,0,0,0,0,0],
};

function addDepthToDatabase(tick, ask, bid){

    for(let i = 0; i < depths.ticks.length; i++){
        depths.askAmount[i]+=ask;
        depths.bidAmount[i]+=bid;
        depths.count[i]+=1;

        if(tick - depths.prvtick[i] >= depths.ticks[i]){

            let aveAsk = depths.askAmount[i] / depths.count[i];
            let aveBid = depths.bidAmount[i] / depths.count[i];

            let setData = {ask:aveAsk, bid:aveBid};
            let where = {_id:tick};
            let updateStr = {$set: setData};
            let collectionName = depths.ticksName[i];
            dbase.collection(collectionName).update(where,updateStr,{upsert:true}, function(err) {
                if (err) throw err;
                // console.log(collectionName+" :" +"ask :"+aveAsk+" bid:"+aveBid+" inset done");
            });

            depths.askAmount[i] = 0;
            depths.bidAmount[i] = 0;
            depths.count[i] = 0;
            depths.prvtick[i] = tick;

            if(depths.ticksName[i] === "t_1m"){

                // addAvgToDatabase("t_1s", "avg_1m", tick, 1000*60*5);//5分钟线
                addAvgToDatabase("t_30s", "avg_5m", tick, 1000*60*5);//5分钟线
                addAvgToDatabase("t_1m","avg_10m", tick, 1000*60*10);//10分钟线
                addAvgToDatabase("t_1m","avg_30m", tick, 1000*60*30);//30分钟线
                addAvgToDatabase("t_1m","avg_1h", tick, 1000*60*60);//1小时线
                addAvgToDatabase("t_1m","avg_2h", tick, 1000*60*60*2);//2小时线
                addAvgToDatabase("t_1m","avg_6h", tick, 1000*60*60*6);//6小时线
                addAvgToDatabase("t_1m","avg_12h", tick, 1000*60*60*12);//12小时线
                addAvgToDatabase("t_1m","avg_1d", tick, 1000*60*60*24);//1天线
                addAvgToDatabase("t_5m","avg_2d", tick, 1000*60*60*24*2);//2天线
                addAvgToDatabase("t_10m","avg_4d", tick, 1000*60*60*24*4);//4天线
                addAvgToDatabase("t_10m","avg_7d", tick, 1000*60*60*24*7);//7天线
            }
        }
    }
}

function addAvgToDatabase(fname,cname, tick, duration){

    let gt = tick - duration;
    dbase.collection(fname).aggregate([
        {'$match':{_id: {'$gt':gt}}}, {$group:{_id:null,ask:{'$avg':"$ask"}, min:{'$min':'$ask'}, max:{'$max':'$ask'}}},//1分钟线

    ]).toArray(function(err, res) {
        if (err) throw err;

        //console.log(res);
        if(res.length > 0){
            let setData = {
                ask:res[0].ask,
                min:res[0].min,
                max:res[0].max
            };
            let where = {_id:tick};
            let updateStr = {$set: setData};

            dbase.collection(cname).update(where,updateStr,{upsert:true}, function(err) {
                if (err) throw err;
                // console.log(collectionName+" :" +"ask :"+aveAsk+" bid:"+aveBid+" inset done");
            });
            dbase.collection("lastAvg").update({_id:cname},updateStr,{upsert:true}, function(err) {
                if (err) throw err;
                // console.log(collectionName+" :" +"ask :"+aveAsk+" bid:"+aveBid+" inset done");
            });
        }

    })

}