//var async = require('async');
const TokenGenerator = require('uuid-token-generator');
let date = require('date-and-time');
let {AgeFromDateString, AgeFromDate} = require('age-calculator');
const split = require('split-string');
date.locale('hi');
var appSetting = require('../appsetting');  
var { mongoose } = require('../db');
//var mongodb = require("mongodb");
const express = require('express');
var router = express.Router();
//var db = require('mongoose');
var ObjectId = require('mongoose').Types.ObjectId; 
  
// var path = require('path')
// var multer = require('multer')
//const upload = multer({dest: __dirname + '/uploads/images'});

 
var constant = require('../../../CommonUtility/constant');   

// constant.SUMMER.BEGINNING 
var { OTPDetail, LoginToken, DeviceTokenMasters, UserMaster, UserDetails, ProviderDetails, ProviderLangDetails, LookupLangDetails, UserPurchases, UserConsumptions, TemplateLangDetails, CategoryMasters, SystemConfigurations } = require('../models/entity');
//var { Employee } = require('../models/-employee');
var ResponseDTO = require('../../../DTO/Consumer/ResponseDTO');   
var request = require('request');
// => localhost:3000/account/
const replaceString = require('replace-string');
var parser = require('xml2json');

var Helper = require('../controllers/Helper'); 



//Only for Consumer
async function getWalletDetailsByUserId(userId) { // Async function statment

    //var TotalPurchases = 0;
    // console.log("============1=============");  
    var data = {
        UserId : "",
        TotalPurchase : 0,
        TotalConsumption : 0,
        CurrentBalance : 0, 
    }  
       

    let promise = await new Promise(async function(resolve, reject) {


        await UserMaster.aggregate(
            [       
                {
                    $lookup:
                    {
                        from: "userpurchases",
                        //localField: "_id",
                        //foreignField: "provider_user_Id",
    
                        let: { userId: "$_id" }, //, order_qty: "$ordered" 
                        pipeline: [
                            { 
                                $match:
                                { 
                                    //  lookupDetails_Id : $degree,
                                    $expr:
                                    { 
                                        $and:
                                        [ 
                                            { $eq: [ "$user_Id",  "$$userId" ] },
                                            { $eq: [ "$isActive", true ] },
                                            { $eq:  [ "$isDeleted", false ]  }, 
                                            { $ne: [ "$price",  null ] }
                                        ]
                                    }
                                }
                            }, 
                            {
                                $group: 
                                {
                                    _id: "$user_Id",
                                    //uniqueIds: {$addToSet: "$_id"},
                                    totalPurchase: { $sum: "$price" },
                                    //noOfQue: { $sum: 1 },
                                    //avg : { $avg : "$price" },
                                    // count1 : {$count : "$_id" }
                                }
                            },
                            { 
                                $project: 
                                { 
                                    //NoOfQue: "$noOfQue", 
                                    totalPurchase: "$totalPurchase", 
                                    //avg : "$avg", 
                                    // count1 : "$count1",
                                    _id : 0 
                                } 
                            }
                        ],   
    
                        as: "userPurchases"
    
                    }  
                },  
                // {
                //     $unwind:"$userPurchases"
                // },    
                {
                    $lookup:
                    {
                        from: "userconsumptions",
                        //localField: "_id",
                        //foreignField: "provider_user_Id",
    
                        let: { userId: "$_id" }, //, order_qty: "$ordered" 
                        pipeline: [
                            { 
                                $match:
                                { 
                                    //  lookupDetails_Id : $degree,
                                    $expr:
                                    { 
                                        $and:
                                        [ 
                                            { $eq: [ "$consumer_user_Id",  "$$userId" ] },
                                            { $eq: [ "$isActive", true ] },
                                            { $eq: [ "$isDeleted", false ]  }, 
                                            { $ne: [ "$price",  null ] }
                                        ]
                                    }
                                }
                            }, 
                            {
                                $group: 
                                {
                                    _id: "$consumer_user_Id",
                                    //uniqueIds: {$addToSet: "$_id"},
                                    totalConsumption : { $sum: "$price" },
                                    //noOfQue: { $sum: 1 },
                                    //avg : { $avg : "$price" },
                                    // count1 : {$count : "$_id" }
                                }
                            },
                            { 
                                $project: 
                                { 
                                    //NoOfQue: "$noOfQue", 
                                    totalConsumption: "$totalConsumption", 
                                    //avg : "$avg", 
                                    // count1 : "$count1",
                                    _id : 0 
                                } 
                            }
                        ],   
    
                        as: "userConsumptions"
    
                    }  
                },  
                // {
                //     $unwind:"$userConsumptions"
                // },                                                                  
                {
                    $match : 
                    { 
                        _id : ObjectId(userId), userTypeId : ObjectId(constant.UserType.Consumer), isActive : true, isDeleted : false
                    }
                },   
                {
                    $project:
                    {  
                        _id: 0,
                        userId: "$_id",    
                        totalPurchases : //"$userPurchases.totalPurchase",
                        {
                            $cond: [ 
                                {
                                    $eq: ["$userPurchases", [] ]
                                }, 0, 
                                {
                                    $arrayElemAt:[ "$userPurchases.totalPurchase", 0]
                                }] 
                        }, 
                        totalConsumptions : //"$userConsumptions.totalConsumption",
                        {
                            $cond: [ 
                                {
                                    $eq: ["$userConsumptions", [] ]
                                }, 0, 
                                {
                                    $arrayElemAt:[ "$userConsumptions.totalConsumption", 0]
                                }] 
                        }, 
                        currentBalance: 
                        { 
                            $subtract: 
                            [ 
                                {
                                    $cond: [ 
                                        {
                                            $eq: ["$userPurchases", [] ]
                                        }, 0, 
                                        {
                                            $arrayElemAt:[ "$userPurchases.totalPurchase", 0]
                                        }] 
                                }, 
                                {
                                    $cond: [ 
                                        {
                                            $eq: ["$userConsumptions", [] ]
                                        }, 0, 
                                        {
                                            $arrayElemAt:[ "$userConsumptions.totalConsumption", 0]
                                        }] 
                                } 
                            ]
                        } 
                    }
                },  
            ], (err, result) =>
            {      
    
                console.log(result);
    
                data.UserId = result[0].userId;
                data.TotalPurchase = result[0].totalPurchases;
                data.TotalConsumption = result[0].totalConsumptions;
                data.CurrentBalance = result[0].currentBalance;
    
                console.log(data);
                resolve (data);
            }); 
 
    });

 
    return promise;
    //return data;
}


 
// async function getTotalPurchases(userId)
// {
//         var TotalPurchases = 0;

//         await UserPurchases.aggregate(
//         [  
//             {
//                 $match : 
//                 { 
//                     user_Id : ObjectId(userId), isActive : true, isDeleted : false
//                 }
//             },            
//             {
//                 $group: 
//                 {
//                     _id: ObjectId(userId), 
//                     totalPurchase: { $sum: "$price" } 
//                 }
//             }, 
//             {
//                 $project:
//                 {  
//                     _id: 0,
//                     userId: "$user_Id",   
//                     totalPurchases : "$totalPurchase",
                    
//                 }
//             }, 
                
//         ], (err, result) =>
//         {    
//             //console.log(result)
//             if(result.length > 0)
//             {
//                 console.log("P===> "+result[0].totalPurchases)
//                 TotalPurchases = result[0].totalPurchases; 
//             } 
//             else
//             {
//                 console.log("P===> "+ 0 )
//                 TotalPurchases = 0; 
//             } 

//         });

//         return TotalPurchases;
// }



// async function getTotalConsumptions(userId)
// {
    

//     // let promise = new Promise(function(resolve, reject) {
//     //   // not taking our time to do the job
//     //   resolve(123); // immediately give the result: 123
//     // }); 

//         var TotalConsumptions = 0;
//         await UserConsumptions.aggregate(
//         [  
//             {
//                 $match : 
//                 { 
//                     consumer_user_Id : ObjectId(userId), isActive : true, isDeleted : false
//                 }
//             },            
//             {
//                 $group: 
//                 {
//                     _id: ObjectId(userId), 
//                     totalConsumption : { $sum: "$price" } 
//                 }
//             },
//             {
//                 $project:
//                 {  
//                     _id: 0,
//                     userId: "$user_Id",   
//                     totalConsumptions : "$totalConsumption"  
//                 }
//             }, 
                
//         ], (err, result) =>
//         {    
//             //console.log(result)
//             if(result.length > 0)
//             {
//                 console.log("C===> " + result[0].totalConsumptions)
//                 TotalConsumptions = result[0].totalConsumptions; 
//             } 
//             else
//             {
//                 console.log("C===> " + 0)
//                 TotalConsumptions = 0; 
//             } 
//         })
//         return TotalConsumptions;
    
    
// }



// //For Consumer Purchase and Uses/Consumptions 
// async function getTotalPurchasesAndConsumptionsByUserId(userId) { // Async function statment
// console.log(userId);
//     //var TotalPurchases = 0;
//     // console.log("============1=============");  
//     var data = {
//         UserId : "",
//         TotalPurchase : 0,
//         TotalConsumption : 0,
//         CurrentBalance : 0, 
//     }  

    
//     data.UserId = userId;
//     console.log("===========< 1 >============");
//     console.log(data);

//     let promiseTP = await new Promise(async function(resolve, reject) {
//         // not taking our time to do the job
//         resolve(await getTotalPurchases(userId).then(function(TP) {
//                 console.log("===========< 2 >============");
//                 console.log(data);  
//                 data.TotalPurchase = TP;
//                 console.log("===========< 3 >============");
//                 console.log(data);
//                 return TP;
//             })
//         ); // immediately give the result: 123
//       });

//     // await getTotalPurchases(userId).then(function(TP) {
//     //     console.log("===========< 2 >============");
//     //     console.log(data);  
//     //     data.TotalPurchase = TP;
//     //     console.log("===========< 3 >============");
//     //     console.log(data);
//     // });

//     let promiseTC = await new Promise(async function(resolve, reject) {
//         // not taking our time to do the job
//         resolve(await getTotalConsumptions(userId).then(function(TC) {
//                 console.log("===========< 4 >============");
//                 console.log(data);
//                 data.TotalConsumption = TC;
//                 console.log("===========< 5 >============");
//                 console.log(data);
//                 return TC; 
//             })
//         ); // immediately give the result: 123
//       });

//     // await getTotalConsumptions(userId).then(function(TC) {
//     //     console.log("===========< 4 >============");
//     //     console.log(data);
//     //     data.TotalConsumption = TC;
//     //     console.log("===========< 5 >============");
//     //     console.log(data);
//     // });
    
//     console.log("===========< 6 >============");
//     console.log(data);
//     // setTimeout(function(){
//         data.CurrentBalance = promiseTP - promiseTC; 
//     // },1000);
    
//     console.log("===========< 7 >============");
//     console.log(data);


//     let promiseWB = await new Promise(async function(resolve, reject) {
//         // not taking our time to do the job
//         resolve(await {
//                     UserId : userId,
//                     TotalPurchase : promiseTP,
//                     TotalConsumption : promiseTC,
//                     CurrentBalance : promiseTP - promiseTC, 
//                 }  
//         ); // immediately give the result: 123
//       });

//     // await UserPurchases.aggregate(
//     //     [  
//     //         {
//     //             $match : 
//     //             { 
//     //                 user_Id : ObjectId(userId), isActive : true, isDeleted : false
//     //             }
//     //         },            
//     //         {
//     //             $group: 
//     //             {
//     //                 _id: ObjectId(userId), 
//     //                 totalPurchase: { $sum: "$price" } 
//     //             }
//     //         }, 
//     //         {
//     //             $project:
//     //             {  
//     //                 _id: 0,
//     //                 userId: "$user_Id",   
//     //                 totalPurchases : "$totalPurchase",
                   
//     //             }
//     //         }, 
             
//     //     ], (err, result) =>
//     //     {    
//     //         console.log(result)
//     //         if(result.length > 0)
//     //         {
//     //             data.TotalPurchase = result[0].totalPurchases; 
//     //         } 
//     //         else
//     //         {
//     //             data.TotalPurchase = 0; 
//     //         } 
            
//     //     }).then(function(){ UserConsumptions.aggregate(
//     //         [  
//     //             {
//     //                 $match : 
//     //                 { 
//     //                     consumer_user_Id : ObjectId(userId), isActive : true, isDeleted : false
//     //                 }
//     //             },            
//     //             {
//     //                 $group: 
//     //                 {
//     //                     _id: ObjectId(userId), 
//     //                     totalConsumption : { $sum: "$price" } 
//     //                 }
//     //             },
//     //             {
//     //                 $project:
//     //                 {  
//     //                     _id: 0,
//     //                     userId: "$user_Id",   
//     //                     totalConsumptions : "$totalConsumption",
                       
//     //                 }
//     //             }, 
                 
