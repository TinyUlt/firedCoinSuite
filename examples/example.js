const Binance = require('../internal/node-binance-api.js');
let fs = require('fs');
let binance = (new Binance()).core;

let firedCoinInfo = JSON.parse(fs.readFileSync(process.env.FiredCoinInfoPath));

let server = firedCoinInfo.server[1];
binance.options({
    'APIKEY':server.APIKEY,
    'APISECRET':server.APISECRET
});

let type = "STOP_LOSS_LIMIT";
let quantity = 0.0015;
let price = 8640;
let stopPrice = 8639;
binance.balance(function(error, balances) {
	// console.log("balances()", balances);
	if ( typeof balances.BTC !== "undefined" ) {
		console.log("BTC balance: ", balances.BTC.available);
	}
    // if ( typeof balances.BNB!== "undefined" ) {
    //     console.log("BNB balance: ", balances.BNB.available);
    // }
});
// binance.sell("BTCUSDT", quantity, price, {stopPrice: stopPrice, type: type},function(error, response) {
//     console.log("BTCUSDT()",error, response);
// });

// Get bid/ask prices
//binance.allBookTickers(function(error, json) {
//  console.log("allBookTickers",json);
//});

// Getting latest price of a symbol
// binance.prices(function(error, ticker) {
// 	console.log("prices()", ticker);
// 	console.log("Price of BNB: ", ticker.BNBBTC);
// });
// let company = require('./test').company;
// let company2 = require('./test2').company2;
// company.a++;
// console.log(company2.b);
// let array = [1,2,3,4];
// array.forEach(function(value) {
//
//    for(let i = 0; i < 1000000000; i ++){
//
//    }
//    console.log("b");
// });
// console.log("a");
// Getting list of current balances
// binance.balance(function(error, balances) {
// 	// console.log("balances()", balances);
// 	if ( typeof balances.BTC !== "undefined" ) {
// 		console.log("BTC balance: ", balances.BTC.available);
// 	}
//     // if ( typeof balances.BNB!== "undefined" ) {
//     //     console.log("BNB balance: ", balances.BNB.available);
//     // }
// });

// Getting bid/ask prices for a symbol
//binance.bookTickers(function(error, ticker) {
//	console.log("bookTickers()", ticker);
//	console.log("Price of BNB: ", ticker.BNBBTC);
//});

// Get market depth for a symbol
// binance.depth("SNMBTC", function(error, json) {
// 	console.log("market depth",json);
// });

// Getting list of open orders
// binance.openOrders("BNBBTC", function(error, json) {
// 	console.log("openOrders()",json);
// });

// binance.openOrders("BNBBTC", function(error, json) {
// 	console.log("openOrders()",json);
// 	for(let i = 0; i < json.length; i++){
//
// 	}
//     binance.cancel("ETHBTC", orderid, function(error, response) {
//         console.log("cancel()",response);
//     });
// });

// Check an order's status
// let orderid = 91831793;
// binance.orderStatus("BTCUSDT", orderid, function(error, json) {
// 	console.log("orderStatus()",json);
// });

// let orderid = 42530205;
// Cancel an order
// binance.cancel("BNBBTC", orderid, function(error, response) {
// 	console.log("cancel()",response);
// });

// Trade history
// binance.trades("BNBBTC", function(error, json) {
//  console.log("trade history",json);
// });

// Get all account orders; active, canceled, or filled.
// binance.allOrders("BTCUSDT", function(error, json) {
// 	console.log(json);
// });

//Placing a LIMIT order
// binance.buy(symbol, quantity, price);
// binance.buy("BTCUSDT", 0.00001, 100000,{}, function(error, response) {
//     console.log("BNBBTC()",error, response);
// });
// binance.sell("BNBBTC", 1, 0.069);

