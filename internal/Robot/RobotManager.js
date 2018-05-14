let RobotNode = require("./RobotNode.js");
//机器人管理
class RobotManager{
    constructor( id, GlobalData ) {
        this.id = id;
        this.GlobalData = GlobalData;
        // this.robotCollection = "robot";

        this.symbol = this.GlobalData.symbol;

        this.nodeMap = new Map();

        this.robotId = 0;
    }
    getRobotId(){
        return ++this.robotId;
    }

    createRobotNode(nowTick, goodsIn, currencyPerGoodsAsk){

        let self = this;

        let id = this.getRobotId();
        let node = new RobotNode(this.GlobalData,this.id, id, currencyPerGoodsAsk);
        this.nodeMap.set(id, node);

        this.GlobalData.tradCount++;
        this.GlobalData.simulation.marketBuy(this.symbol,goodsIn,{type:'MARKET', newOrderRespType:"FULL"},(error, response)=>{
            //如果失败这删除该机器人
            if(!node.recieveBuy(error, response)){
                self.removeRobot(node);
            }
        });
    }
    finishRobotNode(nowTick, node){

        let self = this;
        this.GlobalData.tradCount++;

        this.GlobalData.simulation.marketSell(this.symbol, node.goodsIn,{type:'MARKET', newOrderRespType:"FULL"},(error, response)=>{
            //如果成功这删除该机器人
            if(node.recieveSell(error, response)){
                self.removeRobot(node);
            }
        });
    }

    updateFalling(){
        this.falling = (this.GlobalData.buyFalling + Math.random()*this.GlobalData.buyFallingRandom + this.GlobalData.buyFallingAdd) ;
    }

    update(nowTick, currencyPerGoodsAsk, currencyPerGoodsBid){

        let self = this;

        if(this.nodeMap.size === 0 && this.GlobalData.avgBuyEnable === 1){


            this.createRobotNode(nowTick, this.GlobalData.goodsAmountPerBuy - Math.floor(Math.random()*4) * 0.000001, currencyPerGoodsAsk);
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
            && this.GlobalData.avgBuyEnable === 1){

            this.createRobotNode(nowTick, this.GlobalData.goodsAmountPerBuy - Math.floor(Math.random()*4) * 0.000001, currencyPerGoodsAsk);

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
            if(this.GlobalData.enableSell === 1){

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

                    // self.nodeMap.delete(hasOne.id);

                }else if(this.GlobalData.sellAll === 0 &&  (self.nodeMap.size === 1 ||( lowstPrice === hasOne.currencyPerGoodsIn && secondLowstPrice > currencyPerGoodsBid)) ){

                    hasOne.changeBuy(currencyPerGoodsBid);

                }else{
                    self.finishRobotNode(nowTick, hasOne);

                    // self.nodeMap.delete(hasOne.id);
                }
            }
    }
    removeRobot(node){
        this.nodeMap.delete(node.id);
    }
}
module.exports = RobotManager;