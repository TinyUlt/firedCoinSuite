let MongoClient = require('mongodb').MongoClient;
let assert = require('assert');
let Environment = require("./Robot0/Environment");
var SYMBOL = process.argv[2];
if(SYMBOL === undefined){
    console.log("SYMBOL undefined");
    process.exit();

}
// let RobotManager = require("./RobotManager.js");
let Simulation = require('./simulation-binance-api.js');
// let simulation = null;
let fs = require('fs');
let config = JSON.parse(fs.readFileSync(`${SYMBOL}/config_operator.json`));
console.log(config);
//环境变量
let MONGODB = process.env.MONGODB;
let DATABASE_EX = process.env.DATABASE_EX;


//全局变量
let GlobalData = {
    FileConfigFirst:            config.FileConfigFirst,
    buyFallingOfFees :          config.buyFallingOfFees,
    buyFallingRandomOfFees :    config.buyFallingRandomOfFees,
    buyFallingAddOfFees:        config.buyFallingAddOfFees,
    highstLimitOfFees :         config.highstLimitOfFees,
    highstLimitRandomOfFees :   config.highstLimitRandomOfFees,
    highstLimitAddOfFees:       config.highstLimitAddOfFees,
    highstLimitTime :           config.highstLimitTime,
    goodsAmountPerBuy :         config.goodsAmountPerBuy,
    Fees :                      config.Fees,
    sellHighstScale :           config.sellHighstScale,
    Multiple:                   config.Multiple,
    useCurrencyMax:             config.useCurrencyMax,
    enableBuy:                  config.enableBuy,
    enableSell:                 config.enableSell,
    lowPriceDfLimit:            config.lowPriceDfLimit,
    currencyDfMail:             config.currencyDfMail,
    emailList:                  config.emailList,
    readyIn:                    config.readyIn,
    currency:                   config.currency,
    goods:                      config.goods,
    commission:                 config.commission,
    symbol:                     config.symbol,
    bidsCache:               config.bidsCache,
    tradCountMax:               config.tradCountMax,
    avgDuration:                config.avgDuration,
    sellAll:                config.sellAll,
    simulation : null,
    environment:null,
    buyFalling:  0,
    buyFallingRandom: 0,
    buyFallingAdd:0,
    highstLimit:  0,
    highstLimitRandom:  0,
    highstLimitAdd:0,
    isIn:0,
    dbase:null,
    dbchart:null,
    nowPrice:0,
    lowstNodePrice:100000,
    hightstNodePrice:0,
    earnSum:0,
    robotCount:0,
    commissionFees:0,

    tradCount : 0,
    updateRobotCount:0,
    buyTradCount : 0,
    sellTradCount:0,
    maxPrice:0,
    minPrice:0,
    avgPrice:0,
    fallRateByAvg:1,
    // fallingRate:1,
    avgBuyEnable:0,
    useCurrencyHighst:0,
    avePrice:0,
    delayUpdate:false,
    startTime:(new Date()).toLocaleString()

};
let controll = null;
//获取配置，如果没有则插入
function getConfig(){

    GlobalData.dbase.collection("config"). find({_id:0}).toArray(function(err, result) { // 返回集合中所有数据
        if (err) throw err;

        if(result.length !== 0){
            let data = result[0];
            controll = data;

            if(data.goodsAmountPerBuy !== undefined){
                GlobalData.goodsAmountPerBuy = data.goodsAmountPerBuy;
            }
            if(data.Fees !== undefined){
                GlobalData.Fees = data.Fees;
            }
            if(data.sellHighstScale !== undefined){
                GlobalData.sellHighstScale = data.sellHighstScale;
            }
            if(data.buyFallingOfFees !== undefined){
                GlobalData.buyFallingOfFees = data.buyFallingOfFees;
            }
            if(data.buyFallingRandom !== undefined){
                GlobalData.buyFallingRandom = data.buyFallingRandom;
            }
            if(data.buyFallingAddOfFees !== undefined){
                GlobalData.buyFallingAddOfFees = data.buyFallingAddOfFees;
            }
            if(data.highstLimitTime !== undefined){
                GlobalData.highstLimitTime = data.highstLimitTime;
            }
            if(data.highstLimitRandomOfFees !== undefined){
                GlobalData.highstLimitRandomOfFees = data.highstLimitRandomOfFees;
            }
            if(data.highstLimitOfFees !== undefined){
                GlobalData.highstLimitOfFees = data.highstLimitOfFees;
            }
            if(data.highstLimitAddOfFees !== undefined){
                GlobalData.highstLimitAddOfFees = data.highstLimitAddOfFees;
            }
            if(data.useCurrencyMax !== undefined){
                GlobalData.useCurrencyMax = data.useCurrencyMax;
            }
            if(data.enableBuy !== undefined){
                GlobalData.enableBuy = data.enableBuy;
            }
            if(data.enableSell !== undefined){
                GlobalData.enableSell = data.enableSell;
            }
            if(data.lowPriceDfLimit !== undefined){
                GlobalData.lowPriceDfLimit = data.lowPriceDfLimit;
            }
            if(data.currencyDfMail !== undefined){
                GlobalData.currencyDfMail = data.currencyDfMail;
            }
            if(data.emailList !== undefined){
                GlobalData.emailList = data.emailList;
            }
            if(data.Multiple !== undefined){
                GlobalData.Multiple = data.Multiple;
            }
            if(data.readyIn !== undefined){
                GlobalData.readyIn = data.readyIn;
            }
            if(data.bidsCache !== undefined){
                GlobalData.bidsCache = data.bidsCache;
            }
            if(data.avgDuration !== undefined){
                GlobalData.avgDuration = data.avgDuration;
            }
            if(data.sellAll !== undefined){
                GlobalData.sellAll = data.sellAll;
            }
        }else{
            setConfig();
        }
    });
}
//设置配置
function setConfig(){
    let setData = {
        goodsAmountPerBuy:GlobalData.goodsAmountPerBuy,
        Fees:GlobalData.Fees,
        sellHighstScale:GlobalData.sellHighstScale,
        highstLimitOfFees:GlobalData.highstLimitOfFees,
        highstLimitRandomOfFees:GlobalData.highstLimitRandomOfFees,
        highstLimitAddOfFees:GlobalData.highstLimitAddOfFees,
        buyFallingOfFees:GlobalData.buyFallingOfFees,
        buyFallingRandomOfFees:GlobalData.buyFallingRandomOfFees,
        buyFallingAddOfFees:GlobalData.buyFallingAddOfFees,
        highstLimitTime:GlobalData.highstLimitTime,
        useCurrencyMax:GlobalData.useCurrencyMax,
        enableBuy:GlobalData.enableBuy,
        enableSell:GlobalData.enableSell,
        lowPriceDfLimit:GlobalData.lowPriceDfLimit,
        currencyDfMail:GlobalData.currencyDfMail,
        emailList:GlobalData.emailList,
        Multiple:GlobalData.Multiple,
        readyIn:GlobalData.readyIn,
        bidsCache:GlobalData.bidsCache,
        avgDuration:GlobalData.avgDuration,
        sellAll:GlobalData.sellAll
    };
    let where = {_id:0};
    let updateStr = {$set: setData};
    let collectionName = "config";

    GlobalData.dbase.collection(collectionName).update(where,updateStr,{upsert:true}, function(err) {
        if (err) throw err;
    });
}
//获取状态
function getInfo(){

    GlobalData.dbase.collection("info"). find({_id:0}).toArray(function(err, result) { // 返回集合中所有数据
        if (err) throw err;

        if(result.length !== 0){
            let data = result[0];

            if(data.earnSum !== null){
                GlobalData.earnSum = data.earnSum;
            }
            if(data.robotCount !== null){
                GlobalData.robotCount = data.robotCount;
            }
            if(data.commissionFees !== null){
                GlobalData.commissionFees = data.commissionFees;
            }
        }
    });
}
//更新状态
function updateInfo(tick){

    GlobalData.simulation.balance(function (error, originBalance, realBalance, simulBalance, commissionPrice) {

        if(error !== null){
            console.log(error);
            return;
        }
        let setData = {
            config:controll,
            originBalance:{
                [GlobalData.goods]:originBalance[GlobalData.goods].available,
                [GlobalData.currency]:originBalance[GlobalData.currency].available,
                [GlobalData.commission]:originBalance[GlobalData.commission].available,
                PreProperty:originBalance.PreProperty.available,
                Property:originBalance.Property.available,
                PropertyDf:originBalance.Property.df,
                [GlobalData.symbol+"Start"]:originBalance[GlobalData.symbol].available,
                [GlobalData.symbol+"Df"]:originBalance[GlobalData.symbol].df
            },
            realBalance:{
                [GlobalData.goods]:realBalance[GlobalData.goods].available,
                [GlobalData.currency]:realBalance[GlobalData.currency].available,
                [GlobalData.commission]:realBalance[GlobalData.commission].available,
                Property:realBalance.Property.available
            },
            simulBalance:{
                [GlobalData.goods]:simulBalance[GlobalData.goods].available,
                [GlobalData.currency]:simulBalance[GlobalData.currency].available,
                [GlobalData.commission]:simulBalance[GlobalData.commission].available,
                Property:simulBalance.Property.available
            },
            realDf:{
                [GlobalData.goods]:realBalance[GlobalData.goods].df,
                [GlobalData.currency]:realBalance[GlobalData.currency].df,
                [GlobalData.commission]:realBalance[GlobalData.commission].df,
                Property:realBalance.Property.df
            },
            simulDf:{
                [GlobalData.goods]:simulBalance[GlobalData.goods].df,
                [GlobalData.currency]:simulBalance[GlobalData.currency].df,
                [GlobalData.commission]:simulBalance[GlobalData.commission].df,
                Property:simulBalance.Property.df
            },
            isIn:GlobalData.isIn,
            useCurrencyHighst:GlobalData.useCurrencyHighst,
            buyTradCount:GlobalData.buyTradCount,
            sellTradCount:GlobalData.sellTradCount,
            robotCount:GlobalData.robotCount,
            updateRobotCount:GlobalData.updateRobotCount,

            commissionFees:GlobalData.commissionFees,
            earnSum:GlobalData.earnSum,

            commission:GlobalData.commission,
            commissionPrice:commissionPrice,
            [GlobalData.symbol]:GlobalData.nowPrice,
            lowstNodePrice:GlobalData.lowstNodePrice,
            hightstNodePrice:GlobalData.hightstNodePrice,
            avgDuration:GlobalData.avgDuration,
            minPrice:GlobalData.minPrice,
            avgPrice:GlobalData.avgPrice,
            maxPrice:GlobalData.maxPrice,
            // fallingRate:GlobalData.fallingRate,
            avgBuyEnable:GlobalData.avgBuyEnable,
            serverId:DATABASE_EX,
            // fallingPrice:managers[0].falling * GlobalData.fallingRate,
            startTime:GlobalData.startTime,
            updateTime:(new Date(tick)).toLocaleString(),
            updateTick:tick


        };
        let where = {_id:0};
        let updateStr = {$set: setData};
        let collectionName = "info";

        GlobalData.dbase.collection(collectionName).update(where,updateStr,{upsert:true}, function(err) {
            if (err) throw err;
        });
    })
}


