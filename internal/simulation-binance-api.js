var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
const nodemailer = require('./mailer');
const binance = require('./node-binance-api.js');
let fs = require('fs');

class Simulation{
    constructor(GlobalData, callback) {

        this.GlobalData = GlobalData;

        binance.options({
            'APIKEY':GlobalData.serverInfo.APIKEY,
            'APISECRET':GlobalData.serverInfo.APISECRET
        });

        console.log(binance.test);
        binance.test = "222222222222";
        console.log(binance.test);

        this.currency = this.GlobalData.currency;
        this.goods = this.GlobalData.goods;
        this.commission = this.GlobalData.commission;
        this.symbol = this.GlobalData.symbol;
        this.OriginBalance = {
            [this.goods]: {available: 0},
            [this.currency]:{available: 0},
            [this.commission]: {available: 0},
            PreProperty:{available: 0},
            Property:{available: 0, df:0},
            [this.GlobalData.symbol]:{available: 0, df:0},
        };
        this.RealBalance = {
            [this.goods]: {available: 0, df:0},
            [this.currency]:{available: 0, df:0 },
            [this.commission]: {available: 0, df:0},
            Property:{available: 0, df:0}
        };
        this.SimulBalance={
            [this.goods]: {available: 0, df:0 , ["to"+this.currency]:0},
            [this.currency]:{available: 0, df:0 },
            [this.commission]: {available: 0, df:0 , ["to"+this.currency]:0},
            Property:{available: 0, df:0}
        };
        this.Price={
            [this.symbol]:{ ask:null, bid:null},
            [this.commission+this.goods]:{ask:null, bid:null},
            [this.commission+this.currency]: {ask:null, bid:null},
        };

        this.currencyDfIndex = 0;
        this.simulTick = null;

        if(this.GlobalData.simulationConfig.startTime !== null){
            this.startTime = Date.parse(this.GlobalData.simulationConfig.startTime);
        }else{
            this.startTime = (new Date()).valueOf() - 1000;
        }
        // this.startTime = (new Date()).valueOf() - 1000;//Date.parse('2018-5-8 18:30:00');
        this.skipTime = 0;
        //console.log(this.startTime);//1525527038861
        let self = this;


        if(this.GlobalData.simulationConfig.useRealBalance === 1){
            binance.balance(function(error, balances) {

                if(error === null){

                    self.init(balances);
                    self.depthCache(self.GlobalData.symbol, callback);
                }
            });
        }else{
            self.init(this.GlobalData.simulationConfig.balances);
            self.depthCache(self.GlobalData.symbol, callback);
        }

    }
    updateAvgMinMaxPrice(){
        let self = this;
        if(this.GlobalData.simulationConfig.useRealData === 1){
            self.GlobalData.dbchart.collection("lastAvg").find({_id:self.GlobalData.avgDuration}).toArray(function(err, res) {
                if(res.length > 0){
                    //console.log(res);
                    // self.GlobalData.maxPrice = res[0].max;
                    // self.GlobalData.minPrice = res[0].min;
                    self.GlobalData.avgPrice = res[0].ask;
                }
            });

            // self.GlobalData.dbchart.collection("lastAvg").find({_id:"avg_1d"}).toArray(function(err, res) {
            //     if(res.length > 0){
            //         //console.log(res);
            //         self.GlobalData.maxPrice = res[0].max;
            //         self.GlobalData.minPrice = res[0].min;
            //         // self.GlobalData.avgPrice = res[0].ask;
            //     }
            // });
        }else{
            self.GlobalData.dbchart.collection(self.GlobalData.avgDuration).find({_id:{$gt:self.startTime}}).sort({_id:1}).limit(1).toArray(function(err, res) {
                if(res.length > 0){
                    //console.log(res);
                    // self.GlobalData.maxPrice = res[0].max;
                    // self.GlobalData.minPrice = res[0].min;
                    self.GlobalData.avgPrice = res[0].ask;
                }
            });
            // self.GlobalData.dbchart.collection("avg_1d").find({_id:{$gt:self.startTime}}).sort({_id:1}).limit(1).toArray(function(err, res) {
            //     if(res.length > 0){
            //         //console.log(res);
            //         self.GlobalData.maxPrice = res[0].max;
            //         self.GlobalData.minPrice = res[0].min;
            //         // self.GlobalData.avgPrice = res[0].ask;
            //     }
            // });
        }
    }