//     //         ], (err, result) =>
//     //         {    
//     //             console.log(result)
//     //             if(result.length > 0)
//     //             {
//     //                 data.TotalConsumption = result[0].totalConsumptions; 
//     //             } 
//     //             else
//     //             {
//     //                 data.TotalConsumption = 0; 
//     //             } 
//     //         })
//     //     }).then(function(){
//     //         data.CurrentBalance = data.TotalPurchase - data.TotalConsumption; 
//     //     });         



       
//     // await UserMaster.aggregate(
//     //     [       
//     //         {
//     //             $lookup:
//     //             {
//     //                 from: "userpurchases",
//     //                 //localField: "_id",
//     //                 //foreignField: "provider_user_Id",

//     //                 let: { userId: "$_id" }, //, order_qty: "$ordered" 
//     //                 pipeline: [
//     //                     { 
//     //                         $match:
//     //                         { 
//     //                             //  lookupDetails_Id : $degree,
//     //                             $expr:
//     //                             { 
//     //                                 $and:
//     //                                 [ 
//     //                                     { $eq: [ "$user_Id",  "$$userId" ] },
//     //                                     { $eq: [ "$isActive", true ] },
//     //                                     { $eq: [ "$isDeleted", false ]  }, 
//     //                                     { $ne: [ "$price",  null ] }
//     //                                 ]
//     //                             }
//     //                         }
//     //                     }, 
//     //                     {
//     //                         $group: 
//     //                         {
//     //                             _id: "$user_Id",
//     //                             //uniqueIds: {$addToSet: "$_id"},
//     //                             totalPurchase: { $sum: "$price" },
//     //                             //noOfQue: { $sum: 1 },
//     //                             //avg : { $avg : "$price" },
//     //                             // count1 : {$count : "$_id" }
//     //                         }
//     //                     },
//     //                     { 
//     //                         $project: 
//     //                         { 
//     //                             //NoOfQue: "$noOfQue", 
//     //                             totalPurchase: "$totalPurchase", 
//     //                             //avg : "$avg", 
//     //                             // count1 : "$count1",
//     //                             _id : 0 
//     //                         } 
//     //                     },
//     //                     {
//     //                         $unwind:
//     //                         { 
//     //                             path : "$userPurchases",
//     //                             preserveNullAndEmptyArrays: true
//     //                         }
//     //                     },  
//     //                 ],   

//     //                 as: "userPurchases"

//     //             }  
//     //         },  
//     //         // {
//     //         //     $unwind:"$userPurchases",
//     //         //     //preserveNullAndEmptyArrays: true
//     //         // },    
//     //         {
//     //             $lookup:
//     //             {
//     //                 from: "userconsumptions",
//     //                 //localField: "_id",
//     //                 //foreignField: "provider_user_Id",

//     //                 let: { userId: "$_id" }, //, order_qty: "$ordered" 
//     //                 pipeline: [
//     //                     { 
//     //                         // $match:
//     //                         // { 
//     //                         //     //  lookupDetails_Id : $degree,
//     //                         //     $expr:
//     //                         //     { 
//     //                                 $and:
//     //                                 [ 
//     //                                     { $eq: [ "$consumer_user_Id",  "$$userId" ] },
//     //                                     { $eq: [ "$isActive", true ] },
//     //                                     { $eq: [ "$isDeleted", false ]  }, 
//     //                                     { $ne: [ "$price",  null ] }
//     //                                 ],
//     //                                 // $or :
//     //                                 // [
//     //                                 //     { $eq: [ "$consumer_user_Id",  null ] }
//     //                                 // ]

//     //                         //     }
//     //                         // }
//     //                     },  
//     //                     {
//     //                         $group: 
//     //                         {
//     //                             _id: "$consumer_user_Id",
//     //                             //uniqueIds: {$addToSet: "$_id"},
//     //                             //totalConsumption : { $sum: "$price" },
//     //                             totalConsumption : { $sum: "$price" },
//     //                             //noOfQue: { $sum: 1 },
//     //                             //avg : { $avg : "$price" },
//     //                             // count1 : {$count : "$_id" }
//     //                         }
//     //                     },
//     //                     { 
//     //                         $project: 
//     //                         { 
//     //                             //NoOfQue: "$noOfQue", 
//     //                             totalConsumption: "$totalConsumption" , 
//     //                             //totalConsumption: "$totalConsumption",//{ $ifNull: [ "$totalConsumption", "Unspecified" ] }, 
                                
//     //                             // totalConsumption: {
//     //                             //     $cond: { if: { "$userConsumptions" : { $exists : true } }, then: 0, else: 0 }
//     //                             //   },
//     //                             //totalConsumption: 0,//{ $cond: { if: { $isArray: "$userConsumptions" }, then: "$userConsumptions" , else: "0"} },


//     //                             //avg : "$avg", 
                                
//     //                             // count1 : "$count1",
//     //                             _id : 0 
//     //                         } 
//     //                     },
//     //                     {
//     //                         $unwind:
//     //                         { 
//     //                             path : "$userConsumptions",
//     //                             preserveNullAndEmptyArrays: true
//     //                         }
//     //                     },   


//     //                 ],   

//     //                 as: "userConsumptions"

//     //             } 
//     //         },  
//     //         // {
//     //         //     $unwind:"$userConsumptions",
//     //         //     //preserveNullAndEmptyArrays: true
//     //         // },                                                      
//     //         {
//     //             $match : 
//     //             { 
//     //                 _id : ObjectId(userId), userTypeId : ObjectId(constant.UserType.Consumer), isActive : true, isDeleted : false
//     //             }
//     //         },   
//     //         {
//     //             $project:
//     //             {  
//     //                 _id: 0,
//     //                 userId: "$_id",   
//     //                 totalPurchases : "$userPurchases.totalPurchase",
//     //                 totalConsumptions : "$userConsumptions",   //s.totalConsumption
//     //                 //currentBalance: { $subtract: [ "$userPurchases.totalPurchase", "$userConsumptions.totalConsumption" ] } 
//     //             }
//     //         }, 
            


//     //     ], (err, result) =>
//     //     {      
//     //         console.log(result);
//     //         console.log(result.length);
//     //         data.UserId = result[0].userId;
//     //         data.TotalPurchase = result[0].totalPurchases;
//     //         data.TotalConsumption = result[0].totalConsumptions;
//     //         data.CurrentBalance = result[0].currentBalance;

//     //         console.log(data);
             
//     //     });  

    

//     console.log("<<<<================ Balance ================>>>")
//     console.log(data); 
//     // setTimeout(function(){
//         return promiseWB;
//     // },1000);
    
// }
 

function addUpdateDeviceToken(userId, appId, deviceId, deviceToken)
{ 
    console.log("userId : "+ userId +"  appId : "+ appId +" deviceId : "+ deviceId +"   deviceToken : "+ deviceToken);
    DeviceTokenMasters.find({appId : appId, deviceId : deviceId, isDeleted : false},(err, deviceTokenMasters) => 
    {  
        if(!err)
        {
            if(deviceTokenMasters.length)
            {
                //Update
                DeviceTokenMasters.updateOne({appId : appId, deviceId : deviceId}, { $set: {user_Id: ObjectId(userId), deviceToken : deviceToken, isActive : true, updatedBy: ObjectId(userId), updatedDateTime : new Date() } }, function(err, res) {
                    if (err)  
                    {
                        console.log(err); //throw err;
                    }
                    else
                    {
                        console.log("Update Token Details"); 
                    }
                }); 
            }
            else
            {
                //Insert
                var deviceTokenDetails = new DeviceTokenMasters({ 
                    user_Id : ObjectId(userId),
                    appId : appId,
                    deviceId : deviceId,
                    deviceToken : deviceToken, 
                    isActive : true,
                    isDeleted : false, 
                    createdBy : ObjectId(userId),
                    createdDateTime : new Date(),
                    updatedBy : null,
                    updatedDateTime : null
                });

                deviceTokenDetails.save((err, doc) => {
                    if (!err) { 
                        console.log("Store Token Details");  
                    }
                    else { 
                        console.log(err);
                        //res.send(ResponseDTO.TechnicalError())
                     }
                });      
            }
        }

    }); 
}


function addUpdateLoginToken(userId, appId, deviceId, loginToken)
{ 
    console.log("userId : "+ userId +"  appId : "+ appId +" deviceId : "+ deviceId +"   deviceToken : "+ loginToken);
    LoginToken.find({appId : appId, deviceId : deviceId, isDeleted : false}, (err, loginTokenDetails)  => 
    {  
        if(!err)
        {
            if(loginTokenDetails.length)
            {
                //Update
                LoginToken.updateOne({appId : appId, deviceId : deviceId}, { $set: {user_Id: ObjectId(userId), loginToken : loginToken, startDate : new Date(), isActive : true, updatedBy: ObjectId(userId), updatedDateTime : new Date() } }, function(err, res) {
                    if (err) throw err;
                    console.log("Update Login Token Details : " + loginToken); 
                  }); 
            }
            else
            {
                //Insert
                var loginTokenDetail = new LoginToken({ 
                    user_Id : ObjectId(userId),
                    appId : appId,
                    deviceId : deviceId,
                    loginToken : loginToken, 
                    startDate : new Date(),
                    isActive : true,
                    isDeleted : false, 
                    createdBy : ObjectId(userId),
                    createdDateTime : new Date(),
                    updatedBy : null,
                    updatedDateTime : null
                });

                loginTokenDetail.save((err, doc) => {
                    if (!err) { 
                        console.log("Store Login Token Details" + loginToken); 
                    }
                    else { 
                        console.log(err);
                        //res.send(ResponseDTO.TechnicalError())
                     }
                });      
            }
        }

    }); 
}



 

//--Remove-- For Send OTP
router.post('/_SendOTP', async (req, res) => {
  //  console.log(req.body);

  console.log(!(appSetting.SystemConfiguration.MobileListForNotSendSMS.includes(req.body.mobileNo)));

    if(req.body.mobileNo == undefined)
    {
        res.send(ResponseDTO.InvalidParameter()); 
    }
    else
    {  
        var OTP = 1234;
        let promise = await new Promise(async function(resolve, reject) {
            if(appSetting.SMS.IsSendRealSMS && !(appSetting.SystemConfiguration.MobileListForNotSendSMS.includes(req.body.mobileNo)))
            { 
                OTP = Math.floor(1000 + Math.random() * 9000); 

                console.log(req.body.mobileNo);
                var Message = replaceString(constant.Template.SMSForOTP, "@OTP@", OTP + '' );

                if(constant.AppType.Android == req.headers.appid)
                {
                    Message = Message + appSetting.SMS.AndroidKeyHashForAutoFill
                } 

                console.log('Message : ' + Message)
                console.log('https://www.smsbox.com/SMSGateway/Services/Messaging.asmx/Http_SendSMS?username='+appSetting.SMS.Username+'&password='+appSetting.SMS.Password+'&customerId='+appSetting.SMS.CustomerId+'&senderText='+appSetting.SMS.SenderText+'&messageBody='+ Message +'&recipientNumbers=965'+req.body.mobileNo+'&defdate=&isBlink=false&isFlash=false');
                request('https://www.smsbox.com/SMSGateway/Services/Messaging.asmx/Http_SendSMS?username='+appSetting.SMS.Username+'&password='+appSetting.SMS.Password+'&customerId='+appSetting.SMS.CustomerId+'&senderText='+appSetting.SMS.SenderText+'&messageBody='+ Message +'&recipientNumbers=965'+req.body.mobileNo+'&defdate=&isBlink=false&isFlash=false', function (error, response, body) {
                
                    console.log("body : " + body);
                    console.log("response : " + response);
                    console.log("error : " + error);

                    var da = parser.toJson(body);
                    console.log("da : " + da);

                    var jsonResult = JSON.parse(parser.toJson(body));
                    console.log(jsonResult);

                    console.log(jsonResult.SendingSMSResult.Result);
                    console.log(jsonResult.SendingSMSResult.Message); 

                    var dataResult = {
                        IsSendSMS : jsonResult.SendingSMSResult.Result == 'true',
                        Message : jsonResult.SendingSMSResult.Message
                    }

                    resolve(dataResult); 
                }); 
     
            } 
            else
            {
                var dataResult = {
                    IsSendSMS : true,
                    Message : ""
                }

                resolve(dataResult); 
            }
       
        });   


        var addData = new OTPDetail({ 
            mobileNo : req.body.mobileNo,
            emailAddress : null,
            OTP : OTP,
            validTill : date.addMinutes(new Date(), 10), 
            isActive : true,
            isDeleted : false, 
            createdBy : null,
            createdDateTime : new Date(),
            updatedBy : null,
            updatedDateTime : null
        });
 
        console.log(addData);

        addData.save((err, doc) => {
            if (!err) { 
                //console.log(doc); 
                //Add New OTP Details

                if(promise != null && promise.IsSendSMS)
                {
                    res.send(ResponseDTO.SendOTP(constant.ErrorCode.OTPSentSuccessfully, constant.ErrorMsg.OTPSentSuccessfully, addData));             
                }
                else
                {
                    res.send(ResponseDTO.SendOTP(constant.ErrorCode.InvalidMobileNo, promise.Message, {}));             
                }
                
            }
            else { 
                console.log(err);
                res.send(ResponseDTO.TechnicalError());
            }
        });     



         
        // // var updateData = new OTPDetail({  
        // //     isDeleted : true,  
        // //     updatedBy : null,
        // //     updatedDateTime : new Date(),
        // // });

        // // var query = { 
        // //     "_id": {$eq : "tyuytuyutyu"}
        // // };

        // //OTPDetail.update(query, { $set: updateData }, {multi: true}, (err, doc) => {
           
        //     //console.log(doc);
        //     // if (err)  
        //     // {
        //     //     console.log(err);
        //     //     res.send(ResponseDTO.TechnicalError())
        //     // }
        //     // else
        //     // {
        //         var addData = new OTPDetail({ 
        //             mobileNo : req.body.mobileNo,
        //             emailAddress : null,
        //             OTP : OTP,
        //             validTill : date.addMinutes(new Date(), 10), 
        //             isActive : true,
        //             isDeleted : false, 
        //             createdBy : null,
        //             createdDateTime : new Date(),
        //             updatedBy : null,
        //             updatedDateTime : null
        //         });

        //         addData.save((err, doc) => {
        //             if (!err) { 
        //                 //console.log(doc); 
        //                 //Add New OTP Details
        //                 res.send(ResponseDTO.SendOTP(constant.ErrorCode.OTPSentSuccessfully, constant.ErrorMsg.OTPSentSuccessfully, addData));             
        //             }
        //             else { 
        //                 console.log(err);
        //                 res.send(ResponseDTO.TechnicalError());
        //              }
        //         });            
        //     //}
        // //});
 


 
       // res.send(ResponseDTO.SendOTP(1,"ddd",doc)); 

        // var query = {
        //     "_id": new ObjectId("5cb5b3b6dbe4973a7ce65c8e")
        // };
        
        // UserMaster.find(query, function(err, doc){
        //    // console.log(doc);
        //     res.send(ResponseDTO.SendOTP(1,"ddd",doc)); 
        //     //res.send(doc); 
        // });
    }
 
});


