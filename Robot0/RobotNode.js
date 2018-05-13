//机器人节点
class RobotNode  {

    constructor(GlobalData, managerId) {

        this.managerId = managerId;
        this.GlobalData = GlobalData;
    }
    changeBuy(currencyPerGoods){

        this.calcuBuy(currencyPerGoods);
    }
    newNode(
        nowTick,
        id,
        currencyPerGoods,
        goodsIn,
        commission)
    {

        this.fees = this.GlobalData.Fees;
        this.sellHighstScale = this.GlobalData.sellHighstScale;
        this.id = id;
        this.buyTick = nowTick;
        this.commissionIn = commission;
        this.goodsIn = goodsIn;
        this.currencyPerGoodsInReal = currencyPerGoods;



        this.calcuBuy(currencyPerGoods);
        this.createBuyDataBase();
    }


    calcuBuy(currencyPerGoodsIn){

        this.highst = 0;
        this.isOverLimit = 0;
        this.sellDone = 0;

        this.currencyPerGoodsIn = currencyPerGoodsIn;

        this.currencyOut = this.goodsIn * this.currencyPerGoodsIn;
        this.goodsFees = this.goodsIn * this.fees;

        //计算成本价，这个价格卖出才不会亏
        this.currencyPerGoodsCost = this.currencyOut / (this.goodsIn - this.goodsFees) / (1-this.fees);
        this.highstLimit = this.currencyPerGoodsCost+this.GlobalData.highstLimit + Math.random()*this.GlobalData.highstLimitRandom;
        this.oldHighstLimitAdd = -1;
    }
    updateLimit(){
        if(this.oldHighstLimitAdd !==this.GlobalData.highstLimitAdd){
            this.oldHighstLimitAdd = this.GlobalData.highstLimitAdd;
            this.limit = this.highstLimit+this.GlobalData.highstLimitAdd;
            this.isOverLimit = 0;
        }

    }
    sell(nowTick, currencyPerGoodsOut, commissionOut){
        this.sellTick = nowTick;
        this.currencyPerGoodsOut = currencyPerGoodsOut;
        this.currencyIn = this.currencyPerGoodsOut * this.goodsIn;
        this.currencyEarn = this.currencyIn - this.currencyOut;
        this.commissionOut = commissionOut;
        this.GlobalData.earnSum += this.currencyEarn;
        this.updateBuyDataBase();
    }
    //当前价格出售
    sellNow(currencyPerGoodsOut){
        let _in = currencyPerGoodsOut * this.goodsIn * (1-this.fees);

        return _in - this.currencyOut;
    }
    update(nowTick,ask,bid){

        //如果已经卖出
        if(this.sellDone > 0){
            return;
        }
        //更新界限
        this.updateLimit();

        //平均值
        let avg = this.GlobalData.avePrice;

        //统计最高和最低价
        if(this.GlobalData.lowstNodePrice > this.currencyPerGoodsInReal){
            this.GlobalData.lowstNodePrice = this.currencyPerGoodsInReal;
        }
        if(this.GlobalData.hightstNodePrice < this.currencyPerGoodsInReal){
            this.GlobalData.hightstNodePrice = this.currencyPerGoodsInReal;
        }

        //设置是否达到过界限
        if(this.isOverLimit ===0 && this.limit <= avg){
            this.isOverLimit = 1;
            this.updateBuyDataBase();
        }
        //如果低于成本价， 重新来过
        if (this.isOverLimit === 1 && avg < this.currencyPerGoodsCost){
            this.isOverLimit = 0;
            this.updateBuyDataBase();
        }
        //设置最高价格
        if(avg > this.highst){
            this.highstTick = nowTick;
            this.highst = avg;
            //计算当前准卖价
            this.currencyPerGoodsPreSale = (this.highst + this.currencyPerGoodsCost) * this.sellHighstScale;
            this.updateBuyDataBase();
        }

        //全部卖出
        if(this.GlobalData.sellAll === 1){
            this.sellDone = 3;
        }else{
            //越过价格线， 成本价过滤
            if(this.isOverLimit===1 && avg > this.currencyPerGoodsCost && bid> this.currencyPerGoodsCost){

                if(bid < this.currencyPerGoodsPreSale && avg < this.currencyPerGoodsPreSale){
                    this.sellDone = 1;
                }else if((bid >= this.currencyPerGoodsPreSale && nowTick > this.highstTick + this.GlobalData.highstLimitTime)){
                    //当前价高于准卖价 并且已经在高位停留了好久
                    this.sellDone = 2;
                }
            }
        }
        //如果卖出条件符合
        if(this.sellDone > 0){
            this.currencyPerGoodsSend = bid;
            this.updateBuyDataBase();

            return true;
        }

        return false;
    }