    depthCache( symbol, callback){
        let self = this;
        let roll = null;
        if(this.GlobalData.simulationConfig.useRealData === 1){

            roll = function(){
                if (self.GlobalData.run === true && self.GlobalData.delayUpdate === false ){

                    binance.depthRequest(symbol,function(error,json){
                        process.stdout.write((new Date()).getSeconds()+' ');
                        if (error === null){
                            let nowTick = (new Date()).valueOf();
                            self.simulTick = nowTick;

                            let ask =parseFloat(json.asks[0][0]);
                            let bid =parseFloat(json.bids[0][0]);
                            // console.log(ask, bid);

                            self.update(symbol,ask, bid);
                            callback(nowTick, symbol, ask, bid);
                            self.updateAvgMinMaxPrice();
                        } else {
                            console.log(error);
                        }

                    },5);
                }

                setTimeout(roll, 1000);
            }
        }else{
            roll = function(){
                if(self.GlobalData.run === true && self.GlobalData.dbchart !== null){
                    self.skipTime++;

                    self.GlobalData.dbchart.collection("t_1s").find({_id:{$gt:self.startTime}}).sort({_id:1}).limit(1).toArray(function(err, result) { // 返回集合中所有数据
                        if (err) throw err;

                        if(result.length !== 0){
                            self.simulTick = result[0]._id;

                            self.update(symbol,result[0].ask , result[0].bid);
                            callback(self.simulTick, symbol, result[0].ask, result[0].bid);

                            self.updateAvgMinMaxPrice();
                            self.startTime+=1000;
                        }else{
                            self.GlobalData.simulationConfig.getDataSpeed = 2;
                        }

                        setTimeout(roll, 1000/self.GlobalData.simulationConfig.getDataSpeed);
                    });
                }
                if(self.GlobalData.run === false ){
                    setTimeout(roll, 1000);
                }
            };
        }
        roll();
    }

    init(balances){


        this.Price[this.commission+this.currency].ask=this.GlobalData.simulationConfig[this.commission+this.currency];
        this.Price[this.commission+this.goods].ask=this.GlobalData.simulationConfig[this.commission+this.goods];

        if(balances!==null){
            if ( typeof balances[this.goods] !== undefined ) {
                this.SimulBalance[this.goods].available =parseFloat(balances[this.goods].available) ;
                this.OriginBalance[this.goods].available = parseFloat(balances[this.goods].available);
                this.RealBalance[this.goods].available = parseFloat(balances[this.goods].available);
            }
            if ( typeof balances[this.currency] !== undefined ) {
                this.SimulBalance[this.currency].available = parseFloat(balances[this.currency].available);
                this.OriginBalance[this.currency].available = parseFloat(balances[this.currency].available);
                this.RealBalance[this.currency].available = parseFloat(balances[this.currency].available);
            }
            if ( typeof balances[this.commission] !== undefined ) {
                this.SimulBalance[this.commission].available = parseFloat(balances[this.commission].available);
                this.OriginBalance[this.commission].available = parseFloat(balances[this.commission].available);
                this.RealBalance[this.commission].available = parseFloat(balances[this.commission].available);
            }
        }
    }