//--Remove-- For Verify OTP and get User details
router.post('/_VerifyOTP', (req, res) => {
    //  console.log(req.body);
   
  
      if(req.body.mobileNo == undefined || req.body.OTP == undefined || req.body.deviceToken == undefined || req.body.deviceToken.trim() == "")
      {
          res.send(ResponseDTO.InvalidParameter()); 
      }
      else
      {  
    
            var query = {
                "mobileNo": req.body.mobileNo,
                "OTP": req.body.OTP,
                "validTill": {
                    "$gte": new Date()
                }
            };
            
            var sort = [ ["_id", -1] ];
            var limit = 1;
            
            OTPDetail.find(query, (err, doc) => 
            {
                if (!err) 
                { 
                    //console.log(doc);   
                    if(doc.length > 0)
                    { 
                        console.log("Valid OTP");   
                        UserMaster.find({mobileNo : req.body.mobileNo, isActive : true, isDeleted : false}, (err, userMaster) => 
                        {  
                        //    console.log(userMaster.length);  
                            
                            if (!err) 
                            {  
                                if(userMaster.length)
                                {  
                                    // console.log(userMaster[0].userTypeId);
                                    // console.log(constant.UserType.Provider);
                                    if(userMaster[0].userTypeId == constant.UserType.Consumer)
                                    {   
                                        console.log("Consumer");
                                        //Login : User Details with Consumer Details 
                                        UserDetails.find({user_Id : userMaster[0]._id, isActive : true, isDeleted : false}, async (err, userDetails) => 
                                        {
                                            if (!err) 
                                            { 
                                                //Data Retrieved Successfully 
                                                addUpdateDeviceToken(userMaster[0]._id, req.headers.appid, req.headers.deviceid, req.body.deviceToken);

                                                const tokgen = new TokenGenerator(256, TokenGenerator.BASE62);  
                                                var loginToken = tokgen.generate();
                                                addUpdateLoginToken(userMaster[0]._id, req.headers.appid, req.headers.deviceid, loginToken);
                                                 


                                                await getWalletDetailsByUserId(userMaster[0]._id).then(function(data){
                                                   // doc[0].walletBalance = data.CurrentBalance;
                                                    console.log(data.CurrentBalance);
                                                    console.log(data);
                                                  
                                                    //appSetting.SystemConfiguration.APIBaseUrl + 
                                                    userMaster[0].image = appSetting.SystemConfiguration.UserDisplayImagePath + (userMaster[0].image == null || userMaster[0].image == "" ? appSetting.SystemConfiguration.UserDefaultImage : userMaster[0]._id +"/"+ userMaster[0].image);
                                                    
                                                    res.send(ResponseDTO.GetConsumerDetails(constant.ErrorCode.LoginSuccessfully, constant.ErrorMsg.LoginSuccessfully, userMaster[0], userDetails[0], loginToken, data.CurrentBalance) );
                                                });

                                                // getTotalPurchasesAndConsumptionsByUserId(userMaster[0]._id).then(function (walletDetails) {
                                                //     //console.log(walletDetails);
                                                    
                                                //     userMaster[0].image = appSetting.SystemConfiguration.APIBaseUrl + appSetting.SystemConfiguration.UserDisplayImagePath + (userMaster[0].image == null || userMaster[0].image == "" ? appSetting.SystemConfiguration.UserDefaultImage : userMaster[0]._id +"/"+ userMaster[0].image);
                                                    
                                                //     res.send(ResponseDTO.GetConsumerDetails(constant.ErrorCode.LoginSuccessfully, constant.ErrorMsg.LoginSuccessfully, userMaster[0], userDetails[0], loginToken, walletDetails.CurrentBalance) );
                                                // });

                                                
                                            }
                                            else
                                            {
                                                console.log('Error :' + JSON.stringify(err, undefined, 2));
                                                res.send(ResponseDTO.TechnicalError()); 
                                            } 
 
                                        }).sort(sort).limit(limit); 
                                    }
                                    else if(userMaster[0].userTypeId == constant.UserType.Provider)
                                    {
                                        //Login : User Details with Provider Details 
                                        console.log("Provider");


                                        addUpdateDeviceToken(userMaster[0]._id, req.headers.appid, req.headers.deviceid, req.body.deviceToken);

                                        const tokgen = new TokenGenerator(256, TokenGenerator.BASE62);  
                                        var loginToken = tokgen.generate();

                                        addUpdateLoginToken(userMaster[0]._id, req.headers.appid, req.headers.deviceid, loginToken);

 
                                        UserMaster.aggregate(
                                            [    
                                                {
                                                    $lookup:
                                                    {
                                                        from: "providerdetails",
                                                        //localField: "_id",
                                                        //foreignField: "user_Id",
                            
                                                        let: { userId: "$_id" }, //, order_qty: "$ordered" 
                                                        pipeline: [
                                                            { 
                                                                $match:
                                                                { 
                                                                    //  lookupDetails_Id : $degree,
                                                                    $expr:
                                                                    { 
                                                                        $and:
                                                                        [ 
                                                                            { $eq: [ "$user_Id",  "$$userId" ] },
                                                                            { $eq: [ "$isActive", true ] },
                                                                            { $eq: [ "$isDeleted", false ]  }
                                                                            
                                                                        ]
                                                                    }
                                                                }
                                                            },  
                                                            {
                                                                $lookup:
                                                                {
                                                                    from: "lookuplangdetails", 
                                        
                                                                    let: { degree: "$degree", language_Id: ObjectId(req.headers.languageid)}, //, order_qty: "$ordered" 
                                                                    pipeline: [
                                                                        { 
                                                                            $match:
                                                                            {  
                                                                                $expr:
                                                                                { 
                                                                                    $and:
                                                                                    [ 
                                                                                        { $in: [ "$lookupDetails_Id",  "$$degree" ] },
                                                                                        { $eq: [ "$language_Id",  "$$language_Id" ]},
                                                                                        { $eq: [ "$isActive", true ] },
                                                                                        { $eq: [ "$isDeleted", false ]  }, 
                                                                                    ]
                                                                                }
                                                                            }
                                                                        },
                                                                        { 
                                                                            $project: 
                                                                            { 
                                                                                lookupDetails_Id: "$lookupDetails_Id", lookupValue: "$lookupValue", _id : 0 
                                                                            } 
                                                                        }
                                                                    ],                  
                                        
                                                                    as: "lookupLangDetails"
                                                                }  
                                                            },     
                                                            {
                                                                $lookup:
                                                                {
                                                                    from: "providerlangdetails", 
                                        
                                                                    let: { providerDetailsId: "$_id", language_Id: ObjectId(req.headers.languageid)}, //, order_qty: "$ordered" 
                                                                    pipeline: [
                                                                        { 
                                                                            $match:
                                                                            {  
                                                                                $expr:
                                                                                { 
                                                                                    $and:
                                                                                    [ 
                                                                                        { $eq: [ "$providerdetails_Id",  "$$providerDetailsId" ] },
                                                                                        { $eq: [ "$language_Id",  "$$language_Id" ]},
                                                                                        { $eq: [ "$isActive", true ] },
                                                                                        { $eq: [ "$isDeleted", false ]  }, 
                                                                                    ]
                                                                                }
                                                                            }
                                                                        },
                                                                        { 
                                                                            $project: 
                                                                            { 
                                                                                description: "$description", _id : 0 
                                                                            } 
                                                                        }
                                                                    ],                  
                                        
                                                                    as: "providerLangDetails"
                                                                }  
                                                            },     
                                                            {
                                                                $unwind:"$providerLangDetails"
                                                            },                                                           
                                                            { 
                                                                $project: 
                                                                {  
                                                                    _id : 0,
                                                                    providerDetailsId : "$_id",
                                                                    categoryId : "$categoryId",
                                                                    subCategoryId : "$subCategoryId",
                                                                    experience : "$experience",
                                                                    price : "$price", 
                                                                    currencySymbol: constant.CurrencySymbol.Kuwait,
                                                                    commissionPercentage : "$commissionPercentage",
                                                                    //description:"$providerLangDetails.description", //Changes
                            
                                                                    //user_Id : "$user_Id",
                                                                    
                                                                    degree : "$lookupLangDetails",
                                                                    
                                                                } 
                                                            }
                                                        ],
                            
                                                        as: "providerDetails"
                                                    }  
                                                }, 
                                                {
                                                    $unwind:"$providerDetails"
                                                },        
                                                // {
                                                //     $lookup:
                                                //     {
                                                //         from: "logintokens",
                                                //         // localField: "_id",
                                                //         // foreignField: "user_Id",
                                                //         let: { userId: "$_id" }, //, order_qty: "$ordered" 
                                                //         pipeline: [
                                                //             { 
                                                //                 $match:
                                                //                 { 
                                                //                     //  lookupDetails_Id : $degree,
                                                //                     $expr:
                                                //                     { 
                                                //                         $and:
                                                //                         [ 
                                                //                             { $eq: [ "$user_Id",  "$$userId" ] },
                                                //                             { $eq: [ "$isActive", true ] },
                                                //                             { $eq: [ "$isDeleted", false ]  }, 
                                                //                             { $eq: [ "$deviceId",  req.headers.deviceid ] },
                                                //                             { $eq: [ "$appId",  parseInt(req.headers.appid) ] } 
                                                //                         ]
                                                //                     }
                                                //                 }
                                                //             },  
                                                //             { 
                                                //                 $project: 
                                                //                 {  
                                                //                     loginToken : 1
                                                //                 } 
                                                //             }
                                                //         ],   
                            
                                                //         as: "logintokens"
                                                //     }  
                                                // },    
                                                // {
                                                //     $unwind:"$logintokens"
                                                // },   
                                                {
                                                    $lookup:
                                                    {
                                                        from: "appointmentdetails",
                                                        //localField: "_id",
                                                        //foreignField: "provider_user_Id",
                            
                                                        let: { userId: "$_id" }, //, order_qty: "$ordered" 
                                                        pipeline: [
                                                            { 
                                                                $match:
                                                                { 
                                                                    //  lookupDetails_Id : $degree,
                                                                    $expr:
                                                                    { 
                                                                        $and:
                                                                        [ 
                                                                            { $eq: [ "$provider_user_Id",  "$$userId" ] },
                                                                            { $eq: [ "$isActive", true ] },
                                                                            { $eq:  [ "$isDeleted", false ]  }, 
                                                                            { $ne: [ "$rate",  null ] }
                                                                        ]
                                                                    }
                                                                }
                                                            }, 
                                                            {
                                                                $group: 
                                                                {
                                                                    _id: "$provider_user_Id",
                                                                    //uniqueIds: {$addToSet: "$_id"},
                                                                    total: { $sum: "$rate" },
                                                                    noOfQue: { $sum: 1 },
                                                                    avg : { $avg : "$rate" },
                                                                    // count1 : {$count : "$_id" }
                                                                }
                                                            },
                                                            { 
                                                                $project: 
                                                                { 
                                                                    NoOfQue: "$noOfQue", 
                                                                    total: "$total", 
                                                                    avg : "$avg", 
                                                                    // count1 : "$count1",
                                                                    _id : 0 
                                                                } 
                                                            }
                                                        ],   
                            
                                                        as: "appointmentDetails"
                            
                                                    }  
                                                },  
                                                // {
                                                //     $unwind:"$appointmentDetails"
                                                // },                                   
                                                {
                                                    $match : 
                                                    { 
                                                        _id : ObjectId(userMaster[0]._id), userTypeId : ObjectId(constant.UserType.Provider), isActive : true, isDeleted : false
                                                    }
                                                },  
                              
                                                {
                                                    $project:
                                                    {  
                                                        _id: 0,
                                                        userId: "$_id",  
                                                        firstName: "$firstName",
                                                        lastName: "$lastName",
                                                        middleName: "$middleName", 
                                                        emailAddress : "$emailAddress",
                                                        mobileNo : "$mobileNo",
                                                        DOB : "$DOB",
                                                        genderId : "$genderId",
                                                        image : //"$image",  
                                                        {
                                                            $concat: 
                                                            [
                                                                //appSetting.SystemConfiguration.APIBaseUrl, 
                                                                appSetting.SystemConfiguration.UserDisplayImagePath,
                                                                {
                                                                    $cond: 
                                                                    { 
                                                                        if: 
                                                                        { 
                                                                            $or : [{
                                                                                $eq: [ "$image", null ] 
                                                                            },
                                                                            {
                                                                                $eq: [ "$image", "" ] 
                                                                            }] 
                                                                        }, 
                                                                        then: appSetting.SystemConfiguration.UserDefaultImage, 
                                                                        else: 
                                                                        { 
                                                                            $concat: 
                                                                            [ 
                                                                                { 
                                                                                    $convert: 
                                                                                    { 
                                                                                        input: "$_id", to: "string" 
                                                                                    } 
                                                                                }, "/", "$image" 
                                                                            ]
                                                                        }
                                                                    }               
                                                                }
                                                            ]
                                                        },  
                                                        userTypeId: "$userTypeId", 
                                                        loginToken : loginToken, //"$logintokens.loginToken",
                                                        createdDateTime : "$createdDateTime", 
                                                        // noOfQue: "$appointmentDetails.NoOfQue",
                                                        // rate : "$appointmentDetails.avg",  
                                                        noOfQue: //"$appointmentDetails.NoOfQue",
                                                        {
                                                            $cond: [ 
                                                                {
                                                                    $eq: ["$appointmentDetails", [] ]
                                                                }, 0, 
                                                                {
                                                                    $arrayElemAt:[ "$appointmentDetails.NoOfQue", 0]
                                                                }] 
                                                        }, 
                                                        rate : //"$appointmentDetails.avg",                                        
                                                        {
                                                            $cond: [ 
                                                                {
                                                                    $eq: ["$appointmentDetails", [] ]
                                                                }, 0, 
                                                                {
                                                                    $arrayElemAt:[ "$appointmentDetails.avg", 0]
                                                                }] 
                                                        }, 
                                                        providerDetails : "$providerDetails",  
                                                        degree: "$lookupLangDetails" 
                                                    }
                                                },  
                            
                                
                                            ], (err, provider) =>
                                            {    
                                                if(!err)  
                                                {
                                                    console.log(provider);
                                                    res.send(ResponseDTO.GetProviderList(constant.ErrorCode.LoginSuccessfully, constant.ErrorMsg.LoginSuccessfully, provider[0] ));  
                                                }
                                                else
                                                {
                                                    res.send(ResponseDTO.TechnicalError());  
                                                }
                            
                                            });


                                        // ProviderDetails.find({user_Id : userMaster[0]._id, isActive : true, isDeleted : false},(err, providerDetails) => 
                                        // {
                                        //     if (!err) 
                                        //     { 
                                        //         //console.log(providerDetails);

                                        //         ProviderLangDetails.find({providerdetails_Id : providerDetails[0]._id, language_Id : req.headers.languageid, isActive : true, isDeleted : false}, (err, providerLangDetails) => 
                                        //         {
                                        //             //console.log(providerLangDetails);
                                        //             if (!err) 
                                        //             { 
                                        //                 LookupLangDetails.find({lookupDetails_Id : providerDetails[0].degree, language_Id : req.headers.languageid, isActive : true, isDeleted : false}, {lookupDetails_Id : 1, lookupValue : 1, _id : 0 }, (err, lookupLangDetails) => 
                                        //                 {  

                                        //                   //  console.log(lookupLangDetails.project({lookupDetails_Id : 1, lookupValue : 1}));
                                        //                     if (!err) 
                                        //                     { 
                                        //                         //Data Retrieved Successfully
                                        //                         addUpdateDeviceToken(userMaster[0]._id, req.headers.appid, req.headers.deviceid, req.body.deviceToken);

                                        //                         const tokgen = new TokenGenerator(256, TokenGenerator.BASE62);  
                                        //                         var loginToken = tokgen.generate();

                                        //                         addUpdateLoginToken(userMaster[0]._id, req.headers.appid, req.headers.deviceid, loginToken);
                                        //                         res.send(ResponseDTO.GetProviderDetails(constant.ErrorCode.DataRetrievedSuccessfully, constant.ErrorMsg.DataRetrievedSuccessfully , userMaster[0], providerDetails[0], providerLangDetails[0], lookupLangDetails, loginToken) );
                                        //                     }
                                        //                     else
                                        //                     {
                                        //                         console.log('Error :' + JSON.stringify(err, undefined, 2));
                                        //                         res.send(ResponseDTO.TechnicalError()); 
                                        //                     }
                                                            
                                        //                 }); 
                                        //             }
                                        //             else
                                        //             {
                                        //                 console.log('Error :' + JSON.stringify(err, undefined, 2));
                                        //                 res.send(ResponseDTO.TechnicalError()); 
                                        //             } 
                                        //         }).sort(sort).limit(limit); 
 
                                        //     }
                                        //     else
                                        //     {
                                        //         console.log('Error :' + JSON.stringify(err, undefined, 2));
                                        //         res.send(ResponseDTO.TechnicalError()); 
                                        //     } 
 
                                        // }).sort(sort).limit(limit); 
                                    }
                                    else
                                    {
                                        //Admin can create a/c with Provider Consumer // 
                                        console.log("Not Exist User. Please Registration it.2");   
                                        res.send(ResponseDTO.ErrorMassage( constant.ErrorCode.NotRegistration, constant.ErrorMsg.NotRegistration, {} ));
                                    } 
                                }
                                else
                                {  
                                    console.log("Not Exist User. Please Registration it.1");    
                                    res.send(ResponseDTO.ErrorMassage(constant.ErrorCode.NotRegistration, constant.ErrorMsg.NotRegistration, {} ));
                                } 
                            }
                            else 
                            { 
                                console.log('Error :' + JSON.stringify(err, undefined, 2));
                                res.send(ResponseDTO.TechnicalError()); 
                            }
                        }).sort(sort).limit(limit);
                        //res.send(ResponseDTO.VerifyOTP(constant.ErrorCode.validOTP, constant.ErrorMsg.InvalidOTP, null)) 
                    }
                    else
                    { 
                        console.log("Invalid OTP");  
                        res.send(ResponseDTO.VerifyOTP(constant.ErrorCode.InvalidOTP, constant.ErrorMsg.InvalidOTP, {}));
                    }
                
                }
                else 
                { 
                    console.log('Error :' + JSON.stringify(err, undefined, 2));
                    res.send(ResponseDTO.TechnicalError()); 
                }
            }).sort(sort).limit(limit);
        
             
      }
   
});


