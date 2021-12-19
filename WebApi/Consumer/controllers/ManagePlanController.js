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
var { CreditPlans } = require('../models/entity');
//var { Employee } = require('../models/-employee');
var ResponseDTO = require('../../../DTO/Consumer/ResponseDTO');   
var contains = require("string-contains");
var dateFormat = require('dateformat');
// => localhost:3000/account/

  
// For Category List with filter, search, sorting, paging

 

//For Plan List 
router.post('/PlanList', (req, res) => {
    
      console.log( req.headers.languageid); 
      
     
      if(req.body.pageNo == undefined || req.body.pageSize == undefined || req.body.sortOrderId == undefined || req.body.sortFieldName == undefined || req.body.searchText == undefined )
      {
          res.send(ResponseDTO.InvalidParameter()); 
      }
      else if(req.body.pageNo <= 0 || req.body.pageSize <= 0 || req.body.sortOrderId > constant.SortOrderId.Default || req.body.sortOrderId < constant.SortOrderId.Asc || ((req.body.sortOrderId == constant.SortOrderId.Asc || req.body.sortOrderId == constant.SortOrderId.Desc) && req.body.sortFieldName.trim() == "" ) )
      {
            res.send(ResponseDTO.InvalidParameter()); 
      }       
      else
      {   

        var pipeline =  
        [  
            {
               $match : { isActive : true, isDeleted : false }
            }, 
            {
                $project:
                {   
                    _id: 0,
                    planId: "$_id",  
                    price: "$price",
                    currencySymbol : constant.CurrencySymbol.Kuwait, 
                    note : "$note",
                    createdDateTime : "$createdDateTime"
                }
            },  
            {
                $sort : { price : 1 }
            }  
        ];
 
 
        // For User List
        CreditPlans.aggregate(pipeline, async (err,  creditPlans) =>
        {    
            if(!err)
            { 
                //.slice((Page no - 1) * PageSize, ((Page no - 1) * PageSize) + PageSize);  1 -> 0 to 9,  2-> 10 to 19,  3 -> 20 to 29, ....
                var StartRow = (req.body.pageNo - 1) * req.body.pageSize;
                var EndRow = StartRow + req.body.pageSize ;
       
                console.log(creditPlans);
 
                let promise = await new Promise(function(resolve, reject) {

                    var data =  new LINQ(creditPlans)                
                    .Where(function(feedback) 
                    { 
                        var RowValue = " ";
                        RowValue += feedback.price == null ? " " : feedback.price + " ";
                        RowValue += feedback.currencySymbol == null ? " " : feedback.currencySymbol + " ";
                        RowValue += feedback.note == null ? " " : feedback.note + " "; 
                        RowValue += feedback.createdDateTime == null ? " " : dateFormat(feedback.createdDateTime, appSetting.SystemConfiguration.AdminGridDateFormat)  + " ";

                        if(req.body.searchText.trim() == "")
                        {
                            return contains(RowValue, " ") 
                        }
                        else
                        {
                            return contains(RowValue.toLowerCase(), req.body.searchText.toLowerCase())  
                        }
                    });


                    var result = {
                        totalRecords : data.items.length,
                        records : [] 
                    } 

                    if(constant.SortOrderId.Asc == req.body.sortOrderId)
                    {
                        result.records =  
                            new LINQ(data.items).OrderBy(function(data) 
                            { 
                                switch(req.body.sortFieldName)
                                {
                                    case "price": 
                                        return data.price;
                                    case "note": 
                                        return data.note.trim().toLowerCase();   
                                    case "createdDateTime": 
                                        return data.createdDateTime;                          
                                }
                                
                            })   
                            .ToArray().slice(StartRow, EndRow)
                    }
                    else if(constant.SortOrderId.Desc == req.body.sortOrderId)
                    {
                        result.records =  
                            new LINQ(data.items).OrderByDescending(function(data) 
                            { 
                                switch(req.body.sortFieldName)
                                {
                                    case "price": 
                                        return data.price;
                                    case "note": 
                                        return data.note.trim().toLowerCase();   
                                    case "createdDateTime": 
                                        return data.createdDateTime;                          
                                }
                                
                            })   
                            .ToArray().slice(StartRow, EndRow)                        
                    }
                    else
                    {
                        result.records =  
                        new LINQ(data.items).OrderByDescending(function(data) 
                        { 
                            return data.createdDateTime; 
                        })   
                        .ToArray().slice(StartRow, EndRow)   
                    }

                    resolve(result);
                    

                     
                });
  
                res.send(ResponseDTO.DataRetrievedSuccessfully(constant.ErrorCode.DataRetrievedSuccessfully, constant.ErrorMsg.DataRetrievedSuccessfully, promise ));  
            }
            else
            {
                //throw err;
                res.send(ResponseDTO.TechnicalError());  
            }
        }); 

             
      }
   
});
  