//Placing a MARKET order
//binance.buy(symbol, quantity, price, type);
// binance.buy("BNBBTC", 	0.01, 0, "MARKET", function(error, response) {
//     console.log("MARKET()",response);
// });
//binance.sell(symbol, quantity, 0, "MARKET");
// console.log(0.00225990+0.00007387 - (0.00007265+0.00065387+0.00007260+0.00065408+0.00007266 +0.00072700+0.00007381));
// console.log((0.00225990+0.00007387 +0.00007265+0.00065387+0.00007260+0.00065408+0.00007266 +0.00072700+0.00007381) * 0.0005);
// setTimeout(updatePrice, 500);
// function updatePrice(){
//
//     for(let i = 0 ; i < 3; i++){
//         binance.marketBuy("BTCUSDT", 0.000001, {type:'MARKET', newOrderRespType:"FULL"}, function(error, response) {
//             if(error !== null){
//                 console.log(error.statusCode);
//                 //console.log("error");
//                 process.exit();
//                 return;
//             }
//             console.log("ok");
//             //console.log("MARKET()",error, response);
//         });
//         // binance.marketBuy("ETHBTC", 0.00001, {type:'MARKET', newOrderRespType:"FULL"}, function(error, response) {
//         //     console.log("MARKET()",error, response);
//         // });
//         // binance.marketBuy("ETHBTC", 0.000014, {type:'MARKET', newOrderRespType:"FULL"}, function(error, response) {
//         //     console.log("MARKET()",error, response);
//         // });
//         // binance.marketBuy("ETHBTC", 0.0001, {type:'MARKET', newOrderRespType:"FULL"}, function(error, response) {
//         //     console.log("MARKET()",error, response);
//         // });
//         // binance.marketBuy("ETHBTC", 0.001, {type:'MARKET', newOrderRespType:"FULL"}, function(error, response) {
//         //     console.log("MARKET()",error, response);
//         // });
//
//     }
//
//     setTimeout(updatePrice, 1000);
// }

// binance.marketBuy("BTCUSDT", 0.000001, {type:'MARKET', newOrderRespType:"FULL"}, function(error, response) {
//     if(error !== null){
//         console.log(error.statusCode);
//         //console.log("error");
//         process.exit();
//         return;
//     }
//     console.log("ok");
//     //console.log("MARKET()",error, response);
// });

// binance.balance(function(error, balances) {
//     // console.log("balances()", balances);
//     if ( typeof balances.BTC !== "undefined" ) {
//         console.log("BTC balance: ", balances.BTC.available);
//     }
//     // if ( typeof balances.BNB!== "undefined" ) {
//     //     console.log("BNB balance: ", balances.BNB.available);
//     // }
// });
// Periods: 1m,3m,5m,15m,30m,1h,2h,4h,6h,8h,12h,1d,3d,1w,1M
// binance.candlesticks("BNBBTC", "5m", function(error, ticks) {
// 	console.log("candlesticks()", ticks);
// 	let last_tick = ticks[ticks.length - 1];
// 	let [time, open, high, low, close, volume, closeTime, assetVolume, trades, buyBaseVolume, buyAssetVolume, ignored] = last_tick;
// 	console.log("BNBBTC last close: "+close);
// });


// Maintain Market Depth Cache Locally via WebSocket
// binance.websockets.depthCache(["BTCUSDT"], function(symbol, depth) {
//     // console.log(symbol);
//     console.log(depth);
// 	let max = 10; // Show 10 closest orders only
// 	let bids = binance.sortBids(depth.bids, max);
// 	let asks = binance.sortAsks(depth.asks, max);
//
// 	console.log("ask: "+binance.first(asks));
// 	console.log("bid: "+binance.first(bids));
// }, 10);
// binance.websockets.depth("BTCUSDT", (depth) => {
//     const symbol = depth.s;
//     console.log(symbol+" bid: ", depth.b[0]);
//     console.log(symbol+" ask: ", depth.a[0]);
//     //console.log(symbol+" bids", binance.array(depth.b));
//     //console.log(symbol+" asks", binance.array(depth.a));
// });

// binance.websockets.chart('BNBBTC', '1m', (a_symbol, a_interval, a_chart) => {
//     console.log(a_symbol);
//     console.log(a_interval);
//     console.log(a_chart);
//     // cnt++;
//     // if ( cnt > 1 ) {
//     //     stopSockets();
//     //     return;
//     // }
//     // chart = a_chart;
//     // interval = a_interval;
//     // symbol = a_symbol;
//     // stopSockets();
//     // done();
// });