//For Consumer registration/Sign up --Done -Email
router.post('/SignUp', (req, res) => {



    console.log(req.body);
    if(req.body.firstName == undefined || req.body.lastName == undefined || req.body.middleName == undefined || req.body.emailAddress == undefined || req.body.mobileNo == undefined || req.body.DOB == undefined || req.body.genderId == undefined || req.body.userTypeId == undefined || !req.body.firstName.trim() || !req.body.userTypeId.trim() || !req.body.emailAddress.trim() || !req.body.mobileNo.trim() || !req.body.genderId.trim() || req.body.deviceToken == undefined || req.body.deviceToken.trim() == "" || req.body.password == undefined || req.body.password.trim() == "" )
    {
        res.send(ResponseDTO.InvalidParameter()); 
    } 
    else
    {  
        req.body.emailAddress = req.body.emailAddress.toLowerCase();
        console.log("Email Address : " + req.body.emailAddress);

        //console.log(req.body); 
        if(req.body.userTypeId == constant.UserType.Consumer && (req.body.genderId >= constant.Gender.Secret && req.body.genderId <= constant.Gender.Female)  )
        {
          
            UserMaster.find({emailAddress : req.body.emailAddress, isActive : true, isDeleted : false}, (err, IsExistEmailAddress) => 
            {                   
                if (!err) 
                { 
                    if(!IsExistEmailAddress.length)
                    {
                        UserMaster.find({mobileNo : req.body.mobileNo, isActive : true, isDeleted : false}, (err, IsExistMobile) => 
                        {  
                            if (!err) 
                            { 
                                if(!IsExistMobile.length)
                                {
                                       
                                    var userMaster = new UserMaster({ 
                                       // _id : ObjectId(),
                                        firstName: req.body.firstName,
                                        lastName: req.body.lastName,
                                        middleName: req.body.middleName,
                                        emailAddress: req.body.emailAddress,
                                        mobileNo: req.body.mobileNo,
                                        DOB: req.body.DOB,
                                        genderId: req.body.genderId,
                                        image: null,
                                        userTypeId: ObjectId(req.body.userTypeId),
                                        isMobileNoVerified: false,
                                        userStatusId: constant.UserStatus.ActiveUser,
                                        isActive : true,
                                        isDeleted : false, 
                                        createdBy : null,//ObjectId(userId),
                                        createdDateTime : new Date(),
                                        updatedBy : null,
                                        updatedDateTime : null,
                                        password : req.body.password
                                    });
                    
                                    userMaster.save((err, userMasterDoc) => {
                                        if (!err) { 
                                            
                                           // console.log(userMasterDoc);

                                            //console.log(userMasterDoc._id);

                                            if(!userMasterDoc.length)
                                            {
                                                var userDetails = new UserDetails({ 
                                                    user_Id : ObjectId(userMasterDoc._id),
                                                    isActive : true,
                                                    isDeleted : false, 
                                                    createdBy : ObjectId(userMasterDoc._id),
                                                    createdDateTime : new Date(),
                                                    updatedBy : null,
                                                    updatedDateTime : null
                                                });
                                
                                                userDetails.save(async (err, userDetailsDoc) => {
                                                    if (!err) { 
                                                        
                                                        if(!userDetailsDoc.length)
                                                        {
                                                            //Data Retrieved Successfully 
                                                            addUpdateDeviceToken(userMasterDoc._id, req.headers.appid, req.headers.deviceid, req.body.deviceToken);
            
                                                            const tokgen = new TokenGenerator(256, TokenGenerator.BASE62);  
                                                            var loginToken = tokgen.generate();
                                                            addUpdateLoginToken(userMasterDoc._id, req.headers.appid, req.headers.deviceid, loginToken);
                                                                

                                                            await getWalletDetailsByUserId(userMasterDoc._id).then(async function (data){
                                                                // doc[0].walletBalance = data.CurrentBalance;
                                                                 console.log(data.CurrentBalance);
                                                                 console.log(data);
                                                               
                                                                 //appSetting.SystemConfiguration.APIBaseUrl + 
                                                                 userMasterDoc.image = appSetting.SystemConfiguration.UserDisplayImagePath + (userMasterDoc.image == null || userMasterDoc.image == "" ? appSetting.SystemConfiguration.UserDefaultImage : userMasterDoc._id +"/"+ userMasterDoc.image);

                                                                var EmailDetails = {
                                                                    languageid : req.headers.languageid,
                                                                    templateCode : constant.TemplateCode.WelcomeEmail,
                                                                    to : userMasterDoc.emailAddress,
                                                                    from : appSetting.Email.FromEmail, 
                                                                    userName : userMasterDoc.emailAddress,
                                                                    password : userMasterDoc.password,
                                                                    firstName : userMasterDoc.firstName,
                                                                    userTypeId : constant.UserType.Consumer
                                                                } 

                                                                // console.log("Email Send Details");
                                                                // console.log(EmailDetails);
                                                                // console.log("1");
                                                                // var IsSendEmail = await Helper.SendEmail(EmailDetails);
                                                                // console.log("2");
                                                                // console.log(IsSendEmail);

 

                                                                    var query = {
                                                                        language_Id : ObjectId(EmailDetails.languageid),
                                                                        templateCode : EmailDetails.templateCode, 
                                                                        isActive:  true, 
                                                                        isDeleted:  false 
                                                                    };
                                                                        
                                                                    console.log(query);

                                                                    TemplateLangDetails.find(query, async (err, templateLangDetails) => 
                                                                    {
                                                            
                                                                        console.log("======> " + templateLangDetails.length); 
                                                                        if (!err) 
                                                                        { 
                                                                            //console.log(doc);   
                                                                            console.log("Template Lang Details : ");
                                                                            console.log(templateLangDetails);
                                                                            
                                                                            if(templateLangDetails.length > 0 && templateLangDetails[0].emailSubject.length > 0 && templateLangDetails[0].emailBody.length > 0)
                                                                            { 

                                                                                console.log("START send email...");

                                                                                var emailBody = replaceString(templateLangDetails[0].emailBody, "@User@", EmailDetails.firstName );
                                                                                emailBody = replaceString(emailBody, "@UserName@", EmailDetails.userName );
                                                                                emailBody = replaceString(emailBody, "@Password@", EmailDetails.password );
                                                                            
                                                                                console.log("Email Send Details");
                                                                                console.log(EmailDetails);
                                                                                console.log("1");
                                                                                 
                                                                                var IsSendEmail = await Helper.SendEmail({ To : EmailDetails.to, From : EmailDetails.from, Subject : templateLangDetails[0].emailSubject, Body : emailBody });
                                                                                console.log("2");
                                                                                console.log(IsSendEmail);


                                                                            }
                                                                            else
                                                                            {
                                                                                console.log("Not found the template for send the email.");
                                                                                console.log('Error :' + JSON.stringify(err, undefined, 2));
                                                                                //res.send(ResponseDTO.ErrorMassage(constant.ErrorCode.InvalidLoginCredential, constant.ErrorMsg.InvalidLoginCredential, {} ) );
                                                                            }
                                                                            
                                                                        }
                                                                        else 
                                                                        { 
                                                                            console.log('Error :' + JSON.stringify(err, undefined, 2));
                                                                            //res.send(ResponseDTO.TechnicalError()); 
                                                                        }
                                                                    });
                                                                
                                                                



                                                                res.send(ResponseDTO.GetConsumerDetails(constant.ErrorCode.RegistrationSuccessfully, constant.ErrorMsg.RegistrationSuccessfully , userMasterDoc, userDetailsDoc, loginToken, data.CurrentBalance) );    
                                                                 
                                                             });

                                                            
                                                        }
                                                        else
                                                        {
                                                            //throw err;
                                                            res.send(ResponseDTO.TechnicalError()); 
                                                        }                                                        
                                                    }
                                                    else {  
                                                        //throw err;
                                                        res.send(ResponseDTO.TechnicalError()); 
                                                     }
                                                });   
                                            }
                                            else
                                            {
                                                //throw err;
                                                res.send(ResponseDTO.TechnicalError()); 
                                            }

 

                                        }
                                        else {  
                                            //throw err;
                                            res.send(ResponseDTO.TechnicalError()); 
                                         }
                                    });     

                                   
                                }
                                else
                                {
                                    res.send(ResponseDTO.ErrorMassage( constant.ErrorCode.MobileNoAlreadyExists, constant.ErrorMsg.MobileNoAlreadyExists, {} )); 
                                }
                            }
                            else
                            {
                                //throw err;
                                res.send(ResponseDTO.TechnicalError()); 
                            }
                        });
                        
                    }
                    else
                    {
                        res.send(ResponseDTO.ErrorMassage( constant.ErrorCode.EmailAlreadyExists, constant.ErrorMsg.EmailAlreadyExists, {} )); 
                    }
                }
                else
                {
                    //throw err;
                    res.send(ResponseDTO.TechnicalError()); 
                }

            });
        }
        else
        {
            res.send(ResponseDTO.InvalidParameter()); 
        }
 
        //Expire Device Token for Notification
       
       
    }

    
 
});

