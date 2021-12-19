
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
var { UserMaster, CreditPlans } = require('../models/entity');
//var { Employee } = require('../models/-employee');
var ResponseDTO = require('../../../DTO/Consumer/ResponseDTO');   

 


// Get Credit Plan List   
router.get('/PlanList', (req, res) => 
    { 
   

            CreditPlans.aggregate([  
                {
                   $match : { isActive : true, isDeleted : false }
                },
            //     {
            //         $lookup:
            //         {
            //             from: "categorylangdetails",
            //             localField: "_id",
            //             foreignField: "category_id",
            //             as: "categoryDetails"
            //         }  
            //    },
            //    { 
            //         $addFields: 
            //         { 
            //             categoryDetails: 
            //             { 
            //                 $arrayElemAt : [{
            //                     $filter:{
            //                         input: "$categoryDetails",
            //                         as: "cd",
            //                         cond: {
            //                             $eq: [ "$$cd.language_id", ObjectId(req.headers.languageid)] 
            //                         }                                        
            //                     }
            //                 }, 0] 
            //             } 
            //         } 
            //     }, 
                {
                    $project:
                    {   
                        _id: 0,
                        planId: "$_id",  
                        price: "$price",
                        currencySymbol : constant.CurrencySymbol.Kuwait,
                    }
                },  
                {
                    $sort : { price : 1 }
                } 

            ], (err, data) =>
            {    
                if(!err)
                { 
                    var result =
                    {
                        paymentDetails :
                        {
                            RequestErrorUrl : appSetting.SystemConfiguration.APIBaseUrl + appSetting.Payment.RequestErrorUrl,
                            CancelUrl : appSetting.SystemConfiguration.APIBaseUrl + appSetting.Payment.CancelUrl,
                            SuccessUrl : appSetting.SystemConfiguration.APIBaseUrl + appSetting.Payment.SuccessUrl
                        }, 
                        planDetails : data
                    } 

                    res.send(ResponseDTO.ErrorMassage(constant.ErrorCode.DataRetrievedSuccessfully, constant.ErrorMsg.DataRetrievedSuccessfully, result ));  
                }
                else
                {
                    res.send(ResponseDTO.TechnicalError());  
                }
            });  
             
    });
 


module.exports = router;