// let managers = [];
//初始化数据库
let dbName = config["dataBaseName"]+"_"+DATABASE_EX;
//初始化数据库，模拟器，机器人管理器
MongoClient.connect(MONGODB, function(err, db) {
    assert.equal(null, err);
    console.log('Connected correctly to server.');
    GlobalData.dbchart = db.db(SYMBOL + "_Chart");
    // updateAvgMinMaxPrice();

    GlobalData.dbase = db.db(dbName);

    GlobalData.dbase.dropDatabase(function(err, result){
        console.log("Error : "+err);
        console.log("Operation Success ? "+result);
        // after all the operations with db, close it.
        GlobalData.dbase = db.db(dbName);
        GlobalData.dbase.createCollection("buySell", function(err, res) {
            // if (err) throw err;
            console.log("buy Collection created!");
            GlobalData.dbase.collection("buySell").ensureIndex({"buyTick":1,"sellTick":1}, function(err, res){
                // console.log(err);
                console.log("buy Collection ensureIndex!");

                if(GlobalData.FileConfigFirst === 1){
                    setConfig();
                }
                getConfig();

                // for(let i = 0; i < 200; i++){
                //     managers.push(new RobotManager(i,GlobalData));
                // }
                GlobalData.environment = new Environment(GlobalData);
                GlobalData.simulation = new Simulation(GlobalData, recieveDepth);
            })
        });

    });
    // GlobalData.dbase.collection("info").rename("info_"+(new Date()).valueOf(), function(err, newColl) {
    //     // console.log(err);
    //     GlobalData.dbase.collection("robot").rename("robot_"+(new Date()).valueOf(), function(err, newColl) {
    //         // console.log(err);
    //         GlobalData.dbase.createCollection("robot", function(err, res) {
    //             // if (err) throw err;
    //             console.log("buy Collection created!");
    //             GlobalData.dbase.collection("robot").ensureIndex({"buyTick":1,"sellTick":1}, function(err, res){
    //                 // console.log(err);
    //                 console.log("buy Collection ensureIndex!");
    //
    //                 if(GlobalData.FileConfigFirst === 1){
    //                     setConfig();
    //                 }
    //                 getConfig();
    //
    //                 for(let i = 0; i < 200; i++){
    //                     managers.push(new RobotManager(i,GlobalData));
    //                 }
    //                 GlobalData.simulation = new Simulation(GlobalData, recieveDepth);
    //             })
    //         });
    //     });
    // });

});
//websockt驱动的定时器
function recieveDepth(tick, symbol, ask, bid){

    GlobalData.robotCount = 0;
    GlobalData.tradCount = 0;
    GlobalData.updateRobotCount = 0;
    GlobalData.environment.update(tick, ask, bid);
    // if(GlobalData.isIn === 0){
    //     if(GlobalData.readyIn === 0){
    //         GlobalData.isIn = 1;
    //     }else if(ask < GlobalData.readyIn ){
    //         GlobalData.isIn = 1
    //     }
    // }else{
    //     // for(let i = 0; i < GlobalData.Multiple; i++){
    //     //
    //     //     let manager = managers[i];
    //     //
    //     //     if(manager!==null){
    //     //         if(GlobalData.tradCount < GlobalData.tradCountMax){
    //     //             manager.update(tick, ask, bid);
    //     //             GlobalData.updateRobotCount++;
    //     //         }
    //     //         GlobalData.nowPrice = bid;
    //     //         GlobalData.robotCount += manager.nodeMap.size
    //     //     }
    //     // }
    // }


    updateInfo(tick);
    getConfig();

    //addDepthToDatabase(tick, ask, bid);
    // updateAvgMinMaxPrice();
    // console.log(tick.toLocaleString());
}
//得到历史平均值，最大最小值
// function updateAvgMinMaxPrice(){
//     GlobalData.dbchart.collection("lastAvg").find({_id:GlobalData.avgDuration}).toArray(function(err, res) {
//             if(res.length > 0){
//                 //console.log(res);
//                 GlobalData.maxPrice = res[0].max;
//                 GlobalData.minPrice = res[0].min;
//                 GlobalData.avgPrice = res[0].ask;
//             }
//
//         });
// }