//For Consumer registration/Sign up //NV : Add Country
router.post('/SignUpV1', (req, res) => {

    console.log(req.body);
    if(req.body.countryId == undefined || req.body.countryId.trim() == "")
    {
        console.log("Missing countryId");
        res.send(ResponseDTO.InvalidParameter()); 
    }
    else if(req.body.firstName == undefined || req.body.lastName == undefined || req.body.middleName == undefined || req.body.emailAddress == undefined || req.body.mobileNo == undefined || req.body.DOB == undefined || req.body.genderId == undefined || req.body.userTypeId == undefined || !req.body.firstName.trim() || !req.body.userTypeId.trim() || !req.body.emailAddress.trim() || !req.body.mobileNo.trim() || req.body.DOB.trim() == "" || !req.body.genderId.trim() || req.body.deviceToken == undefined || req.body.deviceToken.trim() == "" || req.body.password == undefined || req.body.password.trim() == "" || !(req.body.genderId.trim() ==  constant.Gender.Secret || req.body.genderId.trim() == constant.Gender.Male || req.body.genderId.trim() ==  constant.Gender.Female))
    {
        res.send(ResponseDTO.InvalidParameter()); 
    } 
    else
    {  
        req.body.emailAddress = req.body.emailAddress.toLowerCase();
        console.log("Email Address : " + req.body.emailAddress);

        //console.log(req.body); 
        if(req.body.userTypeId == constant.UserType.Consumer && (req.body.genderId >= constant.Gender.Secret && req.body.genderId <= constant.Gender.Female)  )
        {
          
            UserMaster.find({emailAddress : req.body.emailAddress, isActive : true, isDeleted : false}, (err, IsExistEmailAddress) => 
            {                   
                if (!err) 
                { 
                    if(!IsExistEmailAddress.length)
                    {
                        UserMaster.find({mobileNo : req.body.mobileNo, isActive : true, isDeleted : false}, (err, IsExistMobile) => 
                        {  
                            if (!err) 
                            { 
                                if(!IsExistMobile.length)
                                {
                                       
                                    var userMaster = new UserMaster({ 
                                       // _id : ObjectId(),
                                        firstName: req.body.firstName,
                                        lastName: req.body.lastName,
                                        middleName: req.body.middleName,
                                        emailAddress: req.body.emailAddress,
                                        mobileNo: req.body.mobileNo,
                                        DOB: req.body.DOB,
                                        genderId: req.body.genderId,
                                        image: null,
                                        userTypeId: ObjectId(req.body.userTypeId),
                                        isMobileNoVerified: false,
                                        userStatusId: constant.UserStatus.ActiveUser,
                                        isActive : true,
                                        isDeleted : false, 
                                        createdBy : null,//ObjectId(userId),
                                        createdDateTime : new Date(),
                                        updatedBy : null,
                                        updatedDateTime : null,
                                        password : req.body.password,
                                        countryId: ObjectId(req.body.countryId)
                                    });
                    
                                    userMaster.save((err, userMasterDoc) => {
                                        if (!err) { 
                                            
                                           // console.log(userMasterDoc);

                                            //console.log(userMasterDoc._id);

                                            if(!userMasterDoc.length)
                                            {
                                                var userDetails = new UserDetails({ 
                                                    user_Id : ObjectId(userMasterDoc._id),
                                                    isActive : true,
                                                    isDeleted : false, 
                                                    createdBy : ObjectId(userMasterDoc._id),
                                                    createdDateTime : new Date(),
                                                    updatedBy : null,
                                                    updatedDateTime : null
                                                });
                                
                                                userDetails.save(async (err, userDetailsDoc) => {
                                                    if (!err) { 
                                                        
                                                        if(!userDetailsDoc.length)
                                                        {
                                                            //Data Retrieved Successfully 
                                                            addUpdateDeviceToken(userMasterDoc._id, req.headers.appid, req.headers.deviceid, req.body.deviceToken);
            
                                                            const tokgen = new TokenGenerator(256, TokenGenerator.BASE62);  
                                                            var loginToken = tokgen.generate();
                                                            addUpdateLoginToken(userMasterDoc._id, req.headers.appid, req.headers.deviceid, loginToken);
                                                                

                                                            await getWalletDetailsByUserId(userMasterDoc._id).then(async function (data){
                                                                // doc[0].walletBalance = data.CurrentBalance;
                                                                 console.log(data.CurrentBalance);
                                                                 console.log(data);
                                                               
                                                                 //appSetting.SystemConfiguration.APIBaseUrl + 
                                                                 userMasterDoc.image = appSetting.SystemConfiguration.UserDisplayImagePath + (userMasterDoc.image == null || userMasterDoc.image == "" ? appSetting.SystemConfiguration.UserDefaultImage : userMasterDoc._id +"/"+ userMasterDoc.image);

                                                                var EmailDetails = {
                                                                    languageid : req.headers.languageid,
                                                                    templateCode : constant.TemplateCode.WelcomeEmail,
                                                                    to : userMasterDoc.emailAddress,
                                                                    from : appSetting.Email.FromEmail, 
                                                                    userName : userMasterDoc.emailAddress,
                                                                    password : userMasterDoc.password,
                                                                    firstName : userMasterDoc.firstName,
                                                                    userTypeId : constant.UserType.Consumer
                                                                } 

                                                                // console.log("Email Send Details");
                                                                // console.log(EmailDetails);
                                                                // console.log("1");
                                                                // var IsSendEmail = await Helper.SendEmail(EmailDetails);
                                                                // console.log("2");
                                                                // console.log(IsSendEmail);

 

                                                                    var query = {
                                                                        language_Id : ObjectId(EmailDetails.languageid),
                                                                        templateCode : EmailDetails.templateCode, 
                                                                        isActive:  true, 
                                                                        isDeleted:  false 
                                                                    };
                                                                        
                                                                    console.log(query);

                                                                    TemplateLangDetails.find(query, async (err, templateLangDetails) => 
                                                                    {
                                                            
                                                                        console.log("======> " + templateLangDetails.length); 
                                                                        if (!err) 
                                                                        { 
                                                                            //console.log(doc);   
                                                                            console.log("Template Lang Details : ");
                                                                            console.log(templateLangDetails);
                                                                            
                                                                            if(templateLangDetails.length > 0 && templateLangDetails[0].emailSubject.length > 0 && templateLangDetails[0].emailBody.length > 0)
                                                                            { 

                                                                                console.log("START send email...");

                                                                                var emailBody = replaceString(templateLangDetails[0].emailBody, "@User@", EmailDetails.firstName );
                                                                                emailBody = replaceString(emailBody, "@UserName@", EmailDetails.userName );
                                                                                emailBody = replaceString(emailBody, "@Password@", EmailDetails.password );
                                                                            
                                                                                console.log("Email Send Details");
                                                                                console.log(EmailDetails);
                                                                                console.log("1");
                                                                                 
                                                                                var IsSendEmail = await Helper.SendEmail({ To : EmailDetails.to, From : EmailDetails.from, Subject : templateLangDetails[0].emailSubject, Body : emailBody });
                                                                                console.log("2");
                                                                                console.log(IsSendEmail);


                                                                            }
                                                                            else
                                                                            {
                                                                                console.log("Not found the template for send the email.");
                                                                                console.log('Error :' + JSON.stringify(err, undefined, 2));
                                                                                //res.send(ResponseDTO.ErrorMassage(constant.ErrorCode.InvalidLoginCredential, constant.ErrorMsg.InvalidLoginCredential, {} ) );
                                                                            }
                                                                            
                                                                        }
                                                                        else 
                                                                        { 
                                                                            console.log('Error :' + JSON.stringify(err, undefined, 2));
                                                                            //res.send(ResponseDTO.TechnicalError()); 
                                                                        }
                                                                    });
                                                                
                                                                



                                                                res.send(ResponseDTO.GetConsumerDetails(constant.ErrorCode.RegistrationSuccessfully, constant.ErrorMsg.RegistrationSuccessfully , userMasterDoc, userDetailsDoc, loginToken, data.CurrentBalance) );    
                                                                 
                                                             });

                                                            
                                                        }
                                                        else
                                                        {
                                                            //throw err;
                                                            res.send(ResponseDTO.TechnicalError()); 
                                                        }                                                        
                                                    }
                                                    else {  
                                                        //throw err;
                                                        res.send(ResponseDTO.TechnicalError()); 
                                                     }
                                                });   
                                            }
                                            else
                                            {
                                                //throw err;
                                                res.send(ResponseDTO.TechnicalError()); 
                                            }

 

                                        }
                                        else {  
                                            //throw err;
                                            res.send(ResponseDTO.TechnicalError()); 
                                         }
                                    });     

                                   
                                }
                                else
                                {
                                    res.send(ResponseDTO.ErrorMassage( constant.ErrorCode.MobileNoAlreadyExists, constant.ErrorMsg.MobileNoAlreadyExists, {} )); 
                                }
                            }
                            else
                            {
                                //throw err;
                                res.send(ResponseDTO.TechnicalError()); 
                            }
                        });
                        
                    }
                    else
                    {
                        res.send(ResponseDTO.ErrorMassage( constant.ErrorCode.EmailAlreadyExists, constant.ErrorMsg.EmailAlreadyExists, {} )); 
                    }
                }
                else
                {
                    //throw err;
                    res.send(ResponseDTO.TechnicalError()); 
                }

            });
        }
        else
        {
            res.send(ResponseDTO.InvalidParameter()); 
        }
 
        //Expire Device Token for Notification
       
       
    }

    
 
});


