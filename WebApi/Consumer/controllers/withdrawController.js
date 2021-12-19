// //var async = require('async');
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
   
var multer = require('multer')

var LINQ = require('node-linq').LINQ;
var path = require('path');
//const upload = multer({dest: __dirname + '/uploads/images'});

 
var constant = require('../../../CommonUtility/constant');   

// constant.SUMMER.BEGINNING 
var { UserMaster, WithdrawDetails, SystemConfigurations } = require('../models/entity'); 
//const { SendPushNotification } = require("./Helper");
var Helper = require('./Helper.js');

//var { Employee } = require('../models/-employee');
var ResponseDTO = require('../../../DTO/Consumer/ResponseDTO');   

// => localhost:3000/account/

   

//For Feedback List
router.post('/WithdrawRequest', (req, res) => {
     
    if(req.body.userId == undefined || req.body.userId.trim() == "" || req.body.price == undefined || req.body.price <= 0)
    {
        res.send(ResponseDTO.InvalidParameter()); 
    }
    // else if (req.body.price <= 0)
    // {
    //     res.send(ResponseDTO.()); 
    // }
    else
    {    
        SystemConfigurations.find({isActive : true, isDeleted : false}, async (err,  systemConfigurationsDoc) =>
        {    
            console.log(systemConfigurationsDoc);
            if(!err)
            {   
                if(systemConfigurationsDoc.length > 0)
                {
                    if(req.body.price >= systemConfigurationsDoc[0].minimum_withdrawal_amount_request)
                    {
                        UserMaster.count({ _id : ObjectId(req.body.userId), userTypeId : ObjectId(constant.UserType.Provider), isActive : true, isDeleted : false }, (err, IsUserExist) => {
                            if(!err)
                            {
                                if(IsUserExist > 0)
                                {
                                    WithdrawDetails.count({ user_Id : ObjectId(req.body.userId), isActive : true, isWithdraw : false  }, async (err, IsPendingRequest) =>  //isDeleted : false,
                                    {
                                        if(!err)
                                        {
                                            if(IsPendingRequest > 0)
                                            {
                                                res.send(ResponseDTO.ErrorMassage(constant.ErrorCode.LastRequestNotCompleted , constant.ErrorMsg.LastRequestNotCompleted, {} )); 
                                            }
                                            else
                                            {
                                            
                                                var WalletDetails = await Helper.getProviderWalletDetailsByUserId(req.body.userId);

                                                if(req.body.price <= WalletDetails.CurrentBalance)
                                                {
                                                    //Check Wallet Balance Code  //InsufficientProviderBalance
                            
                                                    
                                                    var withdrawDetails = new WithdrawDetails({  
                                                        user_Id : ObjectId(req.body.userId), 
                                                        price : req.body.price, 
                                                        requestDateTime:  new Date(),
                                                        isWithdraw: false,
                                                        withdrawDateTime: null, 
                                                        isActive : true,
                                                        isDeleted : false, 
                                                        createdBy : ObjectId(req.headers.userid),
                                                        createdDateTime : new Date(),
                                                        updatedBy : null,
                                                        updatedDateTime : null  
                                                    });
                                        
                                                    withdrawDetails.save((err, withdrawDetailsDoc) => { 
                                                        if (!err) 
                                                        {  
                                                            res.send(ResponseDTO.ErrorMassage(constant.ErrorCode.WithdrawRequestSendSuccessfully, constant.ErrorMsg.WithdrawRequestSendSuccessfully, {} ) );                                                           
                                                        }
                                                        else 
                                                        { 
                                                            //console.log("3"); 
                                                            //throw err;
                                                            res.send(ResponseDTO.TechnicalError()); 
                                                        }
                                                    });   
                                                }
                                                else
                                                {
                                                    res.send(ResponseDTO.ErrorMassage(constant.ErrorCode.InsufficientProviderBalance , constant.ErrorMsg.InsufficientProviderBalance , {} )); 
                                                }
                            
                                            }
                                        }
                                        else
                                        {
                                            res.send(ResponseDTO.TechnicalError()); 
                                        } 
                                    });
                                }
                                else
                                {
                                    res.send(ResponseDTO.ErrorMassage(constant.ErrorCode.InvalidUserId , constant.ErrorMsg.InvalidUserId , {} )); 
                                }
                            }
                            else
                            {
                                res.send(ResponseDTO.TechnicalError()); 
                            }
                        });
                    }
                    else
                    {
                        res.send(ResponseDTO.ErrorMassage(constant.ErrorCode.MustBeMinimumWithdrawalAmount , systemConfigurationsDoc[0].minimum_withdrawal_amount_request + "" , {} )); //constant.ErrorMsg.MustBeMinimumWithdrawalAmount
                    }
                }
                else
                {
                    console.log("System Configuration Value not set")
                    res.send(ResponseDTO.TechnicalError());  
                }
                
            }
            else
            {
                //throw err;
                res.send(ResponseDTO.TechnicalError());  
            }
        }).sort({ _id : -1}).limit(1);; 




        // var pipeline = [ 
        //     {
        //         $project: {
        //             "_id": 0,
        //             "wd": "$$ROOT"
        //         }
        //     },      
        //     {
        //         $match: { 
        //             "wd.isActive": true,
        //             "wd.isDeleted": false,
        //             "wd.isWithdraw" : false
        //        }
        //     },  
        //     {
        //         $project: {
        //             userId: "$fb.user_Id", 
        //             deviceId : "$fb.deviceId",
        //             deviceToken : "$fb.deviceToken", 
        //             appId: "$fb.appId", 
        //             title: req.body.title,
        //             message : req.body.message,
        //             sound : "default",
        //             _id: 0
        //         }
        //     }
        // ];

 
        // // For User List
        // WithdrawDetails.aggregate(pipeline, async (err,  UserTokens) =>
        // {    
        //     if(!err)
        //     { 
        //         console.log(UserTokens);
   

        //         Helper.SendPushNotification(UserTokens);


        //         // UserTokens.forEach(function(item){
 

        //         //     var message = { //this may vary according to the message type (single recipient, multicast, topic, et cetera)
        //         //         to: item.deviceToken, 
        //         //         //collapse_key: 'your_collapse_key',
                        
        //         //         notification: {
        //         //             title: req.body.title, 
        //         //             body: req.body.message,
        //         //             sound: "default"
        //         //         },
                        
        //         //         // data: {  //you can send only notification or only data(or include both)
        //         //         //     my_key: 'my value',
        //         //         //     my_another_key: 'my another value'
        //         //         // }
        //         //     };
                    
        //         //     fcm.send(message, function(err, response){
        //         //         if (err) {
        //         //             console.log("Something has gone wrong!", err);
        //         //         } else {
        //         //             console.log("Successfully sent with response: ", response);
        //         //         }
        //         //     });

        //         // });

 

        //         res.send(ResponseDTO.DataRetrievedSuccessfully(constant.ErrorCode.DataRetrievedSuccessfully, constant.ErrorMsg.DataRetrievedSuccessfully, UserTokens ));  
        //     }
        //     else
        //     {
        //         //throw err;
        //         res.send(ResponseDTO.TechnicalError());  
        //     }
        // }); 

             
    }
   
});

   

module.exports = router;