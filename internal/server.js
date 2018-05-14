// let MongoClient = require('mongodb').MongoClient;
let assert = require('assert');
// let fs = require('fs');
let Environment = require("./Robot/Environment");
let Simulation = require('./simulation-binance-api.js');
class FServer{
    constructor(serverInfo, config, simulationConfig, db, robotDatabase, chartDatabase){

        let self = this;
        this.infoData=null;
        this.serverInfo=serverInfo;

        //全局变量
        this.GlobalData = {
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
            dbase:robotDatabase,
            dbchart:chartDatabase,
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
            startTime:(new Date()).toLocaleString(),
            simulationConfig:simulationConfig,
            serverInfo:serverInfo,
            controll : null,
            run:false,

        };

        robotDatabase.dropDatabase(function(err, result){
            console.log("Error : "+err);
            console.log("Operation Success ? "+result);
            // after all the operations with db, close it.
            robotDatabase = db.db(serverInfo.name);
            robotDatabase.createCollection("buySell", function(err, res) {
                // if (err) throw err;
                console.log("buy Collection created!");
                robotDatabase.collection("buySell").ensureIndex({"buyTick":1,"sellTick":1}, function(err, res){
                    // console.log(err);
                    console.log("buy Collection ensureIndex!");

                    // if(self.GlobalData.FileConfigFirst === 1){
                    //     self.setConfig();
                    // }
                    self.setConfig();


                    // for(let i = 0; i < 200; i++){
                    //     managers.push(new RobotManager(i,GlobalData));
                    // }
                    self.GlobalData.environment = new Environment(self.GlobalData);
                    self.GlobalData.simulation = new Simulation(self.GlobalData,(tick, symbol, ask, bid)=>{ self.recieveDepth(tick, symbol, ask, bid)});
                })
            });

        });


        // this.SYMBOL = firedCoinInfo.SYMBOL;

        // let config = JSON.parse(fs.readFileSync(`../${SYMBOL}/config_operator.json`));
        // let simulationConfig = JSON.parse(fs.readFileSync(`../${SYMBOL}/config_simulation.json`));

        // this.MONGODB = FiredCoinInfo.MONGODB;
        // let serverInfo = FiredCoinInfo.server[0];



    }
    getConfig(){

        let self = this;
        self.GlobalData.dbase.collection("config"). find({_id:0}).toArray(function(err, result) { // 返回集合中所有数据
            if (err) throw err;

            if(result.length !== 0){
                let data = result[0];
                self.GlobalData.controll = data;

                if(data.goodsAmountPerBuy !== undefined){
                    self.GlobalData.goodsAmountPerBuy = data.goodsAmountPerBuy;
                }
                if(data.Fees !== undefined){
                    self.GlobalData.Fees = data.Fees;
                }
                if(data.sellHighstScale !== undefined){
                    self.GlobalData.sellHighstScale = data.sellHighstScale;
                }
                if(data.buyFallingOfFees !== undefined){
                    self.GlobalData.buyFallingOfFees = data.buyFallingOfFees;
                }
                if(data.buyFallingRandom !== undefined){
                    self.GlobalData.buyFallingRandom = data.buyFallingRandom;
                }
                if(data.buyFallingAddOfFees !== undefined){
                    self.GlobalData.buyFallingAddOfFees = data.buyFallingAddOfFees;
                }
                if(data.highstLimitTime !== undefined){
                    self.GlobalData.highstLimitTime = data.highstLimitTime;
                }
                if(data.highstLimitRandomOfFees !== undefined){
                    self.GlobalData.highstLimitRandomOfFees = data.highstLimitRandomOfFees;
                }
                if(data.highstLimitOfFees !== undefined){
                    self.GlobalData.highstLimitOfFees = data.highstLimitOfFees;
                }
                if(data.highstLimitAddOfFees !== undefined){
                    self.GlobalData.highstLimitAddOfFees = data.highstLimitAddOfFees;
                }
                if(data.useCurrencyMax !== undefined){
                    self.GlobalData.useCurrencyMax = data.useCurrencyMax;
                }
                if(data.enableBuy !== undefined){
                    self.GlobalData.enableBuy = data.enableBuy;
                }
                if(data.enableSell !== undefined){
                    self.GlobalData.enableSell = data.enableSell;
                }
                if(data.lowPriceDfLimit !== undefined){
                    self.GlobalData.lowPriceDfLimit = data.lowPriceDfLimit;
                }
                if(data.currencyDfMail !== undefined){
                    self.GlobalData.currencyDfMail = data.currencyDfMail;
                }
                if(data.emailList !== undefined){
                    self.GlobalData.emailList = data.emailList;
                }
                if(data.Multiple !== undefined){
                    self.GlobalData.Multiple = data.Multiple;
                }
                if(data.readyIn !== undefined){
                    self.GlobalData.readyIn = data.readyIn;
                }
                if(data.bidsCache !== undefined){
                    self.GlobalData.bidsCache = data.bidsCache;
                }
                if(data.avgDuration !== undefined){
                    self.GlobalData.avgDuration = data.avgDuration;
                }
                if(data.sellAll !== undefined){
                    self.GlobalData.sellAll = data.sellAll;
                }
            }else{
                self.setConfig();
            }
        });
    }
    setConfig(){
        let self = this;
        let setData = {
            goodsAmountPerBuy:self.GlobalData.goodsAmountPerBuy,
            Fees:self.GlobalData.Fees,
            sellHighstScale:self.GlobalData.sellHighstScale,
            highstLimitOfFees:self.GlobalData.highstLimitOfFees,
            highstLimitRandomOfFees:self.GlobalData.highstLimitRandomOfFees,
            highstLimitAddOfFees:self.GlobalData.highstLimitAddOfFees,
            buyFallingOfFees:self.GlobalData.buyFallingOfFees,
            buyFallingRandomOfFees:self.GlobalData.buyFallingRandomOfFees,
            buyFallingAddOfFees:self.GlobalData.buyFallingAddOfFees,
            highstLimitTime:self.GlobalData.highstLimitTime,
            useCurrencyMax:self.GlobalData.useCurrencyMax,
            enableBuy:self.GlobalData.enableBuy,
            enableSell:self.GlobalData.enableSell,
            lowPriceDfLimit:self.GlobalData.lowPriceDfLimit,
            currencyDfMail:self.GlobalData.currencyDfMail,
            emailList:self.GlobalData.emailList,
            Multiple:self.GlobalData.Multiple,
            readyIn:self.GlobalData.readyIn,
            bidsCache:self.GlobalData.bidsCache,
            avgDuration:self.GlobalData.avgDuration,
            sellAll:self.GlobalData.sellAll
        };
        let where = {_id:0};
        let updateStr = {$set: setData};
        let collectionName = "config";

        self.GlobalData.dbase.collection(collectionName).update(where,updateStr,{upsert:true}, function(err) {
            if (err) throw err;

            self.getConfig();
        });
    }