//For Provider registration/Sign up From Application Side  --> Create Provider Details (Application Side Registration of Provider) -- Done - Email
router.post('/SignUpProvider', (req, res) => {

    console.log(req.body);
    var subCategory = null;

    if(req.body.subCategoryId == undefined || !req.body.subCategoryId.trim())
    { 
        subCategory = null;
    }
    else
    {
        subCategory = ObjectId(req.body.subCategoryId);
    }
 

    if(req.body.firstName == undefined || req.body.lastName == undefined || req.body.middleName == undefined || req.body.emailAddress == undefined || req.body.mobileNo == undefined || req.body.DOB == undefined || req.body.genderId == undefined || req.body.userTypeId == undefined || !req.body.firstName.trim() || !req.body.userTypeId.trim() || !req.body.emailAddress.trim() || !req.body.mobileNo.trim() || req.body.userTypeId != constant.UserType.Provider || (req.body.genderId < constant.Gender.Secret || req.body.genderId > constant.Gender.Female) || req.body.password == undefined || !req.body.password.trim() ||req.body.deviceToken == undefined || req.body.deviceToken.trim() == "")
    {
        //User Master 
        console.log("Invalid User Master Or Device Token");
        res.send(ResponseDTO.InvalidParameter()); 
    } 
    else if(req.body.experience == undefined || req.body.categoryId == undefined || req.body.degree == undefined || req.body.price == undefined || req.body.experience < 0 || req.body.price < 0 || req.body.degree.length < 1 || req.body.language == undefined || req.body.language.length < 1 || !req.body.categoryId.trim())
    { 
        //Provider Details
        console.log("Invalid Provider Details");
        res.send(ResponseDTO.InvalidParameter());  
    } 
    else if(req.body.description == undefined || req.body.description.length < 2)
    {
        //Description Details
        console.log("Invalid Description Details");
        res.send(ResponseDTO.InvalidParameter())
    }
    else if(req.body.price % 1 != 0)
    {
        console.log("Invalid Price.")
        res.send(ResponseDTO.InvalidParameter()); 
    } 
    else if(!(req.body.price <= 15 && req.body.price >= 1))
    {
        console.log("Price must be 1 KD to 15 KD.")
        res.send(ResponseDTO.InvalidParameter()); 
    }
    else
    {  

        req.body.emailAddress = req.body.emailAddress.toLowerCase();
        console.log("Email Address : " + req.body.emailAddress);        
 
        //console.log(req.body); 
        // if(req.body.userTypeId == constant.UserType.Provider && (req.body.genderId >= constant.Gender.Secret && req.body.genderId <= constant.Gender.Female)  )
        // {
            

        CategoryMasters.find({ _id : ObjectId(req.body.categoryId), isDeleted : false }, (err, categoryMastersDoc)  => 
        {   
            console.log("Check CategoryMasters"); 
            console.log("NoOfUseAsSubCategory : " + categoryMastersDoc.length); 
            
            if(!err)
            {   
                if(categoryMastersDoc.length > 0)
                {


                    if(categoryMastersDoc[0].hasSubCategory == true && subCategory == null)
                    { 
                        console.log("Missing sub category Id");
                        res.send(ResponseDTO.InvalidParameter()); 
                        //res.send(ResponseDTO.ErrorMassage( constant.ErrorCode.NotDeleteUseCategory, constant.ErrorMsg.NotDeleteUseCategory, {} )); 
                    } 
                    else if(categoryMastersDoc[0].hasSubCategory == false && subCategory != null)
                    { 
                        console.log("Not Sub category of parent category. so no need to sub category");
                        res.send(ResponseDTO.InvalidParameter()); 
                        //res.send(ResponseDTO.ErrorMassage( constant.ErrorCode.NotDeleteUseCategory, constant.ErrorMsg.NotDeleteUseCategory, {} )); 
                    } 
                    else
                    {
                        UserMaster.find({emailAddress : req.body.emailAddress, isActive : true, isDeleted : false}, (err, IsExistEmailAddress) => 
                        {                   
                            if (!err) 
                            { 
                                if(!IsExistEmailAddress.length)
                                {
                                    UserMaster.find({mobileNo : req.body.mobileNo, isActive : true, isDeleted : false}, (err, IsExistMobile) => 
                                    {  
                                        if (!err) 
                                        { 
                                            if(!IsExistMobile.length)
                                            {
                                                    
                                                var userMaster = new UserMaster({ 
                                                    // _id : ObjectId(),
                                                    firstName: req.body.firstName,
                                                    lastName: req.body.lastName,
                                                    middleName: req.body.middleName,
                                                    emailAddress: req.body.emailAddress,
                                                    mobileNo: req.body.mobileNo,
                                                    DOB: req.body.DOB,
                                                    genderId: req.body.genderId,
                                                    image: null,
                                                    userTypeId: ObjectId(req.body.userTypeId),
                                                    isMobileNoVerified: false,
                                                    userStatusId: constant.UserStatus.NotApproveByAdmin,
                                                    isActive : true,
                                                    isDeleted : false, 
                                                    createdBy : null, //ObjectId(req.headers.userid),
                                                    createdDateTime : new Date(),
                                                    updatedBy : null,
                                                    updatedDateTime : null,

                                                    password : req.body.password
                                                });
                                
                                                userMaster.save((err, userMasterDoc) => { 
                                                        if (!err) { 
                                                        
                                                        // console.log(userMasterDoc);

                                                        //console.log(userMasterDoc._id);

                                                        var providerDetail = new ProviderDetails({ 
                                                            user_Id : ObjectId(userMasterDoc._id),
                                                            experience : req.body.experience,
                                                            categoryId : ObjectId(req.body.categoryId),
                                                            subCategoryId : subCategory,//ObjectId(req.body.subCategoryId),
                                                            degree : req.body.degree,  
                                                            price : req.body.price, 
                                                            commissionPercentage : null,
                                                            isActive : true,
                                                            isDeleted : false, 
                                                            createdBy : null,//ObjectId(req.headers.userid),
                                                            createdDateTime : new Date(),
                                                            updatedBy : null,
                                                            updatedDateTime : null,

                                                            language : req.body.language,
                                                        });
                                        
                                                        providerDetail.save((err, providerDetailsDoc) => { 
                                                            
                                                            if (!err) 
                                                            {  

                                                                var providerlangdetails = [];

                                                                req.body.description.forEach(function(item){

                                                                    var providerlangdetail = new ProviderLangDetails({  
                                                                        language_Id :  ObjectId(item.language_Id),
                                                                        providerdetails_Id : ObjectId(providerDetailsDoc._id),
                                                                        description : item.description,
                                                                        isActive : true,
                                                                        isDeleted : false, 
                                                                        createdBy : null, //ObjectId(req.headers.userid),
                                                                        createdDateTime : new Date(),
                                                                        updatedBy : null,
                                                                        updatedDateTime : null  
                                                                    });

                                                                    providerlangdetails.push(providerlangdetail);

                                                                });

                                                                //console.log(providerlangdetails);

                                                                ProviderLangDetails.insertMany(providerlangdetails, (err, providerlangdetailsDoc) => {
                                                                    if (!err) {  

                                                                        //Data Retrieved Successfully 
                                                                        addUpdateDeviceToken(userMasterDoc._id, req.headers.appid, req.headers.deviceid, req.body.deviceToken);
                
                                                                        const tokgen = new TokenGenerator(256, TokenGenerator.BASE62);  
                                                                        var loginToken = tokgen.generate();
                                                                        addUpdateLoginToken(userMasterDoc._id, req.headers.appid, req.headers.deviceid, loginToken);
                                                                    

                                                                        var EmailDetails = {
                                                                            languageid : req.headers.languageid,
                                                                            templateCode : constant.TemplateCode.WelcomeEmail,
                                                                            to : userMasterDoc.emailAddress,
                                                                            from : appSetting.Email.FromEmail, 
                                                                            userName : userMasterDoc.emailAddress,
                                                                            password : userMasterDoc.password,
                                                                            firstName : userMasterDoc.firstName,
                                                                            userTypeId : constant.UserType.Provider
                                                                        } 


                                                                        var query = {
                                                                            language_Id : ObjectId(EmailDetails.languageid),
                                                                            templateCode : EmailDetails.templateCode, 
                                                                            isActive:  true, 
                                                                            isDeleted:  false 
                                                                        };
                                                                            
                                                                        console.log(query);

                                                                        TemplateLangDetails.find(query, async (err, templateLangDetails) => 
                                                                        {
                                                                
                                                                            console.log("======> " + templateLangDetails.length); 
                                                                            if (!err) 
                                                                            { 
                                                                                //console.log(doc);   
                                                                                console.log("Template Lang Details : ");
                                                                                console.log(templateLangDetails);
                                                                                
                                                                                if(templateLangDetails.length > 0 && templateLangDetails[0].emailSubject.length > 0 && templateLangDetails[0].emailBody.length > 0)
                                                                                { 
                                                                                    SystemConfigurations.find({isActive : true, isDeleted : false}, async (err,  systemConfigurationsDoc) =>
                                                                                    {    
                                                                                        console.log(systemConfigurationsDoc);
                                                                                        if(!err)
                                                                                        {   
                                                                                            if(systemConfigurationsDoc.length > 0)
                                                                                            {
                                                                                                console.log("START send email...");

                                                                                                var emailBody = replaceString(templateLangDetails[0].emailBody, "@User@", EmailDetails.firstName );
                                                                                                emailBody = replaceString(emailBody, "@UserName@", EmailDetails.userName );
                                                                                                emailBody = replaceString(emailBody, "@Password@", EmailDetails.password );
                                                                                            
                                                                                                console.log("Email Send Details");
                                                                                                console.log(EmailDetails);
                                                                                                console.log("1");
                                                                                                
                                                                                                var IsSendEmail = await Helper.SendEmail({ To : [EmailDetails.to, systemConfigurationsDoc[0].admin_email_address_for_notify ], From : EmailDetails.from, Subject : templateLangDetails[0].emailSubject, Body : emailBody });
                                                                                                console.log("2");
                                                                                                console.log(IsSendEmail); 
                                                                                            }
                                                                                            else
                                                                                            {
                                                                                                res.send(ResponseDTO.TechnicalError());  
                                                                                            }
                                                                                            
                                                                                        }
                                                                                        else
                                                                                        {
                                                                                            //throw err;
                                                                                            res.send(ResponseDTO.TechnicalError());  
                                                                                        }
                                                                                    }).sort({ _id : -1}).limit(1);

                                                                                }
                                                                                else
                                                                                {
                                                                                    console.log("Not found the template for send the email.");
                                                                                    console.log('Error :' + JSON.stringify(err, undefined, 2));
                                                                                    //res.send(ResponseDTO.ErrorMassage(constant.ErrorCode.InvalidLoginCredential, constant.ErrorMsg.InvalidLoginCredential, {} ) );
                                                                                }
                                                                                
                                                                            }
                                                                            else 
                                                                            { 
                                                                                console.log('Error :' + JSON.stringify(err, undefined, 2));
                                                                                //res.send(ResponseDTO.TechnicalError()); 
                                                                            }
                                                                        });                                                          
                                                                        
                                                                        console.log(providerlangdetailsDoc.length);
                                                                        res.send(ResponseDTO.DataRetrievedSuccessfully(constant.ErrorCode.ProviderRegistrationSuccessfully, constant.ErrorMsg.ProviderRegistrationSuccessfully, { userId : userMasterDoc._id, userTypeId : userMasterDoc.userTypeId, loginToken : loginToken, userStatusId : userMasterDoc.userStatusId } ) );
                                                                                                            
                                                                    }
                                                                    else {  
                                                                        //console.log("7");
                                                                        //throw err;
                                                                        res.send(ResponseDTO.TechnicalError()); 
                                                                    }
                                                                });                                                               
                                                        
                                                            }
                                                            else {  
                                                                //console.log("5");
                                                                //throw err;
                                                                res.send(ResponseDTO.TechnicalError()); 
                                                                }
                                                        });   
                                                            
                                                    }
                                                    else { 
                                                        //console.log("3"); 
                                                        //throw err;
                                                        res.send(ResponseDTO.TechnicalError()); 
                                                        }
                                                });     

                                            }
                                            else
                                            {
                                                res.send(ResponseDTO.ErrorMassage( constant.ErrorCode.MobileNoAlreadyExists, constant.ErrorMsg.MobileNoAlreadyExists, {} )); 
                                            }
                                        }
                                        else
                                        {
                                            //console.log("2");
                                            //throw err;
                                            res.send(ResponseDTO.TechnicalError()); 
                                        }
                                    });
                                    
                                }
                                else
                                {
                                    res.send(ResponseDTO.ErrorMassage( constant.ErrorCode.EmailAlreadyExists, constant.ErrorMsg.EmailAlreadyExists, {} )); 
                                }
                            }
                            else
                            {
                                //console.log("1");
                                //throw err;
                                res.send(ResponseDTO.TechnicalError()); 
                            } 
                        });
                    }

                    
                }
                else
                {
                    console.log("Invalid category Id");
                    res.send(ResponseDTO.InvalidParameter()); 
                }
            }
            else
            {
                res.send(ResponseDTO.TechnicalError());
            } 
        });
    }
 
});


