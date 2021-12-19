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
var { Feedback, UserMaster } = require('../models/entity');
//var { Employee } = require('../models/-employee');
var ResponseDTO = require('../../../DTO/Consumer/ResponseDTO');   
var contains = require("string-contains");
var dateFormat = require('dateformat');
// => localhost:3000/account/

  
// For Degree List with filter, search, sorting, paging

 

//For Feedback List
router.post('/FeedbackList', (req, res) => {
    
      req.body.startDate = "";
      req.body.endDate = "";

      console.log(req.headers.languageid); 

      if(req.body.startDate == undefined || req.body.endDate == undefined)
      {
            console.log("Missing fields startDate or endDate"); 
            res.send(ResponseDTO.InvalidParameter()); 
      } 
      else if(req.body.pageNo == undefined || req.body.pageSize == undefined || req.body.sortOrderId == undefined || req.body.sortFieldName == undefined || req.body.searchText == undefined )
      {
          res.send(ResponseDTO.InvalidParameter()); 
      }
      else if(req.body.pageNo <= 0 || req.body.pageSize <= 0 || req.body.sortOrderId > constant.SortOrderId.Default || req.body.sortOrderId < constant.SortOrderId.Asc || ((req.body.sortOrderId == constant.SortOrderId.Asc || req.body.sortOrderId == constant.SortOrderId.Desc) && req.body.sortFieldName.trim() == "" ) )
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
                $lookup:
                {
                    from: "usermasters",  
                    let: { userId: "$fb.user_Id" }, //languageId : req.headers.languageid, order_qty: "$ordered" 
                    pipeline: [
                        { 
                            $match:
                            { 
                                $expr:
                                { 
                                    $and:
                                    [ 
                                        { $eq: [ "$_id",  "$$userId" ] },
                                        { $eq: [ "$isActive", true ] },
                                        { $eq: [ "$isDeleted", false ]  }, 
                                        //{ $eq: [ "$language_Id", ObjectId(req.headers.languageid) ] }
                                    ]
                                }
                            }
                        }, 
                        { 
                            $project: 
                            { 
                                userName : "$firstName",
                                mobileNo : "$mobileNo", 
                                image: //"$image", 
                                {
                                    $concat: 
                                    [
                                        appSetting.SystemConfiguration.APIBaseUrl, appSetting.SystemConfiguration.UserDisplayImagePath,
                                        {
                                            $cond: 
                                            {  
                                                if:
                                                {
                                                    $eq : [ "$genderId", constant.Gender.Male ]
                                                },
                                                then : 
                                                    appSetting.SystemConfiguration.UserMenDefaultImage,
                                                else : 
                                                    appSetting.SystemConfiguration.UserWomenDefaultImage,
             
                                            }               
                                        }
                                    ]
                                },
                                genderId : "$genderId",
                                _id : 0 
                            } 
                        }
                    ],   

                    as: "usermasters"

                }  
            },  
            {
                $unwind:"$usermasters"
            },      
             {
                $match: { 
                    "fb.isActive": true,
                    "fb.isDeleted": false
               }
            }, 
            {
               // $sort: [['um._id','asc']] //, ['field2','desc']
                $sort : { "fb.createdDateTime" : 1 }
            },  
            {
                $project: {
                    feedbackId: "$fb._id", 
                    emailAddress : "$fb.emailAddress",
                    feedback : "$fb.feedback",
                    userName: "$usermasters.userName",
                    mobileNo: "$usermasters.mobileNo",
                    image: "$usermasters.image",
                    genderId: "$usermasters.genderId", 
                    createdDateTime: "$fb.createdDateTime", 
                    _id: 0
                }
            }
        ];

 
        // For User List
        Feedback.aggregate(pipeline, async (err,  feedbacks) =>
        {    
            if(!err)
            { 
                //.slice((Page no - 1) * PageSize, ((Page no - 1) * PageSize) + PageSize);  1 -> 0 to 9,  2-> 10 to 19,  3 -> 20 to 29, ....
                var StartRow = (req.body.pageNo - 1) * req.body.pageSize;
                var EndRow = StartRow + req.body.pageSize ;
       
                //console.log(feedbacks);
 
                let promise = await new Promise(function(resolve, reject) {

              
                    var data =  new LINQ(feedbacks)   
                    .Where(function(feedback) 
                    { 
                        var IsValidRecord = true;

                        console.log("feedback =>");      
                        console.log(feedback); 
                        var RowValue = " ";
                        RowValue += feedback.emailAddress == null ? " " : feedback.emailAddress + " ";
                        RowValue += feedback.feedback == null ? " " : feedback.feedback + " ";
                        RowValue += feedback.userName == null ? " " : feedback.userName + " ";
                        RowValue += feedback.mobileNo == null ? " " : feedback.mobileNo + " "; 
                        RowValue += feedback.createdDateTime == null ? " " : dateFormat(feedback.createdDateTime, appSetting.SystemConfiguration.AdminGridDateFormat)  + " ";

                        //console.log(RowValue);

                        if(req.body.searchText.trim() == "")
                        {
                            IsValidRecord = contains(RowValue, " ") 
                        }
                        else
                        {
                            IsValidRecord = contains(RowValue.toLowerCase(), req.body.searchText.toLowerCase())  
                        }


                        if(req.body.startDate.trim() != "" && req.body.endDate.trim() != "")
                        {
                            //Check Particular Duration wise
                            return IsValidRecord && (feedback.createdDateTime >= new Date(req.body.startDate) && feedback.createdDateTime <= new Date(req.body.endDate)); 
                        }
                        else if(req.body.startDate.trim() != "")
                        {
                            //Check Only StartDate 
                            return IsValidRecord && (feedback.createdDateTime >= new Date(req.body.startDate)); 
                        }
                        else if(req.body.endDate.trim() != "")
                        {
                            //Check Only EndDate 
                            return IsValidRecord && (feedback.createdDateTime <= new Date(req.body.endDate)); 
                        }
                        else 
                        {
                            //Display All
                            return IsValidRecord && true;
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
                                    case "feedback": 
                                        return data.feedback.trim().toLowerCase();
                                    case "emailAddress": 
                                        return data.emailAddress.trim().toLowerCase();  
                                    case "userName": 
                                        return data.userName.trim().toLowerCase();
                                    case "mobileNo": 
                                        return data.mobileNo;
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
                                    case "feedback": 
                                        return data.feedback.trim().toLowerCase();
                                    case "emailAddress": 
                                        return data.emailAddress.trim().toLowerCase();  
                                    case "userName": 
                                        return data.userName.trim().toLowerCase();
                                    case "mobileNo": 
                                        return data.mobileNo;
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
                console.log(req.body.searchText);
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

 
  
//For View Feedback Details
router.post('/ViewFeedback', (req, res) => {
     
    //console.log(req.body);
  
      if(req.body.feedbackId == undefined || req.body.feedbackId.trim() == "")
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
                $lookup:
                {
                    from: "usermasters",  
                    let: { userId: "$fb.user_Id" }, //languageId : req.headers.languageid, order_qty: "$ordered" 
                    pipeline: [
                        { 
                            $match:
                            { 
                                $expr:
                                { 
                                    $and:
                                    [ 
                                        { $eq: [ "$_id",  "$$userId" ] },
                                        { $eq: [ "$isActive", true ] },
                                        { $eq: [ "$isDeleted", false ]  }, 
                                        //{ $eq: [ "$language_Id", ObjectId(req.headers.languageid) ] }
                                    ]
                                }
                            }
                        }, 
                        { 
                            $project: 
                            { 
                                userName : "$firstName",
                                mobileNo : "$mobileNo", 
                                image: //"$image", 
                                {
                                    $concat: 
                                    [
                                        appSetting.SystemConfiguration.APIBaseUrl, appSetting.SystemConfiguration.UserDisplayImagePath,
                                        {
                                            $cond: 
                                            {  
                                                if:
                                                {
                                                    $eq : [ "$genderId", constant.Gender.Male ]
                                                },
                                                then : 
                                                    appSetting.SystemConfiguration.UserMenDefaultImage,
                                                else : 
                                                    appSetting.SystemConfiguration.UserWomenDefaultImage,
             
                                            }               
                                        }
                                    ]
                                },
                                genderId : "$genderId",
                                _id : 0 
                            } 
                        }
                    ],   

                    as: "usermasters"

                }  
            },  
            {
                $unwind:"$usermasters"
            },      
             {
                $match: { 
                    "fb.isActive": true,
                    "fb.isDeleted": false,
                    "fb._id" : ObjectId(req.body.feedbackId)
               }
            }, 
            {
               // $sort: [['um._id','asc']] //, ['field2','desc']
                $sort : { "fb.createdDateTime" : 1 }
            },  
            {
                $project: {
                    feedbackId: "$fb._id", 
                    emailAddress : "$fb.emailAddress",
                    feedback : "$fb.feedback",
                    userName: "$usermasters.userName",
                    mobileNo: "$usermasters.mobileNo",
                    image: "$usermasters.image",
                    genderId: "$usermasters.genderId", 
                    createdDateTime: "$fb.createdDateTime", 
                    _id: 0
                }
            }
        ];

     
  
        // For User List
        Feedback.aggregate(pipeline, async (err,  feedback) =>
        {    
            console.log(feedback);
            if(!err)
            {   
                res.send(ResponseDTO.GetProviderList(constant.ErrorCode.DataRetrievedSuccessfully, constant.ErrorMsg.DataRetrievedSuccessfully, feedback[0] ));
            }
            else
            {
                //throw err;
                res.send(ResponseDTO.TechnicalError());  
            }
        }); 
  
      }
   
  });
  
 
  
// For Delete Feedback Details 
router.post('/DeleteFeedback', (req, res) => {

    if(req.body.feedbackId == undefined || req.body.feedbackId.trim() == "")
    {
        res.send(ResponseDTO.InvalidParameter()); 
    }
    else
    {  
     

        // Delete Category and Sub Category Details
        Feedback.find({ _id: req.body.feedbackId }, (err, feedback)  => 
        {  
            if(!err)
            {
                if(feedback.length)
                {
                    //Delete User Master Details
                    Feedback.updateOne({ _id: req.body.feedbackId }, { $set: { isDeleted : true } }, function(err, FeedbackDoc) {
                        if (!err) 
                        {
                            console.log("Delete Feedback Details"); 
                            // Delete Feedback Details 
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