    updateInfo(tick){
        let self = this;
        self.GlobalData.simulation.balance(function (error, originBalance, realBalance, simulBalance, commissionPrice) {

            if(error !== null){
                console.log(error);
                return;
            }
            self.infoData = {
                config:self.GlobalData.controll,
                originBalance:{
                    [self.GlobalData.goods]:originBalance[self.GlobalData.goods].available,
                    [self.GlobalData.currency]:originBalance[self.GlobalData.currency].available,
                    [self.GlobalData.commission]:originBalance[self.GlobalData.commission].available,
                    PreProperty:originBalance.PreProperty.available,
                    Property:originBalance.Property.available,
                    PropertyDf:originBalance.Property.df,
                    [self.GlobalData.symbol+"Start"]:originBalance[self.GlobalData.symbol].available,
                    [self.GlobalData.symbol+"Df"]:originBalance[self.GlobalData.symbol].df
                },
                realBalance:{
                    [self.GlobalData.goods]:realBalance[self.GlobalData.goods].available,
                    [self.GlobalData.currency]:realBalance[self.GlobalData.currency].available,
                    [self.GlobalData.commission]:realBalance[self.GlobalData.commission].available,
                    Property:realBalance.Property.available
                },
                simulBalance:{
                    [self.GlobalData.goods]:simulBalance[self.GlobalData.goods].available,
                    [self.GlobalData.currency]:simulBalance[self.GlobalData.currency].available,
                    [self.GlobalData.commission]:simulBalance[self.GlobalData.commission].available,
                    Property:simulBalance.Property.available
                },
                realDf:{
                    [self.GlobalData.goods]:realBalance[self.GlobalData.goods].df,
                    [self.GlobalData.currency]:realBalance[self.GlobalData.currency].df,
                    [self.GlobalData.commission]:realBalance[self.GlobalData.commission].df,
                    Property:realBalance.Property.df
                },
                simulDf:{
                    [self.GlobalData.goods]:simulBalance[self.GlobalData.goods].df,
                    [self.GlobalData.currency]:simulBalance[self.GlobalData.currency].df,
                    [self.GlobalData.commission]:simulBalance[self.GlobalData.commission].df,
                    Property:simulBalance.Property.df
                },
                isIn:self.GlobalData.isIn,
                useCurrencyHighst:self.GlobalData.useCurrencyHighst,
                buyTradCount:self.GlobalData.buyTradCount,
                sellTradCount:self.GlobalData.sellTradCount,
                robotCount:self.GlobalData.robotCount,
                updateRobotCount:self.GlobalData.updateRobotCount,

                commissionFees:self.GlobalData.commissionFees,
                earnSum:self.GlobalData.earnSum,

                commission:self.GlobalData.commission,
                commissionPrice:commissionPrice,
                [self.GlobalData.symbol]:self.GlobalData.nowPrice,
                lowstNodePrice:self.GlobalData.lowstNodePrice,
                hightstNodePrice:self.GlobalData.hightstNodePrice,
                avgDuration:self.GlobalData.avgDuration,
                minPrice:self.GlobalData.minPrice,
                avgPrice:self.GlobalData.avgPrice,
                maxPrice:self.GlobalData.maxPrice,
                // fallingRate:self.GlobalData.fallingRate,
                avgBuyEnable:self.GlobalData.avgBuyEnable,
                serverId:self.serverInfo.name,
                // fallingPrice:managers[0].falling * self.GlobalData.fallingRate,
                startTime:self.GlobalData.startTime,
                updateTime:(new Date(tick)).toLocaleString(),
                updateTick:tick


            };
            let where = {_id:0};
            let updateStr = {$set: self.infoData};
            let collectionName = "info";

            self.GlobalData.dbase.collection(collectionName).update(where,updateStr,{upsert:true}, function(err) {
                if (err) throw err;
            });
        })
    }
    recieveDepth(tick, symbol, ask, bid){
        let self = this;
        self.GlobalData.robotCount = 0;
        self.GlobalData.tradCount = 0;
        self.GlobalData.updateRobotCount = 0;
        self.GlobalData.environment.update(tick, ask, bid);


        self.updateInfo(tick);
        self.getConfig();
    }
}
module.exports = FServer;