//Login API For Consumer and Provider -- Done -Email
router.post('/SignIn', (req, res) => {
    //  console.log(req.body);
    
  
      if(req.body.emailAddress == undefined || req.body.password == undefined || req.body.deviceToken == undefined || req.body.deviceToken.trim() == "" || req.body.emailAddress.trim() == "" || req.body.password.trim() == "")
      {
          res.send(ResponseDTO.InvalidParameter()); 
      }
      else
      {  

        req.body.emailAddress = req.body.emailAddress.toLowerCase();
        console.log("Email Address : " + req.body.emailAddress);
    
            var query = {
                emailAddress : req.body.emailAddress,
                password : req.body.password,
                isActive : true,
                isDeleted : false 
            };
            
            console.log(query); 

            var sort = [ ["_id", -1] ];
            var limit = 1;
            
            UserMaster.find(query, (err, userMaster) => 
            {
                if (!err) 
                { 
                    console.log(userMaster);   
                    if(userMaster.length > 0)
                    { 
                   
                        // console.log(userMaster[0].userTypeId);
                        // console.log(constant.UserType.Provider);
                        // if(userMaster[0].userStatusId == constant.UserStatus.NotApproveByAdmin)
                        // {   
                        //     res.send(ResponseDTO.GetLoginDetails(constant.ErrorCode.NotApproveByAdmin, constant.ErrorMsg.NotApproveByAdmin, 
                        //         { 
                        //             // userId : "", 
                        //             // userTypeId: "", 
                        //             // loginToken : "" 
                        //         }) 
                        //     );
                        // }
                        if(userMaster[0].userStatusId == constant.UserStatus.BlockUser)
                        {
                            res.send(ResponseDTO.GetLoginDetails(constant.ErrorCode.BlockUserByAdmin, constant.ErrorMsg.BlockUserByAdmin, 
                                { 
                                    // userId : "", 
                                    // userTypeId: "", 
                                    // loginToken : "" 
                                }) 
                            );
                        }
                        else if(userMaster[0].userStatusId == constant.UserStatus.ActiveUser || userMaster[0].userStatusId == constant.UserStatus.NotApproveByAdmin)
                        {
  
                            //Data Retrieved Successfully 
                            addUpdateDeviceToken(userMaster[0]._id, req.headers.appid, req.headers.deviceid, req.body.deviceToken);

                            const tokgen = new TokenGenerator(256, TokenGenerator.BASE62);  
                            var loginToken = tokgen.generate();
                            addUpdateLoginToken(userMaster[0]._id, req.headers.appid, req.headers.deviceid, loginToken);

                            res.send(ResponseDTO.GetLoginDetails(constant.ErrorCode.LoginSuccessfully, constant.ErrorMsg.LoginSuccessfully,
                                { 
                                    userId : userMaster[0]._id, 
                                    userTypeId: userMaster[0].userTypeId, 
                                    loginToken : loginToken,
                                    userStatusId : userMaster[0].userStatusId
                                }) 
                            );
             
                        } 
                        else
                        {
                            //Admin can create a/c with Provider Consumer // 
                            console.log("Invalid Login 1");   
                            res.send(ResponseDTO.GetLoginDetails(constant.ErrorCode.InvalidLogin, constant.ErrorMsg.InvalidLogin, 
                                { 
                                    // userId : "", 
                                    // userTypeId: "", 
                                    // loginToken : "" 
                                }) 
                            );
                        } 
                     
                    }
                    else
                    { 
                        console.log("Invalid Login 2");  
                        res.send(ResponseDTO.GetLoginDetails(constant.ErrorCode.InvalidLogin, constant.ErrorMsg.InvalidLogin, 
                            { 
                                // userId : "", 
                                // userTypeId: "", 
                                // loginToken : "" 
                            }) 
                        );
                    }
                
                }
                else 
                { 
                    console.log('Error :' + JSON.stringify(err, undefined, 2));
                    res.send(ResponseDTO.TechnicalError()); 
                }
            }).sort(sort).limit(limit);
        
             
      }
   
});


//Change Password API For Consumer and Provider --Done -Email
router.post('/ChangePassword', (req, res) => { 
  
    if(req.body.emailAddress == undefined || req.body.oldPassword == undefined || req.body.newPassword == undefined || req.body.emailAddress.trim() == "" || req.body.oldPassword.trim() == "" || req.body.newPassword.trim() == "" || req.body.newPassword == req.body.oldPassword || req.body.userTypeId == undefined || req.body.userTypeId.trim() == ""  )
    {
        res.send(ResponseDTO.InvalidParameter()); 
    }
    else
    {   
          
        req.body.emailAddress = req.body.emailAddress.toLowerCase();
        console.log("Email Address : " + req.body.emailAddress);

        UserMaster.updateOne(
        {_id : ObjectId(req.headers.userid), emailAddress : req.body.emailAddress, userTypeId : ObjectId(req.body.userTypeId), password : req.body.oldPassword, isActive : true, isDeleted : false}, 
        { $set: {password: req.body.newPassword, updatedBy: ObjectId(req.headers.userid), updatedDateTime : new Date() } }, 
        function(err, userMaster) 
        {
            if (!err)
            {
                console.log(userMaster);   
                if(userMaster.nModified == 1)
                { 
                    console.log("Password change successfully.");
                    res.send(ResponseDTO.CommonResponse(constant.ErrorCode.ChangePasswordSuccessfully, constant.ErrorMsg.ChangePasswordSuccessfully, { })); 
                }
                else
                {
                    console.log("Password not change.");
                    res.send(ResponseDTO.CommonResponse(constant.ErrorCode.NotChangePassword, constant.ErrorMsg.NotChangePassword, { }));                     
                }
            }
            else
            {
                console.log('Error :' + JSON.stringify(err, undefined, 2));
                res.send(ResponseDTO.TechnicalError()); 
            } 
        }); 
 
    }
 
});


//Forgot Password API For Consumer and Provider --Done -Email
router.post('/ForgotPassword', (req, res) => { 
  
    if(req.body.emailAddress == undefined || req.body.emailAddress.trim() == "" )
    {
        res.send(ResponseDTO.InvalidParameter()); 
    }
    else
    {    

        req.body.emailAddress = req.body.emailAddress.toLowerCase();
        console.log("Email Address : " + req.body.emailAddress);


        var query = {
            emailAddress : req.body.emailAddress, 
            isActive : true,
            isDeleted : false 
        };
        
        var sort = [ ["_id", -1] ];
        var limit = 1;
        
        UserMaster.find(query, (err, userMaster) => 
        {
            if (!err) 
            { 
                console.log(userMaster);   
                if(userMaster.length > 0)
                { 
                
                    var EmailDetails = {
                        languageid : req.headers.languageid,
                        templateCode : constant.TemplateCode.ForgotPasswordEmail,
                        to : req.body.emailAddress,
                        from : appSetting.Email.FromEmail, 
                        userName : userMaster[0].emailAddress,
                        password : userMaster[0].password,
                        firstName : userMaster[0].firstName
                    }  
            
             
                        var query = {
                            language_Id : ObjectId(EmailDetails.languageid),
                            templateCode : EmailDetails.templateCode, 
                            isActive:  true, 
                            isDeleted:  false 
                        };
                            
                        console.log(query);
            
                        TemplateLangDetails.find(query, async (err, templateLangDetails) => 
                        {
                
                            console.log("======> " + templateLangDetails.length); 
                            if (!err) 
                            { 
                                //console.log(doc);   
                                console.log("Template Lang Details : ");
                                console.log(templateLangDetails);
                                
                                if(templateLangDetails.length > 0 && templateLangDetails[0].emailSubject.length > 0 && templateLangDetails[0].emailBody.length > 0)
                                { 
            
                                    console.log("START send email...");
            
                                    var emailBody = replaceString(templateLangDetails[0].emailBody, "@User@", EmailDetails.firstName );
                                    emailBody = replaceString(emailBody, "@UserName@", EmailDetails.userName );
                                    emailBody = replaceString(emailBody, "@Password@", EmailDetails.password );
                                
                                    console.log("Email Send Details");
                                    console.log(EmailDetails);
                                    console.log("1"); 
                                    var IsSendEmail = await Helper.SendEmail({ To : EmailDetails.to, From : EmailDetails.from, Subject : templateLangDetails[0].emailSubject, Body : emailBody });
                                    console.log("2");
                                    console.log(IsSendEmail);

                                    if(IsSendEmail == true)
                                    {
                                        res.send(ResponseDTO.CommonResponse(constant.ErrorCode.ForgotPasswordEmailSendSuccessfully, constant.ErrorMsg.ForgotPasswordEmailSendSuccessfully, { }) );
                                    }
                                    else
                                    {
                                        res.send(ResponseDTO.CommonResponse(constant.ErrorCode.ForgotPasswordEmailFailed, constant.ErrorMsg.ForgotPasswordEmailFailed, { }) );
                                    }
             
                                }
                                else
                                {
                                    console.log("Not found the template for send the email.");
                                    console.log('Error :' + JSON.stringify(err, undefined, 2));
                                    res.send(ResponseDTO.TechnicalError()); 
                                }
                                
                            }
                            else 
                            { 
                                console.log('Error :' + JSON.stringify(err, undefined, 2));
                                res.send(ResponseDTO.TechnicalError()); 
                            }
                        });



                    
                 
                }
                else
                { 
                    console.log("Invalid email address");  
                    res.send(ResponseDTO.CommonResponse(constant.ErrorCode.InvalidEmailAddress, constant.ErrorMsg.InvalidEmailAddress, {}));
                }
            
            }
            else 
            { 
                console.log('Error :' + JSON.stringify(err, undefined, 2));
                res.send(ResponseDTO.TechnicalError()); 
            }
        }).sort(sort).limit(limit);


 
 
    }
 
});



// For Logout
router.post('/Logout', (req, res) => {

    if(req.body.userId == undefined)
    {
        res.send(ResponseDTO.InvalidParameter()); 
    }
    else
    {  
        //Expire Device Token for Notification
        DeviceTokenMasters.find({ user_Id: req.body.userId, appId : req.headers.appid, deviceId : req.headers.deviceid },(err, deviceTokenMasters) => 
        {  
            if(!err)
            {
                if(deviceTokenMasters.length)
                {
                    //Update
                    DeviceTokenMasters.updateOne({ user_Id: req.body.userId, appId : req.headers.appid, deviceId : req.headers.deviceid }, { $set: { isActive : false } }, function(err, res) {
                        if (err) throw err;
                        console.log("Expire Device Token"); 
                      }); 
                }
               
            }
    
        });         

        //Expire Login Token
        LoginToken.find({ user_Id: req.body.userId, appId : req.headers.appid, deviceId : req.headers.deviceid }, (err, loginTokenDetails)  => 
        {  
            if(!err)
            {
                if(loginTokenDetails.length)
                {
                    //Update
                    LoginToken.updateOne({ user_Id: req.body.userId, appId : req.headers.appid, deviceId : req.headers.deviceid }, { $set: { isActive : false } }, function(err, res) {
                        if (err) throw err;
                        console.log("Expire Login Token"); 
                      }); 
                } 
            }
    
        }); 

    }

    res.send(ResponseDTO.ErrorMassage( constant.ErrorCode.LogoutSuccessfully, constant.ErrorMsg.LogoutSuccessfully, {} ));

 
});