    update(symbol, cA, cB){

        this.Price[symbol].ask = cA;
        this.Price[symbol].bid = cB;

        if(cA > this.GlobalData.avgPrice){
            this.GlobalData.avgBuyEnable = 0;
        }else{
            this.GlobalData.avgBuyEnable = 1;
        }

        let fees = cA * this.GlobalData.Fees;
        this.GlobalData.buyFalling = fees * this.GlobalData.buyFallingOfFees;
        this.GlobalData.buyFallingRandom = fees * this.GlobalData.buyFallingRandomOfFees;
        this.GlobalData.buyFallingAdd = fees * this.GlobalData.buyFallingAddOfFees;
        this.GlobalData.highstLimit = fees * this.GlobalData.highstLimitOfFees;
        this.GlobalData.highstLimitRandom = fees * this.GlobalData.highstLimitRandomOfFees;
        this.GlobalData.highstLimitAdd = fees * this.GlobalData.highstLimitAddOfFees;


        let startAsk = cA;

        let self = this;
        if(this.GlobalData.simulationConfig.useRealData){
            binance.prices(function(error, ticker) {

                if(error===null){

                    self.Price[self.commission+self.currency].ask = parseFloat(ticker[self.commission+self.currency]) ;

                    if(self.OriginBalance.PreProperty.available === 0){

                        self.OriginBalance[self.symbol].available = startAsk;
                        self.OriginBalance.PreProperty.available = self.convertToCurrency(self.OriginBalance[self.currency].available, self.OriginBalance[self.goods].available, self.OriginBalance[self.commission].available);
                    }
                }
            });
        }else{
            if(self.OriginBalance.PreProperty.available === 0){

                self.OriginBalance[self.symbol].available = startAsk;
                self.OriginBalance.PreProperty.available = self.convertToCurrency(self.OriginBalance[self.currency].available, self.OriginBalance[self.goods].available, self.OriginBalance[self.commission].available);
            }
        }
    }
    convertToCurrency(currency,goods, commission){
        return currency + goods * this.Price[this.symbol].bid + commission * this.Price[this.commission+this.currency].ask
    }
    balance(callback) {

        let self = this;
        if ( callback ){
            if(self.GlobalData.simulationConfig.useRealBalance === 1){
                binance.balance(function(error, balances) {

                    if(error === null){
                        console.log(self.GlobalData.serverInfo.name,balances[self.goods].available);

                        if ( typeof balances[self.goods] !== undefined ) {
                            self.RealBalance[self.goods].available = parseFloat(balances[self.goods].available);
                        }
                        if ( typeof balances[self.currency] !== undefined ) {
                            self.RealBalance[self.currency].available = parseFloat(balances[self.currency].available);
                        }
                        if ( typeof balances[self.commission] !== undefined ) {
                            self.RealBalance[self.commission].available = parseFloat(balances[self.commission].available);
                        }
                        self.setProperty();
                        self.dfPrice();
                        callback( error, self.OriginBalance, self.RealBalance, self.SimulBalance, self.Price[self.commission+self.currency].ask );
                    }
                    else{
                        console.log(error);
                    }
                });
            }else{
                self.RealBalance = self.SimulBalance;
                self.setProperty();
                self.dfPrice();
                callback( null, self.OriginBalance, self.RealBalance, self.SimulBalance, self.Price[self.commission+self.currency].ask);
            }
        }
    }
    setProperty(){
        let self = this;
        this.OriginBalance.Property.available = self.convertToCurrency(self.OriginBalance[this.currency].available, self.OriginBalance[this.goods].available, self.OriginBalance[this.commission].available);
        this.RealBalance.Property.available = self.convertToCurrency(self.RealBalance[this.currency].available, self.RealBalance[this.goods].available, self.RealBalance[this.commission].available);
        this.SimulBalance.Property.available = self.convertToCurrency(self.SimulBalance[this.currency].available, self.SimulBalance[this.goods].available, self.SimulBalance[this.commission].available);

    }
    dfPrice(){
        this.OriginBalance.Property.df = this.OriginBalance.Property.available - this.OriginBalance.PreProperty.available ;
        this.OriginBalance[this.symbol].df =this.Price[this.symbol].ask -  this.OriginBalance[this.symbol]. available;

        this.RealBalance[this.goods].df = this.RealBalance[this.goods].available - this.OriginBalance[this.goods].available;
        this.RealBalance[this.currency].df = this.RealBalance[this.currency].available - this.OriginBalance[this.currency].available;
        this.RealBalance[this.commission].df = this.RealBalance[this.commission].available - this.OriginBalance[this.commission].available;
        this.RealBalance.Property.df = this.convertToCurrency(this.RealBalance[this.currency].df, this.RealBalance[this.goods].df, this.RealBalance[this.commission].df);

        this.SimulBalance[this.goods].df = this.SimulBalance[this.goods].available - this.OriginBalance[this.goods].available;
        this.SimulBalance[this.currency].df = this.SimulBalance[this.currency].available - this.OriginBalance[this.currency].available;
        this.SimulBalance[this.commission].df = this.SimulBalance[this.commission].available - this.OriginBalance[this.commission].available;
        this.SimulBalance.Property.df = this.convertToCurrency(this.SimulBalance[this.currency].df, this.SimulBalance[this.goods].df, this.SimulBalance[this.commission].df);

        let index = parseInt(this.RealBalance[this.currency].df / this.GlobalData.currencyDfMail);
        if(index !== this.currencyDfIndex){
            this.currencyDfIndex = index;
            // nodemailer.sendEMail(this.GlobalData.emailList, `${this.goods}Df:${this.RealBalance[this.goods].df.toFixed(6)},${this.currency}Df:${this.RealBalance[this.currency].df.toFixed(4)},${this.commission}Df:${this.RealBalance[this.commission].df.toFixed(5)},ProDf:${this.RealBalance.Property.df.toFixed(4)}`,"text");
            nodemailer.sendEMail(this.GlobalData.emailList, `${this.GlobalData.serverInfo.name}-${this.currency}_balance:${this.RealBalance[this.currency].available.toFixed(4)}-${this.currency}_df:${this.RealBalance[this.currency].df.toFixed(4)}-${this.GlobalData.symbol}_price:${this.GlobalData.nowPrice}`,"text");
        }
        if(this.SimulBalance[this.currency].df < this.GlobalData.useCurrencyHighst){
            this.GlobalData.useCurrencyHighst = this.SimulBalance[this.currency].df;
        }
    }
    buyCommission(){
        //手续费不够，就买入
        binance.marketBuy("BNBUSDT", 0.1, {type:'MARKET', newOrderRespType:"FULL"}, function(error, response) {
            console.log("buy BNBUSDT");
        });
    }
    marketBuy(symbol, quantity, flags = {type:'MARKET'}, callback = false){

        let ret = this.checkMarketBuyEnough(symbol, quantity);

        if(ret.success === 1) {
            if(this.GlobalData.simulationConfig.useRealOder === 1){
                binance.marketBuy(symbol, quantity, flags, callback);
            }else{
                this.simulMarketBuy(ret.commissionNeed, symbol, quantity, flags, callback);
            }
        }else{
            callback({error:"not enough",statusCode : 0})
        }
    }
    marketSell(symbol, quantity, flags = {type:'MARKET'}, callback = false){

        let ret = this.checkMarketBuyEnough(symbol, quantity);

        if(ret.success === 1){
            if(this.GlobalData.simulationConfig.useRealOder === 1){
                binance.marketSell(symbol, quantity, flags, callback);
            }else{
                this.simulMarketSell(ret.commissionNeed, symbol, quantity, flags, callback);
            }
        }else{
            callback({error:"not enough",statusCode : 0})
        }
    }
    checkMarketBuyEnough(symbol, quantity){

        // let goodsName = this.Price[symbol].goods;
        // let currencyName = this.Price[symbol].currency;

        let currencyNeed = this.Price[symbol].ask * quantity;

        if( -this.RealBalance[this.currency].df > this.GlobalData.useCurrencyMax){
            console.log(this.currency + " useCurrencyMax");
            return {success:0};
        }
        if(-this.OriginBalance[this.symbol].df > this.GlobalData.lowPriceDfLimit){
            console.log(this.currency + " lowPriceDfLimit");
            return {success:0};
        }
        //只看真实的资产，因为可能这个账户的资产被其他进程共享
        if(currencyNeed > this.RealBalance[this.currency].available){
            console.log(this.currency + "not enough");

            return {success:0};
        }

        let goodsFeesNeed = quantity * this.GlobalData.Fees;
        let commissionNeed =goodsFeesNeed / this.Price[this.commission+this.goods].ask;
        if( commissionNeed > this.RealBalance[this.commission].available){
            console.log(this.commission + "not enough");
            this.buyCommission();

            return {success:0};
        }
        return {success:1, commissionNeed:commissionNeed};
    }
    buyChangeBalance(price, qty, commission){
        this.SimulBalance[this.currency].available -= price * qty;
        this.SimulBalance[this.goods].available += qty;
        this.SimulBalance[this.commission].available -= commission;

        this.RealBalance[this.currency].available -= price * qty;
        this.RealBalance[this.goods].available += qty;
        this.RealBalance[this.commission].available -= commission;

    }
    sellChangeBalance(price, qty, commission ){
        this.SimulBalance[this.currency].available += price * qty;
        this.SimulBalance[this.goods].available -= qty;
        this.SimulBalance[this.commission].available -= commission;

        this.RealBalance[this.currency].available += price * qty;
        this.RealBalance[this.goods].available -= qty;
        this.RealBalance[this.commission].available -= commission;
    }
    simulMarketBuy(commissionNeed, symbol, quantity, flags = {type:'MARKET'}, callback = false) {

        if(callback !== null){
            let tick = this.simulTick;
            let resp = {
                symbol: symbol,
                orderId: tick,
                clientOrderId: 'U'+tick,
                transactTime: tick,
                price: '0.00000000',
                origQty: quantity.toString() ,
                executedQty: quantity.toString(),
                status: 'FILLED',
                timeInForce: 'GTC',
                type: 'MARKET',
                side: 'BUY',
                fills:
                    [
                        {
                            price: (this.Price[symbol].ask).toString(),
                            qty: quantity.toString(),
                            commission: commissionNeed.toString(),
                            commissionAsset: this.commission,
                            tradeId: tick
                        }
                    ]
            };

            callback(null, resp);
        }
    }
    checkMarketSellEnough(symbol, quantity){

        // let goodsName = this.Price[symbol].goods;
        // let currencyName = this.Price[symbol].currency;

        if(quantity>this.RealBalance[this.goods].available){
            console.log(this.commission + "not enough");
            return {success:0};
        }
        let currencyObtain = this.Price[symbol].bid * quantity;

        let currencyFeesNeed = currencyObtain * this.GlobalData.Fees;
        let commissionNeed =currencyFeesNeed / this.Price[this.commission+this.currency].ask;
        if( commissionNeed > this.RealBalance[this.commission].available){
            console.log(this.commission + "not enough");
            this.buyCommission();
            return {success:0};
        }
        return {success:1,  commissionNeed:commissionNeed};
    }
    simulMarketSell(commissionNeed, symbol, quantity, flags = {type:'MARKET'}, callback = false) {

        if(callback !== null){
            let tick = this.simulTick;
            let resp = {
                symbol: symbol,
                orderId: tick,
                clientOrderId: 'U'+tick,
                transactTime: tick,
                price: '0.00000000',
                origQty: quantity.toString() ,
                executedQty: quantity.toString(),
                status: 'FILLED',
                timeInForce: 'GTC',
                type: 'MARKET',
                side: 'SELL',
                fills:
                    [
                        {
                            price: (this.Price[symbol].ask).toString(),
                            qty: quantity.toString(),
                            commission: commissionNeed.toString(),
                            commissionAsset: this.commission,
                            tradeId: tick
                        }
                    ]
            };

            callback(null, resp);
        }
    }
}
module.exports = Simulation;