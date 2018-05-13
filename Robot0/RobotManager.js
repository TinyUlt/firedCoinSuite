let RobotNode = require("./RobotNode.js");
//机器人管理
class RobotManager{
    constructor( id, GlobalData ) {
        this.id = id;
        this.GlobalData = GlobalData;
        // this.robotCollection = "robot";

        this.symbol = this.GlobalData.symbol;

        this.nodeMap = new Map();
        this.MarketBuyFILLEDSign = null;
        this.MarketSellFILLEDSign = null;
        this.WaittingSellSign = null;
        this.robotId = 0;


        // this.updateFallingOffset();

    }
    getRobotId(){
        return ++this.robotId;
    }
    delayUpdate(){
        let self = this;
        console.log("delayUpdate");
        this.GlobalData.delayUpdate = true;
        setTimeout(() => {
            console.log("delayOver");
            self.GlobalData.delayUpdate = false;
        }, 10000);
    }
    // delayOver(){
    //     console.log("delayOver");
    //     this.GlobalData.delayUpdate = false;
    // }

    createRobotNode(nowTick, goodsIn){

        let self = this;

        this.GlobalData.tradCount++;
        self.MarketBuyFILLEDSign = 0;

        this.GlobalData.simulation.marketBuy(this.symbol,goodsIn,{type:'MARKET', newOrderRespType:"FULL"}, function(error, response) {

            self.MarketBuyFILLEDSign = null;
            if(error !== null){


                console.log(error);
                //服务器钱不够
                if(error.statusCode === 400){

                }
                //本地模拟钱不够
                if(error.statusCode === 0){

                }
                //速率超标
                else if(error.statusCode === 429){

                    self.delayUpdate();
                }

            }else{
                if(response.status !== undefined && response.status === 'FILLED'  ){
                    self.MarketBuyFILLEDSign = response;

                }else{
                    console.log("marketBuy failed")
                }
            }



        });
    }
    finishRobotNode(nowTick, node){

        let self = this;
        this.GlobalData.tradCount++;

        this.WaittingSellSign = node;
        self.MarketSellFILLEDSign = 0;

        this.GlobalData.simulation.marketSell(this.symbol, node.goodsIn,{type:'MARKET', newOrderRespType:"FULL"}, function(error, response) {

            self.MarketSellFILLEDSign = null;
            if(error !== null){
                console.log(error.statusCode);
                console.log(error);
                //服务器钱不够
                if(error.statusCode === 400){

                }
                //本地模拟钱不够
                if(error.statusCode === 0){

                }
                //速率超标
                else if(error.statusCode === 429){
                    self.delayUpdate();
                }
            }

            if(response.status !== undefined && response.status === 'FILLED'){
                self.MarketSellFILLEDSign = response;
            }else{
                console.log("marketSell failed")

            }


        })
    }
    handleCreateRobotNode(){

        if(this.MarketBuyFILLEDSign !== null && this.MarketBuyFILLEDSign !== 0){

            let value = this.MarketBuyFILLEDSign;
            for(let i = 0; i < value.fills.length; i++){

                let id = this.getRobotId();
                let node = new RobotNode(this.GlobalData,this.id);
                let price = parseFloat(value.fills[i].price);
                let qty = parseFloat(value.fills[i].qty);
                let commission = parseFloat(value.fills[i].commission);
                node.newNode( value.transactTime, id, price ,qty, commission);
                this.GlobalData.simulation.buyChangeBalance(price,qty,commission);
                this.nodeMap.set(id, node);
                this.GlobalData.buyTradCount ++;



            }
            this.MarketBuyFILLEDSign = null;
        }

    }
    handleFinishRobotNode(){

        if(this.MarketSellFILLEDSign !== null && this.MarketSellFILLEDSign !== 0 ){

            let value =this.MarketSellFILLEDSign;
            let node = this.WaittingSellSign;

            let qtys = 0;
            let commissions = 0;
            let count = 0;
            for(let i = 0; i < value.fills.length; i++){
                let price = parseFloat(value.fills[i].price);
                let qty = parseFloat(value.fills[i].qty);
                let commission =parseFloat( value.fills[i].commission);

                count += price * qty;
                qtys += qty;
                commissions += commission;
                this.GlobalData.simulation.sellChangeBalance(price,qty,commission);

            }

            node.sell(value.transactTime,count / qtys, commissions);

            this.MarketSellFILLEDSign = null;
            this.WaittingSellSign = null;
            this.GlobalData.sellTradCount ++;
        }

    }
    updateFalling(){
        this.falling = (this.GlobalData.buyFalling + Math.random()*this.GlobalData.buyFallingRandom + this.GlobalData.buyFallingAdd) ;
    }
    // updateBuy(){
    //     let self = this;
    //
    //     this.handleCreateRobotNode();
    //
    //     if(this.nodeMap.size === 0 && this.MarketBuyFILLEDSign === null){
    //
    //         this.createRobotNode(nowTick, this.GlobalData.goodsAmountPerBuy);
    //         this.updateFalling();
    //     }
    // }
    // updateSell(){
    //
    // }
    update(nowTick, currencyPerGoodsAsk, currencyPerGoodsBid){

        let self = this;

        this.handleCreateRobotNode();
        this.handleFinishRobotNode();

        if(this.nodeMap.size === 0
            && this.MarketBuyFILLEDSign === null
            && this.GlobalData.avgBuyEnable === 1){


            this.createRobotNode(nowTick, this.GlobalData.goodsAmountPerBuy);
            this.updateFalling();
        }


        let lowstPrice = 1000000;

        // let highstPrice = 0;
        this.nodeMap.forEach(function(value) {

            if(value.currencyPerGoodsIn < lowstPrice){
                lowstPrice = value.currencyPerGoodsIn;
            }
            // if(value.currencyPerGoodsIn > highstPrice){
            //     highstPrice = value.currencyPerGoodsIn;
            // }
        });


        //当前价格要比最低节点的价格底，才能产生一个robotnode
        if(this.GlobalData.enableBuy === 1
            && lowstPrice -  this.falling >= currencyPerGoodsAsk
            && this.GlobalData.avgBuyEnable === 1
            && this.MarketBuyFILLEDSign === null){

            this.createRobotNode(nowTick, this.GlobalData.goodsAmountPerBuy);
            this.updateFalling();
        }

        //遍历更新robotnode

        // if((++this.SellInterval) > this.GlobalData.SellInterval){
        //     this.SellInterval -= this.GlobalData.SellInterval;

            let secondLowstPrice = 1000000;
            this.nodeMap.forEach(function(value) {

                if(value.currencyPerGoodsIn !== lowstPrice){
                    if(value.currencyPerGoodsIn < secondLowstPrice){
                        secondLowstPrice = value.currencyPerGoodsIn;
                    }
                }
            });

            let hasOne = null;
            if(this.GlobalData.enableSell === 1
                && this.MarketSellFILLEDSign === null){

                for (let value of this.nodeMap.values()) {
                    // console.log(value);
                    if( value.update(nowTick,currencyPerGoodsAsk, currencyPerGoodsBid)){
                        hasOne = value;
                        break;
                    }
                }
            }

            //删除结束的robotnode
            if(hasOne !== null){

                if(self.nodeMap.size === 1 && this.GlobalData.avgBuyEnable === 0){
                    self.finishRobotNode(nowTick, hasOne);

                    self.nodeMap.delete(hasOne.id);

                }else if(this.GlobalData.sellAll === 0 &&  (self.nodeMap.size === 1 ||( lowstPrice === hasOne.currencyPerGoodsIn && secondLowstPrice > currencyPerGoodsBid)) ){

                    hasOne.changeBuy(currencyPerGoodsBid);

                }else{
                    self.finishRobotNode(nowTick, hasOne);

                    self.nodeMap.delete(hasOne.id);
                }
            }
        // }



        // this.GlobalData.lowstNodePrice = lowstPrice;
        // this.GlobalData.hightstNodePrice = highstPrice;
    }
}
module.exports = RobotManager;