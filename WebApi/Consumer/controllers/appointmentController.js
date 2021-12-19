

let date = require('date-and-time');
date.locale('hi');
var appSetting = require('../appsetting');  
// var { mongoose } = require('../db');
const express = require('express');
var router = express.Router();
//var db = require('mongoose');
var ObjectId = require('mongoose').Types.ObjectId; 
 
var constant = require('../../../CommonUtility/constant');  


// constant.SUMMER.BEGINNING 
var { UserMaster, UserPurchases,  CategoryMasters, CategoryLangDetails, AppointmentDetails, LookupLangDetails, ProviderDetails, UserConsumptions } = require('../models/entity');
//var { Employee } = require('../models/-employee');
var ResponseDTO = require('../../../DTO/Consumer/ResponseDTO');   


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

  
// Get Create Appointment
router.post('/CreateAppointment', (req, res) => {
    //  console.log(req.body);
    
        if(req.body.consumerUserId == undefined || req.body.providerUserId == undefined || req.body.isWithPayment == undefined)
        {
            res.send(ResponseDTO.InvalidParameter()); 
        }
        else
        {  

            var result = { 
                currentBalance : 0,
                requiredBalance : 0, 
                
                appointmentId : "",
                isQuestion : false,
                isAnswer : false,
                isRate : false
            };
      
            var query = {
                "$or": [
                    {
                        "$and": [
                            {
                                "_id": ObjectId(req.body.consumerUserId)
                            },
                            {
                                "userTypeId": ObjectId(constant.UserType.Consumer)
                            },
                            {
                                "isActive": true
                            },
                            {
                                "isDeleted": false
                            }
                        ]
                    },
                    {
                        "$and": [
                            {
                                "_id": ObjectId(req.body.providerUserId)
                            },
                            {
                                "userTypeId": ObjectId(constant.UserType.Provider)
                            },
                            {
                                "isActive": true
                            },
                            {
                                "isDeleted": false
                            }
                        ]
                    }
                ]
            };

            //{_id : ObjectId(providerUserId), userTypeId : ObjectId(constant.UserType.Provider), isActive : true, isDeleted : false}

            UserMaster.count(query,  (err, NoOfDoc)  =>  {
                console.log("Count : " + NoOfDoc);
//console.log(NoOfDoc);

                if(!err)
                {
                    if(NoOfDoc == 2)
                    { 

                        AppointmentDetails.find({ "provider_user_Id": ObjectId(req.body.providerUserId),  "consumer_user_Id": ObjectId(req.body.consumerUserId), "isActive": true, "isDeleted": false }, async (err, appointmentDetails) => {

                            if(!err)
                            {
                                // console.log("appointmentDetails.length" + appointmentDetails.length);
                                // console.log("appointmentDetails[0].question" + appointmentDetails[0].question);
                                // console.log("!(appointmentDetails[0].question == null)" + !(appointmentDetails[0].question == null));

                                if(appointmentDetails.length == 0 || (appointmentDetails.length > 0 && !(appointmentDetails[0].question == null) && !(appointmentDetails[0].answer == null) && !(appointmentDetails[0].rate == null) ) )
                                {
                                    console.log(appointmentDetails.length );
                                    console.log("Create Appointment with check balance");
                                    await getWalletDetailsByUserId(req.body.consumerUserId).then(function(data){
                             
                                        console.log(data);
                                        console.log(data.CurrentBalance);


                                        result.currentBalance = data.CurrentBalance;
            
                                        if(data.TotalPurchase >= data.TotalConsumption)
                                        { 
                                            if(!req.body.isWithPayment)
                                            { 
                                                res.send(ResponseDTO.DataRetrievedSuccessfully(constant.ErrorCode.EnableForPopUpWithoutPayment, constant.ErrorMsg.EnableForPopUpWithoutPayment, result ));   
                                            }
                                            else
                                            {  
                                                ProviderDetails.find({ user_Id: ObjectId(req.body.providerUserId), isActive : true, isDeleted : false}, (err, providerDetails) => {
                                                
                                                    if(!err)
                                                    { 
                                                    
                                                        if(data.CurrentBalance >= providerDetails[0].price)
                                                        {
                                                            console.log("Done");
                                                            //console.log(result);

                                                            var appointmentDetail = new AppointmentDetails({ 
                                                                // _id : ObjectId(), 
                                                                provider_user_Id :  ObjectId(req.body.providerUserId),
                                                                consumer_user_Id :  ObjectId(req.body.consumerUserId),
                                                                question : null, 
                                                                answer : null, 
                                                                rate : null, 
                                                                isActive : true,
                                                                isDeleted : false, 
                                                                createdBy : ObjectId(req.body.consumerUserId),
                                                                createdDateTime : new Date(),
                                                                updatedBy : null,
                                                                updatedDateTime : null 
                                                            });
                                            
                                                            appointmentDetail.save((err, appointmentDetailDoc) => {
                                                                if (!err) { 
                                                                    
                                                                    // console.log(userMasterDoc);
                        
                                                                    //console.log(userMasterDoc._id);
                        
                                                                    if(!appointmentDetailDoc.length)
                                                                    {
                                                                        var userConsumption = new UserConsumptions({ 

                                                                            consumer_user_Id : ObjectId(req.body.consumerUserId), 
                                                                            provider_user_Id : ObjectId(req.body.providerUserId),
                                                                            appointment_details_Id : ObjectId(appointmentDetailDoc._id),
                                                                            price : providerDetails[0].price, 
                                                                            commissionPercentage : providerDetails[0].commissionPercentage, 
                                                                            isActive : true,
                                                                            isDeleted : false, 
                                                                            createdBy : ObjectId(req.body.consumerUserId),
                                                                            createdDateTime : new Date(),
                                                                            updatedBy : null,
                                                                            updatedDateTime : null 
                                                                        });
                                                        
                                                                        userConsumption.save((err, userConsumptionDoc) => {
                                                                            if (!err) { 
                                                                                
                                                                                if(!userConsumptionDoc.length)
                                                                                {
                                                                                    //Data Retrieved Successfully  
                                                                                    result.appointmentId = appointmentDetailDoc._id; 
                                                                                    result.isQuestion = !(appointmentDetailDoc.question == null);
                                                                                    result.isAnswer = !(appointmentDetailDoc.answer == null);
                                                                                    result.isRate = !(appointmentDetailDoc.rate == null);
                                                                                    res.send(ResponseDTO.DataRetrievedSuccessfully(constant.ErrorCode.EnableForAskQue, constant.ErrorMsg.EnableForAskQue, result ));   
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
                                                            result.requiredBalance = providerDetails[0].price - data.CurrentBalance;
                                                            res.send(ResponseDTO.ErrorMassage(constant.ErrorCode.InsufficientBalance, constant.ErrorMsg.InsufficientBalance, result ));  
                                                        }
                
                                                        
                                                    }
                                                    else
                                                    {
                                                        //throw err;
                                                        res.send(ResponseDTO.TechnicalError()); 
                                                    }
                                                    
                
                                                }); 
                                            }
                                            
                                        }
                                        else
                                        {
                                            //throw err 
                                            res.send(ResponseDTO.ErrorMassage(constant.ErrorCode.NegativeBalance, constant.ErrorMsg.NegativeBalance, result ));  
                                        } 
                                    });                                     
                                }
                                else
                                {
                                    console.log("Last Appointment Detail Status");
                                    result.appointmentId = appointmentDetails[0]._id;
                                    result.isQuestion = !(appointmentDetails[0].question == null);
                                    result.isAnswer = !(appointmentDetails[0].answer == null);
                                    result.isRate = !(appointmentDetails[0].rate == null);
                                    res.send(ResponseDTO.ErrorMassage(constant.ErrorCode.IncompleteLastConversation, constant.ErrorMsg.IncompleteLastConversation, result ));  
                                }
                            }
                            else
                            {
                                res.send(ResponseDTO.TechnicalError()); 
                            }

                        }).sort([ ["_id", -1] ]).limit(1)
 
                    }
                    else
                    {
                        //Wrong Pass consumerUserId or providerUserId parameters
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



//Update Appointment
router.post('/UpdateAppointment', (req, res) => 
    { 
        console.log("================== Update Appointment ==================")
        console.log(req.body);
      if(req.body.appointmentId == undefined || req.body.updateType == undefined)
      {
          res.send(ResponseDTO.InvalidParameter()); 
      }
      else
      {   
          console.log(req.body.updateType);
          console.log(constant.UpdateAppointmentType.Question);
            if(req.body.updateType == constant.UpdateAppointmentType.Question)
            {
                //  Question 
                if(req.body.question != undefined && req.body.question != null && req.body.question.trim() != "") //add validation for null
                {
                    AppointmentDetails.updateOne({ _id : ObjectId(req.body.appointmentId),  consumer_user_Id : ObjectId(req.headers.userid), isActive : true, isDeleted : false }, { $set: { question : req.body.question, updatedBy: ObjectId(req.headers.userid), updatedDateTime : new Date() } }, function(err, doc) {
                        console.log(doc);
                        if (!err)
                        {
                            if(doc.n > 0)
                            {
                                res.send(ResponseDTO.ErrorMassage(constant.ErrorCode.UpdateAppointmentSuccessfully, constant.ErrorMsg.UpdateAppointmentSuccessfully, {} ));
                            }
                            else
                            {
                                res.send(ResponseDTO.ErrorMassage(constant.ErrorCode.NotUpdateAppointment, constant.ErrorMsg.NotUpdateAppointment, {} ));
                            }
                        }
                        else
                        {
                            res.send(ResponseDTO.TechnicalError())
                        } 
                    }); 
                }
                else
                {
                    console.log("Missing Question");
                    res.send(ResponseDTO.InvalidParameter());
                }
            }
            else if(req.body.updateType == constant.UpdateAppointmentType.Answer)
            {
                //  Answer
                console.log("Answer");
                if(req.body.answer != undefined && req.body.answer != null && req.body.answer.trim() != "")
                {
                    AppointmentDetails.updateOne({ _id : ObjectId(req.body.appointmentId),  provider_user_Id : ObjectId(req.headers.userid), isActive : true, isDeleted : false }, { $set: { answer : req.body.answer, updatedBy: ObjectId(req.headers.userid), updatedDateTime : new Date() } }, function(err, doc) {
                        console.log(doc);
                        if (!err)
                        {
                            if(doc.n > 0)
                            {
                                console.log("Update Appointment Successfully");
                                res.send(ResponseDTO.ErrorMassage(constant.ErrorCode.UpdateAppointmentSuccessfully, constant.ErrorMsg.UpdateAppointmentSuccessfully, {} ));
                            }
                            else
                            {
                                console.log("Not Update Appointment");
                                res.send(ResponseDTO.ErrorMassage(constant.ErrorCode.NotUpdateAppointment, constant.ErrorMsg.NotUpdateAppointment, {} ));
                            }
                        }
                        else
                        {
                            console.log("Error");
                            res.send(ResponseDTO.TechnicalError());
                        } 
                    });     
                }
                else
                {
                    console.log("Missing Answer");
                    res.send(ResponseDTO.InvalidParameter());
                }            
            }
            else if(req.body.updateType == constant.UpdateAppointmentType.Rate)
            {
                //  Rate
                // update one time validation & only decimal validation 
                if(!isNaN(req.body.rate))
                {

                    AppointmentDetails.find({ _id : ObjectId(req.body.appointmentId), isActive : true, isDeleted : false}, function(err, appointmentDetailsDoc){
                        if (!err)
                        {
                            if(appointmentDetailsDoc.length > 0)
                            {
                                console.log("rate : " + appointmentDetailsDoc[0].rate);
                                if(appointmentDetailsDoc[0].rate != null && appointmentDetailsDoc[0].rate >= 0)
                                {
                                    // Already given rate 
                                    console.log("Already given rating for this appointment.");
                                    res.send(ResponseDTO.ErrorMassage(constant.ErrorCode.AlreadyGivenRating, constant.ErrorMsg.AlreadyGivenRating, {} ));
                                }
                                else if(appointmentDetailsDoc[0].question == null || appointmentDetailsDoc[0].question.trim() == "")
                                {
                                    console.log("Missing question");
                                    res.send(ResponseDTO.ErrorMassage(constant.ErrorCode.MissingQuestion, constant.ErrorMsg.MissingQuestion, {} ));
                                }
                                else if(appointmentDetailsDoc[0].answer == null || appointmentDetailsDoc[0].answer.trim() == "")
                                {
                                    console.log("Missing answer");
                                    res.send(ResponseDTO.ErrorMassage(constant.ErrorCode.MissingAnswer, constant.ErrorMsg.MissingAnswer, {} ));
                                }
                                else
                                {

                                    AppointmentDetails.updateOne({ _id : ObjectId(req.body.appointmentId),  consumer_user_Id : ObjectId(req.headers.userid), isActive : true, isDeleted : false }, { $set: { rate : req.body.rate, updatedBy: ObjectId(req.headers.userid), updatedDateTime : new Date() } }, function(err, doc) {
                                        //console.log(doc);
                                        if (!err)
                                        {
                                            if(doc.n > 0)
                                            {
                                                res.send(ResponseDTO.ErrorMassage(constant.ErrorCode.UpdateAppointmentSuccessfully, constant.ErrorMsg.UpdateAppointmentSuccessfully, {} ));
                                            }
                                            else
                                            {
                                                res.send(ResponseDTO.ErrorMassage(constant.ErrorCode.NotUpdateAppointment, constant.ErrorMsg.NotUpdateAppointment, {} ));
                                            }
                                        }
                                        else
                                        {
                                            res.send(ResponseDTO.TechnicalError())
                                        } 
                                    }); 
                                }
                            }
                            else
                            {
                                console.log("Invalid AppointmentId");
                                res.send(ResponseDTO.InvalidParameter()); 
                            }
 
                        }
                        else
                        {
                            res.send(ResponseDTO.InvalidParameter()); 
                        }
                    });
 
                }
                else
                { 
                    res.send(ResponseDTO.InvalidParameter()); 
                }

                  
            }
            else
            {
                res.send(ResponseDTO.InvalidParameter()); 
            }
 
             
        }
   
    });
  
 

module.exports = router