    createBuyDataBase(){
        let setData = {
            managerId:this.managerId,//队列id
            nowTick:(new Date()).valueOf(),
            buyTick:this.buyTick,
            sellTick:this.sellTick,
            nodeId:this.id, //机器人id
            goodsIn:this.goodsIn,//买入的数量
            currencyPerGoodsInReal:this.currencyPerGoodsInReal,//买入价
            currencyPerGoodsIn:this.currencyPerGoodsIn,//买入价
            currencyPerGoodsOut:this.currencyPerGoodsOut, //成交价
            currencyPerGoodsCost:this.currencyPerGoodsCost,//成本价
            currencyPerGoodsPreSale :this.currencyPerGoodsPreSale,//准卖价
            currencyPerGoodsSend:this.currencyPerGoodsSend,//发送的卖出价
            currencyOut:this.currencyOut, //买入花费
            currencyIn:this.currencyIn,//卖出获得
            currencyEarn:this.currencyEarn ,//卖出盈利
            highst:this.highst,//最高价
            commissionIn:this.commissionIn,//买入花费手续费
            commissionOut:this.commissionOut,//卖出手续费
            sellDone:this.sellDone,//卖出条件
            fees:this.fees,//手续费
            sellHighstScale:this.sellHighstScale,//准卖价参数

            fallRateByMaxMin:this.GlobalData.fallRateByMaxMin,
            isOverLimit:this.isOverLimit

        };
        let where = {nodeId:this.id, managerId:this.managerId};
        let updateStr = {$set: setData};
        let self = this;


        this.GlobalData.dbase.collection("buySell").update(where,updateStr,{upsert:true}, function(err) {
            if (err) throw err;
        });
    }
    //添加记录
    updateBuyDataBase(){
        let setData = {
            sellTick:this.sellTick,
            goodsIn:this.goodsIn,//买入的数量
            currencyPerGoodsInReal:this.currencyPerGoodsInReal,//买入价
            currencyPerGoodsIn:this.currencyPerGoodsIn,//买入价
            currencyPerGoodsOut:this.currencyPerGoodsOut, //成交价
            currencyPerGoodsCost:this.currencyPerGoodsCost,//成本价
            currencyPerGoodsPreSale :this.currencyPerGoodsPreSale,//准卖价
            currencyPerGoodsSend:this.currencyPerGoodsSend,//发送的卖出价
            currencyOut:this.currencyOut, //买入花费
            currencyIn:this.currencyIn,//卖出获得
            currencyEarn:this.currencyEarn ,//卖出盈利
            highst:this.highst,//最高价
            commissionIn:this.commissionIn,//买入花费手续费
            commissionOut:this.commissionOut,//卖出手续费
            sellDone:this.sellDone,//卖出条件
            fees:this.fees,//手续费
            sellHighstScale:this.sellHighstScale,//准卖价参数
            limit:this.limit,
            isOverLimit:this.isOverLimit
        };
        let where = {nodeId:this.id, managerId:this.managerId};
        let updateStr = {$set: setData};
        let self = this;


        this.GlobalData.dbase.collection("buySell").update(where,updateStr,{upsert:true}, function(err) {
            if (err) throw err;
        });
    }
}
module.exports = RobotNode;