//
// let depths={
//     count:[0,0,0,0,0,0,0,0],
//     prvtick:[0,0,0,0,0,0,0,0],
//     ticksName:["t_1s","t_30s","t_1m","t_5m","t_10m","t_1h","t_12h","t_1d"],
//     ticks:[0,1000*30, 1000*60, 1000*60*5, 1000*60*10, 1000*60*60, 1000*60*60*12, 1000*60*60*24],
//     askAmount:[0,0,0,0,0,0,0,0],
//     bidAmount:[0,0,0,0,0,0,0,0],
// };
//
// function addDepthToDatabase(tick,  ask, bid){
//
//     for(let i = 0; i < depths.ticks.length; i++){
//         depths.askAmount[i]+=ask;
//         depths.bidAmount[i]+=bid;
//         depths.count[i]+=1;
//
//         if(tick - depths.prvtick[i] >= depths.ticks[i]){
//
//             let aveAsk = depths.askAmount[i] / depths.count[i];
//             let aveBid = depths.bidAmount[i] / depths.count[i];
//
//             let setData = {ask:aveAsk, bid:aveBid};
//             let where = {_id:tick};
//             let updateStr = {$set: setData};
//             let collectionName = depths.ticksName[i];
//             GlobalData.dbase.collection(collectionName).update(where,updateStr,{upsert:true}, function(err) {
//                 if (err) throw err;
//                 // console.log(collectionName+" :" +"ask :"+aveAsk+" bid:"+aveBid+" inset done");
//             });
//
//             depths.askAmount[i] = 0;
//             depths.bidAmount[i] = 0;
//             depths.count[i] = 0;
//             depths.prvtick[i] = tick;
//         }
//     }
// }



