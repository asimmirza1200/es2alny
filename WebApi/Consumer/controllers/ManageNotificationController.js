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
var { DeviceTokenMasters } = require('../models/entity'); 
//const { SendPushNotification } = require("./Helper");
var Helper = require('./Helper.js');

//var { Employee } = require('../models/-employee');
var ResponseDTO = require('../../../DTO/Consumer/ResponseDTO');   
 
// => localhost:3000/account/

   

//For Feedback List
router.post('/SendNotification', (req, res) => {
     
      if(req.body.title == undefined || req.body.title.trim() == "" || req.body.message == undefined || req.body.message == "" )
      {
        res.send(ResponseDTO.InvalidParameter()); 
      }
      else
      {   

        var pipeline = [ 
            {
                $project: {
                    "_id": 0,
                    "fb": "$$ROOT"
                }
            },      
            {
                $match: { 
                    "fb.isActive": true,
                    "fb.isDeleted": false
               }
            },  
            {
                $project: {
                    userId: "$fb.user_Id", 
                    deviceId : "$fb.deviceId",
                    deviceToken : "$fb.deviceToken", 
                    appId: "$fb.appId", 
                    title: req.body.title,
                    message : req.body.message,
                    sound : "default",
                    _id: 0
                }
            }
        ];

 
        // For User List
        DeviceTokenMasters.aggregate(pipeline, async (err,  UserTokens) =>
        {    
            if(!err)
            { 
                // console.log(UserTokens);
   

                Helper.SendPushNotification(UserTokens);


                // UserTokens.forEach(function(item){
 

                //     var message = { //this may vary according to the message type (single recipient, multicast, topic, et cetera)
                //         to: item.deviceToken, 
                //         //collapse_key: 'your_collapse_key',
                        
                //         notification: {
                //             title: req.body.title, 
                //             body: req.body.message,
                //             sound: "default"
                //         },
                        
                //         // data: {  //you can send only notification or only data(or include both)
                //         //     my_key: 'my value',
                //         //     my_another_key: 'my another value'
                //         // }
                //     };
                    
                //     fcm.send(message, function(err, response){
                //         if (err) {
                //             console.log("Something has gone wrong!", err);
                //         } else {
                //             console.log("Successfully sent with response: ", response);
                //         }
                //     });

                // });

 

                res.send(ResponseDTO.DataRetrievedSuccessfully(constant.ErrorCode.DataRetrievedSuccessfully, constant.ErrorMsg.DataRetrievedSuccessfully, UserTokens ));  
            }
            else
            {
                //throw err;
                res.send(ResponseDTO.TechnicalError());  
            }
        }); 

             
      }
   
});

  
   

module.exports = router;