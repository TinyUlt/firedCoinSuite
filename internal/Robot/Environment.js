
let RobotManager = require("./RobotManager.js");
class Environment{
    constructor(GlobalData) {

        this.GlobalData = GlobalData;
        this.managers = [];
        this.avgCache = [];
        this.avgCacheIndex = 0;
    }
    update(tick, ask, bid) {
        this.updateAveCache(ask, bid);

        for (let i = 0; i < this.GlobalData.Multiple; i++) {

            if(this.managers.length <= i){
                this.managers.push(new RobotManager(this.managers.length,this.GlobalData));
            }
            let manager = this.managers[i];

            if (manager !== null) {
                if (this.GlobalData.tradCount < this.GlobalData.tradCountMax &&  this.GlobalData.delayUpdate === false) {
                    manager.update(tick, ask, bid);
                    this.GlobalData.updateRobotCount++;
                }
                this.GlobalData.nowPrice = bid;
                this.GlobalData.robotCount += manager.nodeMap.size
            }
        }
    }
    updateAveCache(ask, bid){
        if(this.avgCache.length === 0){
            for(let n = 0; n < this.GlobalData.bidsCache; n++) {
                this.avgCache[n] = (ask + bid) / 2;
            }
        }else{
            if(this.avgCacheIndex>=this.avgCache.length){
                this.avgCacheIndex = 0;
            }
            this.avgCache[this.avgCacheIndex] = (ask+bid)/2;
            this.avgCacheIndex++;
        }

        let all = 0;
        for(let n = 0; n < this.avgCache.length; n++) {
            all += this.avgCache[n] ;
        }
        this.GlobalData.avePrice =  all / this.avgCache.length;
    }
}

module.exports = Environment;