// For Consumer Profile Details //NV : Add Country
router.post('/ConsumerProfileDetails', (req, res) => {
 
      if(req.body.userId == undefined || req.body.userId.trim() == "")
      {
          res.send(ResponseDTO.InvalidParameter()); 
      }
      else
      {   

        UserMaster.count({_id : ObjectId(req.body.userId), isActive : true, isDeleted : true }, (err, IsUserExist) => {

            if(!err)
            {
                if(IsUserExist > 0)
                {
                    res.send(ResponseDTO.ErrorMassage(constant.ErrorCode.DeletedUser, constant.ErrorMsg.DeletedUser , {} )); 
                }
                else
                {
 
                    var pipeline = [
                    {
                        $project: 
                        {
                            "_id": 0,
                            "um": "$$ROOT"
                        }
                    }, 
                    {
                        $lookup: 
                        {
                            "localField": "um._id",
                            "from": "userdetails",
                            "foreignField": "user_Id",
                            "as": "consumerDetails"
                        }
                    }, 
                    {
                        $unwind: 
                        {
                            "path": "$consumerDetails",
                            "preserveNullAndEmptyArrays": true
                        }
                    }, 
                    {
                        $lookup: {
                            // localField: "um.countryId",
                            // from: "countrylangmasters",
                            // foreignField: "user_Id",
                            // as: "clm"
                            from: "countrylangmasters",
                            //localField: "_id",
                            //foreignField: "provider_user_Id",
        
                            let: { countryId: "$um.countryId", languageId: ObjectId(req.headers.languageid) }, //, order_qty: "$ordered" 
                            pipeline: [
                                { 
                                    $match:
                                    {  
                                        $expr:
                                        { 
                                            $and:
                                            [ 
                                                { $eq: [ "$countrymaster_id",  "$$countryId" ] },
                                                { $eq: [ "$language_id",  "$$languageId" ] },
                                                { $eq: [ "$isActive", true ] },
                                                //{ $eq: [ "$isDeleted", false ] },   
                                            ],                          
                                        }
                                    }
                                },  
                                { 
                                    $project: 
                                    {   
                                        countryId : "$countrymaster_id",
                                        countryName : "$countryName",
                                        _id : 0 
                                    } 
                                }
                            ],   
        
                            as: "clm"                            
                        }
                    }, 
                    // {
                    //     $unwind: {
                    //         path: "$clm",
                    //         preserveNullAndEmptyArrays: true
                    //     }
                    // }, 
                    {
                        $match: {
                            "um.isActive": true,
                            "um.isDeleted": false,
                            "consumerDetails.isActive": true,
                            "consumerDetails.isDeleted": false,
                            "um._id": ObjectId(req.body.userId),
                            // "lt.isActive": true,
                            // "lt.isDeleted": false,
                            // "lt.appId": Long.fromString("1"),
                            // "lt.deviceId": "5QmlE78Fzq59duwTclscMuIK1haksv7j55QlTbE3S" 
                        }
                    }, 
                    {
                        $project: {
                            "_id": 0,
                            "userId": "$um._id",
                            "firstName": "$um.firstName",
                            "lastName": "$um.lastName",
                            "middleName": "$um.middleName",
                            "emailAddress": "$um.emailAddress",
                            "mobileNo": "$um.mobileNo",
                            "DOB": "$um.DOB",
                            "currentDateTime" : new Date(),
                            //"age" : "",//"$um.DOB".split('-', 3) ,
                            //{ $split: [ "$um.DOB", 'T' ] } ,
                            //{ $arrayElemAt: [{ $split: [ "$um.DOB", "T" ] }, 0] },
                            //{ $first: { $split: [ "$um.DOB", "T" ] } } ,
                            //split('$um.DOB', { separator: ',' })[0]  , //new AgeFromDateString('1999-05-29').age + "",  
                            "genderId": "$um.genderId",
                            "image": //"$um.image",
                            {
                                $concat: 
                                [
                                    //appSetting.SystemConfiguration.APIBaseUrl, 
                                    appSetting.SystemConfiguration.UserDisplayImagePath,
                                    {
                                        $cond: 
                                        { 
                                            if: 
                                            { 
                                                $or : [{
                                                    $eq: [ "$um.image", null ] 
                                                },
                                                {
                                                    $eq: [ "$um.image", "" ] 
                                                }] 
                                            }, 
                                            then: appSetting.SystemConfiguration.UserDefaultImage, 
                                            else: 
                                            { 
                                                $concat: 
                                                [ 
                                                    { 
                                                        $convert: 
                                                        { 
                                                            input: "$um._id", to: "string" 
                                                        } 
                                                    }, "/", "$um.image" 
                                                ]
                                            }
                                        }               
                                    }
                                ]
                            },  
                            "userTypeId": "$um.userTypeId",
                            //"isMobileNoVerified": "$um.isMobileNoVerified",
                            //"userStatusId": "$um.userStatusId",
                            "createdDateTime": "$um.createdDateTime",
                            "loginToken": "",
                            "walletBalance" : "0", 
                            "currencySymbol" : constant.CurrencySymbol.Kuwait,
                            "consumerDetails" : {
                                "consumerDetailsId": "$consumerDetails._id" 
                            },
                            "country" : 
                            {
                                $cond: [ { $eq: ["$clm", [] ] }, 
                                { 
                                    countryId : "",
                                    countryName : "" 
                                }, 
                                {
                                    $arrayElemAt:[ "$clm", 0]
                                }] 
                            },    
                        }
                    }
                ];
                
                    //await getTotalPurchasesAndConsumptionsByUserId(req.body.userId).then(function(data){
            
                    
                    UserMaster.aggregate(pipeline, async function(err, doc){
                    console.log(doc);

                        if(doc.length > 0)
                        {
                            await getWalletDetailsByUserId(req.body.userId).then(function(data){
                                doc[0].walletBalance = data.CurrentBalance;
                                console.log(data.CurrentBalance);
                                console.log(doc);
                                //console.log(new AgeFromDate(new Date(1987, 0, 8)).age);
                                //console.log(split('a.b,c', { separator: ',' })[0]);
                                res.send(ResponseDTO.ErrorMassage(constant.ErrorCode.DataRetrievedSuccessfully, constant.ErrorMsg.DataRetrievedSuccessfully , doc[0] ));
                            });
                        }
                        else
                        {
                            res.send(ResponseDTO.ErrorMassage(constant.ErrorCode.DataRetrievedSuccessfully, constant.ErrorMsg.DataRetrievedSuccessfully , {} ));
                        }
                        
                    });
            
                
                }
            }
            else
            {
                res.send(ResponseDTO.TechnicalError()); 
            }

        });
 
      }
   
});




// For Consumer Update Profile Details -- Done - Email 
router.post('/ConsumerUpdateProfile', (req, res) => {

    if(req.body.userId == undefined || req.body.firstName == undefined || req.body.lastName == undefined || req.body.middleName == undefined || req.body.emailAddress == undefined || req.body.DOB == undefined || req.body.genderId == undefined || !req.body.firstName.trim() || req.body.emailAddress.trim() == "" )
    {
        res.send(ResponseDTO.InvalidParameter()); 
    }
    else
    {   

        req.body.emailAddress = req.body.emailAddress.toLowerCase();
        console.log("Email Address : " + req.body.emailAddress);        

        var query = {
            "$and": [
                {
                    "_id": {
                        "$ne": ObjectId(req.body.userId)
                    }
                },
                {
                    "emailAddress": req.body.emailAddress
                },
                {
                    "isActive": true
                },
                {
                    "isDeleted": false
                },
                {
                    "emailAddress": {
                        "$ne": ""
                    }
                }
            ]
        };


        UserMaster.find(query, (err, IsExistEmailAddress) => 
        {                   
            if (!err) 
            { 
                if(IsExistEmailAddress.length > 0)
                { 
                    //Already email exist
                    res.send(ResponseDTO.ErrorMassage( constant.ErrorCode.EmailAlreadyExists, constant.ErrorMsg.EmailAlreadyExists, {} )); 
                }
                else
                { 

                    //Update
                    UserMaster.updateOne({ _id: ObjectId(req.body.userId), isActive : true, isDeleted : false }, { $set: { firstName : req.body.firstName, lastName : req.body.lastName, middleName : req.body.middleName, emailAddress : req.body.emailAddress, DOB : req.body.DOB, genderId : req.body.genderId, updatedBy: ObjectId(req.body.userId), updatedDateTime : new Date() } }, function(err, result) {
                        console.log(result);
                        if (!err)  
                        {
                            if(result.n > 0)
                            {
                                console.log("Profile Update successfully."); 
                                //res.send(ResponseDTO.ErrorMassage( constant.ErrorCode.EmailAlreadyExists, constant.ErrorMsg.EmailAlreadyExists, {} )); 
                                res.send(ResponseDTO.ErrorMassage(constant.ErrorCode.UpdateProfileSuccessfully, constant.ErrorMsg.UpdateProfileSuccessfully, {} ));  
                            }
                            else
                            {
                                console.log("Profile Not Updated."); 
                                res.send(ResponseDTO.ErrorMassage(constant.ErrorCode.NotUpdateProfile, constant.ErrorMsg.NotUpdateProfile, {} ));   
                            }
                        }
                        else 
                        { 
                            res.send(ResponseDTO.TechnicalError());
                        }
                    }); 
                  
                }
            }
            else
            {
                //throw err;
                res.send(ResponseDTO.TechnicalError()); 
            }

        });        
 
    }
 
});

//For Country Report & Gender Group wise Report //NV : Add Country
router.post('/ConsumerUpdateProfileV1', (req, res) => {
 
    if(req.body.DOB == undefined || req.body.genderId == undefined || req.body.DOB.trim() == "" || req.body.genderId.trim() == "" || req.body.countryId == undefined || req.body.countryId.trim() == "" || !(req.body.genderId.trim() ==  constant.Gender.Secret || req.body.genderId.trim() == constant.Gender.Male || req.body.genderId.trim() ==  constant.Gender.Female))
    {
        console.log("Missing Country, Gender, DOB");
        res.send(ResponseDTO.InvalidParameter()); 
    }
    else if(req.body.userId == undefined || req.body.firstName == undefined || req.body.lastName == undefined || req.body.middleName == undefined || req.body.emailAddress == undefined || !req.body.firstName.trim() || req.body.emailAddress.trim() == "" )
    {
        res.send(ResponseDTO.InvalidParameter()); 
    }
    else
    {   

        req.body.emailAddress = req.body.emailAddress.toLowerCase();
        console.log("Email Address : " + req.body.emailAddress);        

        var query = {
            "$and": [
                {
                    "_id": {
                        "$ne": ObjectId(req.body.userId)
                    }
                },
                {
                    "emailAddress": req.body.emailAddress
                },
                {
                    "isActive": true
                },
                {
                    "isDeleted": false
                },
                {
                    "emailAddress": {
                        "$ne": ""
                    }
                }
            ]
        };


        UserMaster.find(query, (err, IsExistEmailAddress) => 
        {                   
            if (!err) 
            { 
                if(IsExistEmailAddress.length > 0)
                { 
                    //Already email exist
                    res.send(ResponseDTO.ErrorMassage( constant.ErrorCode.EmailAlreadyExists, constant.ErrorMsg.EmailAlreadyExists, {} )); 
                }
                else
                { 

                    //Update
                    UserMaster.updateOne({ _id: ObjectId(req.body.userId), isActive : true, isDeleted : false }, { $set: { firstName : req.body.firstName, lastName : req.body.lastName, middleName : req.body.middleName, DOB : req.body.DOB, genderId : req.body.genderId, updatedBy: ObjectId(req.body.userId), updatedDateTime : new Date(), countryId : ObjectId(req.body.countryId) } }, function(err, result) { //emailAddress : req.body.emailAddress,
                        console.log(result);
                        if (!err)  
                        {
                            if(result.n > 0)
                            {
                                console.log("Profile Update successfully."); 
                                //res.send(ResponseDTO.ErrorMassage( constant.ErrorCode.EmailAlreadyExists, constant.ErrorMsg.EmailAlreadyExists, {} )); 
                                res.send(ResponseDTO.ErrorMassage(constant.ErrorCode.UpdateProfileSuccessfully, constant.ErrorMsg.UpdateProfileSuccessfully, {} ));  
                            }
                            else
                            {
                                console.log("Profile Not Updated."); 
                                res.send(ResponseDTO.ErrorMassage(constant.ErrorCode.NotUpdateProfile, constant.ErrorMsg.NotUpdateProfile, {} ));   
                            }
                        }
                        else 
                        { 
                            res.send(ResponseDTO.TechnicalError());
                        }
                    }); 
                  
                }
            }
            else
            {
                //throw err;
                res.send(ResponseDTO.TechnicalError()); 
            }

        });        
 
    }
 
});

 

//Get Status (Approved or DisApproved) User // For Provider 
router.post('/GetUserStatus', (req, res) => {
 
    if(req.body.userId == undefined || req.body.userId.trim() == "")
    {
        res.send(ResponseDTO.InvalidParameter()); 
    }
    else
    {   

      UserMaster.find({_id : ObjectId(req.body.userId), userTypeId : ObjectId(constant.UserType.Provider), isActive : true, isDeleted : false }, (err, userMasterDoc) => {
        if(!err)
        {
            if(userMasterDoc.length > 0)
            {
                console.log("User Status Id : " + userMasterDoc[0].userStatusId);
                res.send(ResponseDTO.ErrorMassage(constant.ErrorCode.DataRetrievedSuccessfully, constant.ErrorMsg.DataRetrievedSuccessfully , { userStatusId : userMasterDoc[0].userStatusId } )); 
            }
            else
            { 
                res.send(ResponseDTO.InvalidParameter()); 
            }
        }
        else
        {
            res.send(ResponseDTO.TechnicalError()); 
        }

      });

    }
 
});



module.exports = router;