//For Add Edit in Plan
router.post('/AddUpdatePlan', (req, res) => {

 
    if(req.body.planId == undefined || req.body.price == undefined || req.body.note == undefined || req.body.price <= 0)
    {
        res.send(ResponseDTO.InvalidParameter()); 
    }
    else if(req.body.price % 1 != 0)
    {
        res.send(ResponseDTO.InvalidParameter()); 
    } 
    else
    {
        if(req.body.planId.trim() == "")
        {
            //Add plan  
            var creditPlans = new CreditPlans({  
                price : req.body.price, 
                note : req.body.note, 
                isActive : true,
                isDeleted : false, 
                createdBy : ObjectId(req.headers.userid),
                createdDateTime : new Date(),
                updatedBy : null,
                updatedDateTime : null  
            });

            creditPlans.save((err, creditPlanDoc) => { 
                if (!err) 
                {  
                    res.send(ResponseDTO.DataRetrievedSuccessfully(constant.ErrorCode.CreateSuccessfully, constant.ErrorMsg.CreateSuccessfully, {} ) );                                                           
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
            //Edit Plan Details
            CreditPlans.count({ _id : ObjectId(req.body.planId), isActive : true, isDeleted : false }, async (err, IsExistPlan) => {
                console.log(IsExistPlan);
 
                if(!err)
                {
                    if(IsExistPlan > 0)
                    {
                         
                        CreditPlans.update(
                            { _id : ObjectId(req.body.planId), isActive : true, isDeleted : false }, 
                            { $set: { price : req.body.price, note : req.body.note, updatedBy: ObjectId(req.headers.userId), updatedDateTime : new Date() } }, function(err, creditPlan) {
                         
                            if (!err)  
                            {
                                if(creditPlan.n > 0)
                                {  
                                    console.log("Plan Updated successfully.");  
                                    res.send(ResponseDTO.ErrorMassage(constant.ErrorCode.UpdateSuccessfully, constant.ErrorMsg.UpdateSuccessfully, {} ));   
                                }
                                else
                                {
                                    res.send(ResponseDTO.ErrorMassage(constant.ErrorCode.NotUpdated, constant.ErrorMsg.NotUpdated, {} ));   
                                } 

                            }
                            else 
                            { 
                                // throw err
                                res.send(ResponseDTO.TechnicalError());
                            }
                        }); 
  
                    }
                    else
                    {
                        //Not Found Parent Category 
                        res.send(ResponseDTO.InvalidParameter()); 
                    }
                }
                else
                {
                    res.send(ResponseDTO.TechnicalError()); 
                }


            });
        }
    }


 
 
});

  
//For View Plan Details
router.post('/ViewPlan', (req, res) => {
     
    //console.log(req.body);
  
      if(req.body.planId == undefined || req.body.planId.trim() == "")
      {
          res.send(ResponseDTO.InvalidParameter()); 
      }
      else
      {   
        var pipeline = 
        [   
            {
               $match : { _id : ObjectId(req.body.planId), isActive : true, isDeleted : false }
            }, 
            {
                $project:
                {   
                    _id: 0,
                    planId: "$_id",  
                    price: "$price",
                    currencySymbol : constant.CurrencySymbol.Kuwait, 
                    note : "$note",
                    createdDateTime : "$createdDateTime"
                }
            }, 
        ];
  
        // For Plans List
        CreditPlans.aggregate(pipeline, async (err,  creditPlan) =>
        {    
            console.log(creditPlan);
            if(!err)
            {   
                res.send(ResponseDTO.GetProviderList(constant.ErrorCode.DataRetrievedSuccessfully, constant.ErrorMsg.DataRetrievedSuccessfully, creditPlan[0] ));
            }
            else
            {
                //throw err;
                res.send(ResponseDTO.TechnicalError());  
            }
        }); 
  
      }
   
  });
  
 
  
// For Delete Plan Details 
router.post('/DeletePlan', (req, res) => {

    if(req.body.planId == undefined || req.body.planId.trim() == "")
    {
        res.send(ResponseDTO.InvalidParameter()); 
    }
    else
    {  
      
        // Delete Plans Details
        CreditPlans.find({ _id: req.body.planId }, (err, creditPlans)  => 
        {  
            if(!err)
            {
                if(creditPlans.length)
                {
                    //Delete User Master Details
                    CreditPlans.updateOne({ _id: req.body.planId }, { $set: { isDeleted : true } }, function(err, creditPlanDoc) {
                        if (!err) 
                        {
                            console.log("Deleted Plan.");  
                            res.send(ResponseDTO.ErrorMassage( constant.ErrorCode.DeleteSuccessfully, constant.ErrorMsg.DeleteSuccessfully, {} ));
                        }
                        else
                        {
                            res.send(ResponseDTO.TechnicalError());
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
                res.send(ResponseDTO.TechnicalError());
            }
    
        }); 

    } 
 
});



module.exports = router;