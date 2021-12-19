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
var { UserConsumptions, UserMaster, ProviderDetails } = require('../models/entity');
//var { Employee } = require('../models/-employee');
var ResponseDTO = require('../../../DTO/Consumer/ResponseDTO');   

// => localhost:3000/account/

  
// For Degree List with filter, search, sorting, paging

 

//For Feedback List
router.post('/DashboardDetails', async (req, res) => {

         
    // if(req.body.pageNo == undefined || req.body.pageSize == undefined || req.body.sortOrderId == undefined || req.body.sortFieldName == undefined || req.body.searchText == undefined )
    // {
    //   res.send(ResponseDTO.InvalidParameter()); 
    // }
    // else
    // {
        console.log(req.body);
 
        let promise = await new Promise(async function(resolve, reject) {

            var data = {
                totalUser : 0, // Total User
                totalConsultant : 0, // Total Provider
                totalRevenue : 0, // Total Admin Commission
                totalEarnings : 0, // Total Admin & Provider Earning
                monthlyEarnings : 0, // Monthly Admin & Provider Earning
                weeklyEarnings : 0, // Weekly Admin & Provider Earning 
                currencySymbol : constant.CurrencySymbol.Kuwait,
                lastAppointmentDetails : [],
            }
            

            await UserMaster.count({ isActive : true, isDeleted : false, userTypeId : ObjectId(constant.UserType.Consumer) }, (err, NoOfConsumer) => {
                if(!err)
                {
                    data.totalUser = NoOfConsumer;
                } 
                else
                {
                    res.send(ResponseDTO.TechnicalError());  
                    return;
                }
            });


            await ProviderDetails.count({ isActive : true, isDeleted : false }, (err, NoOfProvider) => {  //, userTypeId : ObjectId(constant.UserType.Provider)
                if(!err)
                {
                    data.totalConsultant = NoOfProvider;
                } 
                else
                {
                    res.send(ResponseDTO.TechnicalError());  
                    return;
                }
            });        

            let promiseData = await new Promise(async function(resolve, reject) {
                await UserConsumptions.aggregate(
                    [   
                        {
                            $lookup:
                            {
                                from: "usermasters",
                                localField: "consumer_user_Id",
                                foreignField: "_id",
                                as: "consumerDetails"
                            }  
                        },  
                        {
                            $unwind: "$consumerDetails"
                        }, 
                        {
                            $lookup:
                            {
                                from: "usermasters",
                                localField: "provider_user_Id",
                                foreignField: "_id",
                                as: "providerDetails"
                            }  
                        },  
                        {
                            $unwind: "$providerDetails"
                        },                            
                        {
                            $project:
                            {   
                                _id: 0,
                                appointmentId: "$appointment_details_Id", 
                                consumerUserId: "$consumer_user_Id",
                                //providerUserId : "$provider_user_Id",
                                commissionPercentage: "$commissionPercentage",
                                price: "$price",
                                commissionPrice: 
                                {
                                    $ceil:
                                    {
                                        $divide: [
                                            { 
                                                $multiply: [ "$price", "$commissionPercentage" ] 
                                            }, 100
                                        ] 
                                    }
                                },
                                totalPrice : { 
                                    $subtract : 
                                    [ 
                                        "$price", 
                                        {  
                                            $ceil:
                                            {
                                                $divide: 
                                                [
                                                    { 
                                                        $multiply: [ "$price", "$commissionPercentage" ] 
                                                    }, 100
                                                ]   
                                            }
                                        }   
                                    ]
                                },  
                                providerImage : 
                                {
                                    $concat: 
                                    [
                                        appSetting.SystemConfiguration.APIBaseUrl, appSetting.SystemConfiguration.UserDisplayImagePath,
                                        {
                                            $cond: 
                                            { 
                                                if: 
                                                { 
                                                    $or : [{
                                                        $eq: [ "$providerDetails.image", null ] 
                                                    },
                                                    {
                                                        $eq: [ "$providerDetails.image", "" ] 
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
                                                                input: "$providerDetails._id", to: "string" 
                                                            } 
                                                        }, "/", "$providerDetails.image" 
                                                    ]
                                                }
                                            }               
                                        }
                                    ]
                                }, 
                                createdDateTime : "$createdDateTime",
                                consumerName : "$consumerDetails.firstName",
                                providerName : "$providerDetails.firstName"
                            }
                        }, 
                
            
                    ], async (err, transactionDetails) =>
                    {       
                        
                        if(!err)
                        { 
                            
                            let TotalCommission = await new Promise(function(resolve, reject) 
                            { 
                                resolve(new LINQ(transactionDetails)
                                .Where(function(transactionDetails) 
                                {
                                    // console.log(transactionDetails.createdDateTime)
                                    // console.log(new Date())
                                    // console.log(transactionDetails.createdDateTime <= new Date())
                                    return transactionDetails.createdDateTime <= new Date(); 
                                })
                                .Sum(function(transactionDetail) 
                                    {   
                                        return transactionDetail.commissionPrice;   
                                    })
                                );
                            }); 

                            
                            let TotalPrice = await new Promise(function(resolve, reject) 
                            { 
                                resolve(new LINQ(transactionDetails)
                                .Where(function(transactionDetails) 
                                {
                                    return transactionDetails.createdDateTime <= new Date(); 
                                })
                                .Sum(function(transactionDetail) 
                                    {   
                                        return transactionDetail.price;   
                                    })
                                );
                            }); 


                            let TotalMonthlyPrice = await new Promise(function(resolve, reject) 
                            { 
                                resolve(new LINQ(transactionDetails)
                                .Where(function(transactionDetails) 
                                {
                                    return transactionDetails.createdDateTime <= new Date() && transactionDetails.createdDateTime >= date.addDays(new Date(), -30); 
                                })
                                .Sum(function(transactionDetail) 
                                    {   
                                        return transactionDetail.price;   
                                    })
                                );
                            }); 
                            
                            
                            let TotalWeeklyPrice = await new Promise(function(resolve, reject) 
                            { 
                                resolve(new LINQ(transactionDetails)
                                .Where(function(transactionDetails) 
                                {
                                    return transactionDetails.createdDateTime <= new Date() && transactionDetails.createdDateTime >= date.addDays(new Date(), -7); 
                                })
                                .Sum(function(transactionDetail) 
                                    {   
                                        return transactionDetail.price;   
                                    })
                                );
                            });         
                            
                    
                            let LastAppointmentDetails = await new Promise(function(resolve, reject) 
                            { 
                                resolve(new LINQ(transactionDetails)
                                    .OrderByDescending(function(transactionDetails) 
                                    {
                                        return transactionDetails.createdDateTime
                                    }).ToArray().slice(0, 10)
                                );
                            });     
 
                            data.totalRevenue = TotalCommission;
                            data.totalEarnings = TotalPrice;  
                            data.monthlyEarnings = TotalMonthlyPrice;  
                            data.weeklyEarnings = TotalWeeklyPrice;  
                            data.lastAppointmentDetails = LastAppointmentDetails;
                            console.log(data);
                            console.log(transactionDetails.length) 
                            resolve(data); 
                        }
                        else
                        {
                            res.send(ResponseDTO.TechnicalError());  
                        }
                    }); 
                    

                }); 


            resolve(promiseData); 

        }); 
    
        res.send(ResponseDTO.DataRetrievedSuccessfully(constant.ErrorCode.DataRetrievedSuccessfully, constant.ErrorMsg.DataRetrievedSuccessfully, promise ));  
    //}
});
  
 
  


module.exports = router;