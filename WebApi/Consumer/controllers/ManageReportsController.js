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
var { UserConsumptions, Feedback, CountryLangMasters, UserMaster, UserMaster, UserConsumptions, AgeGroupMasters } = require('../models/entity');
//var { Employee } = require('../models/-employee');
var ResponseDTO = require('../../../DTO/Consumer/ResponseDTO');   
var dateFormat = require('dateformat');
var contains = require("string-contains");
//var getAge = require('get-age');
// => localhost:3000/account/
// function  getAge (dateString) {
//     var today = new Date()
//     var birthDate = new Date(dateString)
//     var age = today.getUTCFullYear() - birthDate.getUTCFullYear()
//     var month = today.getUTCMonth() - birthDate.getUTCMonth()
//     if (month < 0 || (month === 0 && today.getUTCDate() < birthDate.getUTCDate())) {
//       age--
//     }
//     return age
//   }
  
// For Degree List with filter, search, sorting, paging

 

//For Admin Commission Report
router.post('/AdminCommission',  (req, res) => {

    if(req.body.startDate == undefined || req.body.endDate == undefined)
    {
        res.send(ResponseDTO.InvalidParameter()); 
    }
    else
    {
        console.log(req.body);
  
        var data = { 
            TotalEarnReward : 0, 
            Totalcommission : 0
        }  
        
 
        UserConsumptions.aggregate(
        [   
            {
                $lookup:
                {
                    from: "usermasters",
                    localField: "consumer_user_Id",
                    foreignField: "_id",
                    as: "usermasters"
                }  
            },                                   
            // {
            //     $match : 
            //     {  
            //         "provider_user_Id" : ObjectId(userId),   
            //     }
            // },  
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
                        $ceil: {
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
                    createdDateTime : "$createdDateTime"
                }
            }, 
        

        ], async (err, transactionDetails) =>
        {       

            if(!err)
            {
                //  var TotalEarn =
                    let TotalEarnReward = await new Promise(function(resolve, reject) 
                    { 
                        resolve(new LINQ(transactionDetails)
                            .Where(function(transactionDetails) 
                            { 
                                if(req.body.startDate.trim() != "" && req.body.endDate.trim() != "")
                                {
                                    //Check Particular Duration wise
                                    return transactionDetails.createdDateTime >= new Date(req.body.startDate) && transactionDetails.createdDateTime <= new Date(req.body.endDate); 
                                }
                                else if(req.body.startDate.trim() != "")
                                {
                                    //Check Only StartDate 
                                    return transactionDetails.createdDateTime >= new Date(req.body.startDate); 
                                }
                                else if(req.body.endDate.trim() != "")
                                {
                                    //Check Only EndDate 
                                    return transactionDetails.createdDateTime <= new Date(req.body.endDate); 
                                }
                                else 
                                {
                                    //Display All
                                    return true;
                                }
 
                            })
                            .Sum(function(transactionDetail) 
                            {   
                                return transactionDetail.totalPrice;   
                            })
                        );
                    });

                    let Totalcommission = await new Promise(function(resolve, reject) 
                    { 
                        resolve(new LINQ(transactionDetails)
                            .Where(function(transactionDetails) 
                            {  
                                if(req.body.startDate.trim() != "" && req.body.endDate.trim() != "")
                                {
                                    //Check Particular Duration wise
                                    if(transactionDetails.createdDateTime >= new Date(req.body.startDate) && transactionDetails.createdDateTime <= new Date(req.body.endDate))
                                    {
                                        console.log(transactionDetails);
                                    } 
                                    return transactionDetails.createdDateTime >= new Date(req.body.startDate) && transactionDetails.createdDateTime <= new Date(req.body.endDate); 
                                }
                                else if(req.body.startDate.trim() != "")
                                {
                                    //Check Only StartDate 
                                    return transactionDetails.createdDateTime >= new Date(req.body.startDate); 
                                }
                                else if(req.body.endDate.trim() != "")
                                {
                                    //Check Only EndDate 
                                    return transactionDetails.createdDateTime <= new Date(req.body.endDate); 
                                }
                                else 
                                {
                                    //Display All
                                    return true;
                                }
                            })
                            .Sum(function(transactionDetail) 
                            {   
                                return transactionDetail.commissionPrice;   
                            })
                        );
                    });                                
    

                    
                    data.TotalEarnReward = TotalEarnReward;  
                    data.Totalcommission = Totalcommission;
                    console.log("TotalEarnReward : " + TotalEarnReward); 
                    console.log("Totalcommission : " + Totalcommission);
                    console.log(data);
                
                    
                //    resolve(data);
                //   res.send(ResponseDTO.DataRetrievedSuccessfully(constant.ErrorCode.DataRetrievedSuccessfully, constant.ErrorMsg.DataRetrievedSuccessfully, TotalEarn ));  
                res.send(ResponseDTO.DataRetrievedSuccessfully(constant.ErrorCode.DataRetrievedSuccessfully, constant.ErrorMsg.DataRetrievedSuccessfully, data ));  
            }
            else
            {
                res.send(ResponseDTO.TechnicalError());  
            }
        }); 
    }  
});
  
 

// For Country Wise Registerd User Count list Report with filter, search, sorting, paging  (For User Side Only)
router.post('/CountryWiseRegisteredUserCountReport', (req, res) => {
    console.log(req.body); 
    
    req.body.sortOrderId = constant.SortOrderId.Desc;
    req.body.searchText = "";
    req.body.sortFieldName = "totalRegisteredUser";

    if(req.body.startDate == undefined || req.body.endDate == undefined || req.body.startDate == null || req.body.endDate == null)
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
                  "clm": "$$ROOT"
              }
          }, 


          //--For Price   
          {
              $lookup:
              {
                  from: "usermasters",
                  //localField: "_id",
                  //foreignField: "provider_user_Id",

                  let: { countryMasterId: "$clm.countrymaster_id" }, //, order_qty: "$ordered" 
                  pipeline: [
                      { 
                          $match:
                          { 
                              //  lookupDetails_Id : $degree,
                              $expr:
                              { 
                                  $and:
                                  [ 
                                      { $eq: [ "$countryId",  "$$countryMasterId" ] },
                                      { $eq: [ "$isActive", true ] },
                                      { $eq: [ "$isDeleted", false ]  },  
                                      { $eq: [ "$isDeleted", false ]  },  
                                      { $eq: [ "$userTypeId", ObjectId(constant.UserType.Consumer) ] },
                                      { 
                                        // $cond: 
                                        // {  
                                             $switch: {
                                                 branches: [
                                                     { 
                                                         case: { $and : [{  $ne: [ req.body.startDate.trim(), "" ] }, {  $ne: [ req.body.endDate.trim(), "" ]  }] }, 
                                                             then: { $and : [{ $gte: [ "$createdDateTime", new Date(req.body.startDate) ] }, { $lte : [ "$createdDateTime", new Date(req.body.endDate) ] }] } 
                                                     },
                                                     { 
                                                         case: { $and : {  $ne: [ req.body.startDate.trim(), "" ] } }, 
                                                             then: { $and : { $gte: [ "$createdDateTime", new Date(req.body.startDate) ] } } 
                                                     },
                                                     { 
                                                         case: { $and :  {  $ne: [ req.body.endDate.trim(), "" ]  } }, 
                                                             then: { $and : { $lte : [ "$createdDateTime", new Date(req.body.endDate) ] } } 
                                                     }                                                        
                                                 ],
                                                 default: { $eq: [ "$createdDateTime", "$createdDateTime" ]  }
                                             }, 
                                        }
                                                                             
                                      //{ $ne: [ "$price",  null ] },
                                      //{ $ne: [ "$commissionPercentage",  null ] },
                                      //{ $and : [{ $gte: [ "$createdDateTime", new Date(req.body.startDate) ] }, { $lte : [ "$createdDateTime", new Date(req.body.endDate) ] }] } 
                                      //{ $and : { $gte: [ "$createdDateTime", new Date(req.body.startDate) ] } } 
                                                                             
                                  ],
                                                                   
                              }
                          }
                      }, 
                      {
                          $group: 
                          {
                              _id: "$countryId",
                              //uniqueIds: {$addToSet: "$_id"},
                              totalRegisteredUser : { $sum: 1 } 
                          }
                      },
                      { 
                          $project: 
                          {  
                                totalRegisteredUser: "$totalRegisteredUser",  
                                _id : 0 
                          } 
                      }
                  ],   

                  as: "usermasters"

              }  
          },   
          {
              $match: {
                  "clm.isActive": true,
                  "clm.isDeleted": false,  
                  "clm.language_id" : ObjectId(req.headers.languageid)
                 // $concat: ["clm.firstName", "clm.emailAddress", " "] : req.body.searchText
              }
          }, 
          { 
              $sort : { "clm._id" : -1 }
          },  
          {
              $project: {
                  countryId : "$clm.countrymaster_id ",
                  countryName : "$clm.countryName", 
                  totalRegisteredUser : 
                  { 
                      $cond: [ 
                          {
                              $eq: ["$usermasters", [] ]
                          }, 0, 
                          {
                              $arrayElemAt:[ "$usermasters.totalRegisteredUser", 0]
                          }] 
                  },                                  
                  _id: 0
              }
          }
      ];


      // For User List
      CountryLangMasters.aggregate(pipeline, async (err, users) =>
      {    
          if(!err)
          { 
              //.slice((Page no - 1) * PageSize, ((Page no - 1) * PageSize) + PageSize);  1 -> 0 to 9,  2-> 10 to 19,  3 -> 20 to 29, ....
              var StartRow = (req.body.pageNo - 1) * req.body.pageSize;
              var EndRow = StartRow + req.body.pageSize ;
     

              let promise = await new Promise(function(resolve, reject) {

                  var data =  new LINQ(users)                
                  .Where(function(item) 
                  { 
                      //console.log(item);
                      var RowValue = " ";
                      RowValue += item.countryName == null ? " " : item.countryName + " ";
                      RowValue += item.totalRegisteredUser == null ? " " : item.totalRegisteredUser + " ";
                       

                      if(req.body.searchText.trim() == "")
                      {
                          return contains(RowValue, " ") 
                      }
                      else
                      {
                          return contains(RowValue.toLowerCase(), req.body.searchText.toLowerCase())  
                      }

                      // //Filter When 
                      // if(req.body.startDate.trim() != "" ||  req.body.endDate.trim() != "" )
                      // {
                                            
                      // }
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
                                  case "countryName": 
                                      return data.countryName.trim().toLowerCase();   
                                  case "totalRegisteredUser": 
                                      return data.totalRegisteredUser.toString().trim().toLowerCase();   
                                                                                                                                                                              
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
                                  case "countryName": 
                                      return data.countryName.trim().toLowerCase();   
                                  case "totalRegisteredUser": 
                                      return data.totalRegisteredUser.toString().trim().toLowerCase();   
                                                                                                                                                                             
                              }
                              
                          })   
                          .ToArray().slice(StartRow, EndRow)                        
                  }
                  else
                  {
                      result.records =  
                      new LINQ(data.items).OrderByDescending(function(data) 
                      { 
                          return data.totalRegisteredUser;     
                      })   
                      .ToArray().slice(StartRow, EndRow)   
                  }
                  
                  resolve(result);  
 
              });

              res.send(ResponseDTO.DataRetrievedSuccessfully(constant.ErrorCode.DataRetrievedSuccessfully, constant.ErrorMsg.DataRetrievedSuccessfully, promise ));  
          }
          else
          {
              console.log(err);
              res.send(ResponseDTO.TechnicalError());  
          }
      }); //.skip( 0 ).limit(5 );

           
    }
 
});



//For Feedback Count Report 
router.post('/FeedbackCountReport', (req, res) => {
     

    console.log(req.headers.languageid); 

    if(req.body.startDate == undefined || req.body.endDate == undefined)
    {
          console.log("Missing fields startDate or endDate"); 
          res.send(ResponseDTO.InvalidParameter()); 
    } 
    // else if(req.body.pageNo == undefined || req.body.pageSize == undefined || req.body.sortOrderId == undefined || req.body.sortFieldName == undefined || req.body.searchText == undefined )
    // {
    //     res.send(ResponseDTO.InvalidParameter()); 
    // }
    // else if(req.body.pageNo <= 0 || req.body.pageSize <= 0 || req.body.sortOrderId > constant.SortOrderId.Default || req.body.sortOrderId < constant.SortOrderId.Asc || ((req.body.sortOrderId == constant.SortOrderId.Asc || req.body.sortOrderId == constant.SortOrderId.Desc) && req.body.sortFieldName.trim() == "" ) )
    // {
    //   res.send(ResponseDTO.InvalidParameter()); 
    // }      
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


      // For Feedback List
      Feedback.aggregate(pipeline, async (err,  feedbacks) =>
      {    
          if(!err)
          { 
              
            //   var StartRow = (req.body.pageNo - 1) * req.body.pageSize;
            //   var EndRow = StartRow + req.body.pageSize ;
      
              let promise = await new Promise(function(resolve, reject) {

            
                  var data =  new LINQ(feedbacks)   
                  .Where(function(feedback) 
                  { 
                    //   var IsValidRecord = true;

                    //   console.log("feedback =>");      
                    //   console.log(feedback); 
                    //   var RowValue = " ";
                    //   RowValue += feedback.emailAddress == null ? " " : feedback.emailAddress + " ";
                    //   RowValue += feedback.feedback == null ? " " : feedback.feedback + " ";
                    //   RowValue += feedback.userName == null ? " " : feedback.userName + " ";
                    //   RowValue += feedback.mobileNo == null ? " " : feedback.mobileNo + " "; 
                    //   RowValue += feedback.createdDateTime == null ? " " : dateFormat(feedback.createdDateTime, appSetting.SystemConfiguration.AdminGridDateFormat)  + " ";
 

                    //   if(req.body.searchText.trim() == "")
                    //   {
                    //       IsValidRecord = contains(RowValue, " ") 
                    //   }
                    //   else
                    //   {
                    //       IsValidRecord = contains(RowValue.toLowerCase(), req.body.searchText.toLowerCase())  
                    //   }


                      if(req.body.startDate.trim() != "" && req.body.endDate.trim() != "")
                      {
                          //Check Particular Duration wise
                          //return IsValidRecord && (feedback.createdDateTime >= new Date(req.body.startDate) && feedback.createdDateTime <= new Date(req.body.endDate)); 
                          return (feedback.createdDateTime >= new Date(req.body.startDate) && feedback.createdDateTime <= new Date(req.body.endDate)); 
                      }
                      else if(req.body.startDate.trim() != "")
                      {
                          //Check Only StartDate 
                          //return IsValidRecord && (feedback.createdDateTime >= new Date(req.body.startDate)); 
                          return (feedback.createdDateTime >= new Date(req.body.startDate)); 
                      }
                      else if(req.body.endDate.trim() != "")
                      {
                          //Check Only EndDate 
                          //return IsValidRecord && (feedback.createdDateTime <= new Date(req.body.endDate)); 
                          return (feedback.createdDateTime <= new Date(req.body.endDate)); 
                      }
                      else 
                      {
                          //Display All
                          //return IsValidRecord && true;
                          return true;
                      }                        

                  });


                  var result = {
                      totalFeedbacks : data.items.length,
                      //records : [] 
                  } 

                //   if(constant.SortOrderId.Asc == req.body.sortOrderId)
                //   {
                //       result.records =  
                //           new LINQ(data.items).OrderBy(function(data) 
                //           { 
                //               switch(req.body.sortFieldName)
                //               {
                //                   case "feedback": 
                //                       return data.feedback.trim().toLowerCase();
                //                   case "emailAddress": 
                //                       return data.emailAddress.trim().toLowerCase();  
                //                   case "userName": 
                //                       return data.userName.trim().toLowerCase();
                //                   case "mobileNo": 
                //                       return data.mobileNo;
                //                   case "createdDateTime": 
                //                       return data.createdDateTime;                          
                //               }
                              
                //           })   
                //           .ToArray().slice(StartRow, EndRow)
                //   }
                //   else if(constant.SortOrderId.Desc == req.body.sortOrderId)
                //   {
                //       result.records =  
                //           new LINQ(data.items).OrderByDescending(function(data) 
                //           { 
                //               switch(req.body.sortFieldName)
                //               {
                //                   case "feedback": 
                //                       return data.feedback.trim().toLowerCase();
                //                   case "emailAddress": 
                //                       return data.emailAddress.trim().toLowerCase();  
                //                   case "userName": 
                //                       return data.userName.trim().toLowerCase();
                //                   case "mobileNo": 
                //                       return data.mobileNo;
                //                   case "createdDateTime": 
                //                       return data.createdDateTime;                          
                //               }
                              
                //           })   
                //           .ToArray().slice(StartRow, EndRow)                        
                //   }
                //   else
                //   {
                //       result.records =  
                //       new LINQ(data.items).OrderByDescending(function(data) 
                //       { 
                //           return data.createdDateTime; 
                //       })   
                //       .ToArray().slice(StartRow, EndRow)   
                //   }

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


//User Wise Paid To Provider and Admin Commission Report  (For User Side Only)
router.post('/UserPaidToConsultantsAndAdminCommissionReport', (req, res) => {
    console.log(req.body); 
     
    req.body.searchText = "";
    req.body.sortOrderId = 2;
    req.body.sortFieldName = "totalCommission";


    if(req.body.startDate == undefined || req.body.endDate == undefined || req.body.startDate == null || req.body.endDate == null)
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
                  "um": "$$ROOT"
              }
          }, 
          {
              $lookup: {
                  "localField": "um._id",
                  "from": "userdetails",
                  "foreignField": "user_Id",
                  "as": "ud"
              }
          }, 
          {
              $unwind: {
                  "path": "$ud",
                  "preserveNullAndEmptyArrays": true
              }
          }, 

          //--For Price   
          {
              $lookup:
              {
                  from: "userconsumptions",
                  //localField: "_id",
                  //foreignField: "provider_user_Id",

                  let: { userId: "$um._id" }, //, order_qty: "$ordered" 
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
                                      //{ $eq: [ "$isDeleted", false ]  }, 
                                      { $ne: [ "$price",  null ] },
                                      { $ne: [ "$commissionPercentage",  null ] },
                                      //{ $and : [{ $gte: [ "$createdDateTime", new Date(req.body.startDate) ] }, { $lte : [ "$createdDateTime", new Date(req.body.endDate) ] }] } 
                                      //{ $and : { $gte: [ "$createdDateTime", new Date(req.body.startDate) ] } } 
                                      { 
                                         // $cond: 
                                         // {  
                                              $switch: {
                                                  branches: [
                                                      { 
                                                          case: { $and : [{  $ne: [ req.body.startDate.trim(), "" ] }, {  $ne: [ req.body.endDate.trim(), "" ]  }] }, 
                                                              then: { $and : [{ $gte: [ "$createdDateTime", new Date(req.body.startDate) ] }, { $lte : [ "$createdDateTime", new Date(req.body.endDate) ] }] } 
                                                      },
                                                      { 
                                                          case: { $and : {  $ne: [ req.body.startDate.trim(), "" ] } }, 
                                                              then: { $and : { $gte: [ "$createdDateTime", new Date(req.body.startDate) ] } } 
                                                      },
                                                      { 
                                                          case: { $and :  {  $ne: [ req.body.endDate.trim(), "" ]  } }, 
                                                              then: { $and : { $lte : [ "$createdDateTime", new Date(req.body.endDate) ] } } 
                                                      }                                                        
                                                  ],
                                                  default: { $eq: [ "$createdDateTime", "$createdDateTime" ]  }
                                              },
                                           
                                              
                                      }                                         
                                  ],
                                                                       
                              }
                          }
                      }, 
                      {
                          $group: 
                          {
                              _id: "$consumer_user_Id",
                              //uniqueIds: {$addToSet: "$_id"},
                              totalConsumption : { $sum: "$price" },
                              totalProvidePrice : 
                              { 
                                  $sum: 
                                  { 
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
                                  }
                              }, 
                              totalCommission : 
                              { 
                                  $sum: {
                                      $ceil:
                                      {
                                          $divide: [
                                              { 
                                                  $multiply: [ "$price", "$commissionPercentage" ] 
                                              }, 100
                                          ] 
                                      }
                                  } 
                              } 
                          }
                      },
                      { 
                          $project: 
                          {  
                              totalConsumption: "$totalConsumption", 
                              totalProvidePrice : "$totalProvidePrice",
                              totalCommission: "$totalCommission",
                              _id : 0 
                          } 
                      }
                  ],   

                  as: "userConsumptions"

              }  
          },   
          //--Price End

          {
              $match: {
                  //"um.isActive": true,
                  //"um.isDeleted": false,
                  //"ud.isActive": true,
                  //"ud.isDeleted": false,
                  "um.userTypeId": ObjectId(constant.UserType.Consumer),
                  
                 // $concat: ["um.firstName", "um.emailAddress", " "] : req.body.searchText
              }
          }, 
          {
             // $sort: [['um._id','asc']] //, ['field2','desc']
              $sort : { "um._id" : -1 }
          },  
          {
              $project: {
                  userId: "$um._id",
                  firstName: "$um.firstName",
                  lastName: "$um.lastName",
                  middleName: "$um.middleName",
                  emailAddress: "$um.emailAddress",
                  mobileNo: "$um.mobileNo",
                  DOB: "$um.DOB",
                  genderId: "$um.genderId",
                  image: 
                  {
                      $concat: 
                      [
                          appSetting.SystemConfiguration.APIBaseUrl, appSetting.SystemConfiguration.UserDisplayImagePath,
                          {
                              $cond: 
                              {  
                                  if:
                                  {
                                      $eq : [ "$um.genderId", constant.Gender.Male ]
                                  },
                                  then : 
                                      appSetting.SystemConfiguration.UserMenDefaultImage,
                                  else : 
                                      appSetting.SystemConfiguration.UserWomenDefaultImage,

                                  // if: 
                                  // { 
                                  //     $or:[{
                                  //             $eq: [ "$um.image", null ] 
                                  //         },
                                  //         {
                                  //             $eq: [ "$um.image", "" ] 
                                  //         }] 
                                  // }, 
                                  // then: appSetting.SystemConfiguration.UserDefaultImage, 
                                  // else: 
                                  // { 
                                  //     $concat: 
                                  //     [ 
                                  //         { 
                                  //             $convert: 
                                  //             { 
                                  //                 input: "$um._id", to: "string" 
                                  //             } 
                                  //         }, "/", "$um.image" 
                                  //     ]
                                  // }
                              }               
                          }
                      ]
                  }, 
                  userTypeId : "$um.userTypeId",
                  createdDateTime: "$um.createdDateTime",
                  userDetailsId: "$ud._id", 
                  totalUserConsumption : 
                  {
                      $cond: [ 
                          {
                              $eq: ["$userConsumptions", [] ]
                          }, 0, 
                          {
                              $arrayElemAt:[ "$userConsumptions.totalConsumption", 0]
                          }] 
                  }, 
                  totalProvidePrice : 
                  {
                      $cond: [ 
                          {
                              $eq: ["$userConsumptions", [] ]
                          }, 0, 
                          {
                              $arrayElemAt:[ "$userConsumptions.totalProvidePrice", 0]
                          }] 
                  }, 
                  totalCommission : 
                  {
                      $cond: [ 
                          {
                              $eq: ["$userConsumptions", [] ]
                          }, 0, 
                          {
                              $arrayElemAt:[ "$userConsumptions.totalCommission", 0]
                          }] 
                  },                                          
                  _id: 0
              }
          }
      ];


      // For User List
      UserMaster.aggregate(pipeline, async (err, users) =>
      {    
          if(!err)
          { 
              //.slice((Page no - 1) * PageSize, ((Page no - 1) * PageSize) + PageSize);  1 -> 0 to 9,  2-> 10 to 19,  3 -> 20 to 29, ....
              var StartRow = (req.body.pageNo - 1) * req.body.pageSize;
              var EndRow = StartRow + req.body.pageSize ;
     

              let promise = await new Promise(function(resolve, reject) {

                  var data =  new LINQ(users)                
                  .Where(function(item) 
                  { 
                      //console.log(item);
                      var RowValue = " ";
                      RowValue += item.firstName == null ? " " : item.firstName + " ";
                      RowValue += item.emailAddress == null ? " " : item.emailAddress + " ";
                      RowValue += item.mobileNo == null ? " " : item.mobileNo + " ";
                      //RowValue += item.DOB == null ? " " : dateFormat(item.DOB, appSetting.SystemConfiguration.AdminGridDateFormat)  + " ";
                      //RowValue += item.image == null ? " " : item.image + " "; 
                      RowValue += item.genderId == null ? " " : item.genderId + " ";
                      RowValue += item.createdDateTime == null ? " " : dateFormat(item.createdDateTime, appSetting.SystemConfiguration.AdminGridDateFormat)  + " ";
                      RowValue += item.totalUserConsumption == null ? " " : item.totalUserConsumption + " ";
                      RowValue += item.totalProvidePrice == null ? " " : item.totalProvidePrice + " ";
                      RowValue += item.totalCommission == null ? " " : item.totalCommission + " ";

                      //var findSearch;
                      //console.log(RowValue);

                      if(req.body.searchText.trim() == "")
                      {
                          return contains(RowValue, " ") && !(item.totalProvidePrice == 0 && item.totalCommission == 0)
                      }
                      else
                      {
                          return contains(RowValue.toLowerCase(), req.body.searchText.toLowerCase()) && !(item.totalProvidePrice == 0 && item.totalCommission == 0)  
                      }

                      // //Filter When 
                      // if(req.body.startDate.trim() != "" ||  req.body.endDate.trim() != "" )
                      // {
                                            
                      // }
                  });
                  

                  var result = {
                      totalRecords : data.items.length, 
                      totalUserPaidToProvider : new LINQ(data.items).Sum(x => x.totalProvidePrice),
                      totalCommission : new LINQ(data.items).Sum(x => x.totalCommission),
                      records : [] 
                  } 


                  if(constant.SortOrderId.Asc == req.body.sortOrderId)
                  {
                      result.records =  
                          new LINQ(data.items).OrderBy(function(data) 
                          { 
                              switch(req.body.sortFieldName)
                              {
                                  case "firstName": 
                                      return data.firstName.trim().toLowerCase();   
                                  case "emailAddress": 
                                      return data.emailAddress.trim().toLowerCase();   
                                  case "mobileNo": 
                                      return data.mobileNo;   
                                  case "DOB": 
                                      return data.DOB;       
                                  case "genderId": 
                                      return data.genderId;   
                                  case "createdDateTime": 
                                      return data.createdDateTime;        
                                  case "totalUserConsumption": 
                                      return data.totalUserConsumption;   
                                  case "totalProvidePrice": 
                                      return data.totalProvidePrice;   
                                  case "totalCommission": 
                                      return data.totalCommission;                                                                                                                                             
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
                                  case "firstName": 
                                      return data.firstName.trim().toLowerCase();   
                                  case "emailAddress": 
                                      return data.emailAddress.trim().toLowerCase();   
                                  case "mobileNo": 
                                      return data.mobileNo;   
                                  case "DOB": 
                                      return data.DOB;                               
                                  case "genderId": 
                                      return data.genderId;      
                                  case "createdDateTime": 
                                      return data.createdDateTime;        
                                  case "totalUserConsumption": 
                                      return data.totalUserConsumption;     
                                  case "totalProvidePrice": 
                                      return data.totalProvidePrice;     
                                  case "totalCommission": 
                                      return data.totalCommission;                                                                                                                                               
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



                  // resolve (result = {
                  //     totalRecords : new LINQ(users)                
                  //         .Where(function(user) 
                  //         { 
                  //             return user.firstName != 'testupdates3@gmail.com' 
                  //         // return user.firstName == 'testupdates3@gmail.com' || user.firstName == 'Nilesh Kyada 18'; 
                  //         }).Count(),
                  //     records : new LINQ(users)                
                  //         .Where(function(user) 
                  //         { 
                  //             return user.firstName != 'testupdates3@gmail.com' 
                  //         // return user.firstName == 'testupdates3@gmail.com' || user.firstName == 'Nilesh Kyada 18'; 
                  //         }) 
                  //         .OrderBy(function(user) 
                  //         { 
                  //             switch(req.body.sortFieldName)
                  //             {
                  //                 case "emailAddress": 
                  //                     return user.emailAddress;
                  //                 case "firstName": 
                  //                     return user.firstName;                            
                  //             }
                              
                  //         })   
                  //         .ToArray().slice(StartRow, EndRow)
                  //});
              });

              res.send(ResponseDTO.DataRetrievedSuccessfully(constant.ErrorCode.DataRetrievedSuccessfully, constant.ErrorMsg.DataRetrievedSuccessfully, promise ));  
          }
          else
          {
              console.log(err);
              res.send(ResponseDTO.TechnicalError());  
          }
      }); //.skip( 0 ).limit(5 );

           
    }
 
});



//Age Group Wise Male Female count Report with Range filter, Paging  (For User Side Only)
router.post('/AgeGroupWiseGenderRegisteredReport', (req, res) => {
    console.log(req.body); 
    //console.log(getAge('1990-01-09'));

    
    req.body.sortOrderId = constant.SortOrderId.Asc;
    req.body.searchText = "";
    req.body.sortFieldName = "totalRegisteredUser";

    if(req.body.startDate == undefined || req.body.endDate == undefined || req.body.startDate == null || req.body.endDate == null)
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
                  "AGM": "$$ROOT"
              }
          }, 


          //--For Male Count   
          {
              $lookup:
              {
                  from: "usermasters",
                  //localField: "_id",
                  //foreignField: "provider_user_Id",

                  let: { fromAge: "$AGM.fromAge", toAge : "$AGM.toAge" }, //, order_qty: "$ordered" 
                  pipeline: [
                      { 
                          $match:
                          { 
                              //  lookupDetails_Id : $degree,
                              $expr:
                              { 
                                  $and:
                                  [ 
                                      //{ $eq: [ "$countryId",  "$$countryMasterId" ] },
                                      { $eq: [ "$isActive", true ] },
                                      { $eq: [ "$isDeleted", false ]  },   
                                      { $eq: [ "$genderId", constant.Gender.Male] },  
                                      { $eq: [ "$userTypeId", ObjectId(constant.UserType.Consumer) ] },
                                      { $ne: [ "$DOB", null] },
                                      { $ne: [ "$DOB", ""] },

                                      //For Age Group Filter
                                      // Calculate Age : {$divide: [{$subtract: [ new Date(), "$DOB" ] },  (365 * 24*60*60*1000)]}
                                      {  
                                            $switch: 
                                            {
                                                branches: [
                                                    { 
                                                        case: { $and : [{  $ne: [ "$$fromAge", -1 ] }, {  $ne: [ "$$toAge", -1 ]  }] }, 
                                                            then: { $and : [{ $gte: [ {$divide: [{$subtract: [ new Date(), "$DOB" ] },  (365 * 24*60*60*1000)]},"$$fromAge" ] }, { $lte : [ {$divide: [{$subtract: [ new Date(), "$DOB" ] },  (365 * 24*60*60*1000)]}, "$$toAge" ] }] } 
                                                    },
                                                    { 
                                                        case: { $and : {  $ne: [ "$$fromAge" , -1 ] } }, 
                                                            then: { $and : { $gte: [ {$divide: [{$subtract: [ new Date(), "$DOB" ] },  (365 * 24*60*60*1000)]}, "$$fromAge" ] } } 
                                                    },
                                                    { 
                                                        case: { $and :  {  $ne: [ "$$toAge", -1 ]  } }, 
                                                            then: { $and : { $lte : [ {$divide: [{$subtract: [ new Date(), "$DOB" ] },  (365 * 24*60*60*1000)]},  "$$toAge" ] } } 
                                                    }                                                        
                                                ],
                                                default: { $eq: [{$divide: [{$subtract: [ new Date(), "$DOB" ] },  (365 * 24*60*60*1000)]}, {$divide: [{$subtract: [ new Date(), "$DOB" ] },  (365 * 24*60*60*1000)]} ]  }
                                            }, 
                                        },

                                      //For Date Range Filter
                                      {  
                                            $switch: 
                                            {
                                                branches: [
                                                    { 
                                                        case: { $and : [{  $ne: [ req.body.startDate.trim(), "" ] }, {  $ne: [ req.body.endDate.trim(), "" ]  }] }, 
                                                            then: { $and : [{ $gte: [ "$createdDateTime", new Date(req.body.startDate) ] }, { $lte : [ "$createdDateTime", new Date(req.body.endDate) ] }] } 
                                                    },
                                                    { 
                                                        case: { $and : {  $ne: [ req.body.startDate.trim(), "" ] } }, 
                                                            then: { $and : { $gte: [ "$createdDateTime", new Date(req.body.startDate) ] } } 
                                                    },
                                                    { 
                                                        case: { $and :  {  $ne: [ req.body.endDate.trim(), "" ]  } }, 
                                                            then: { $and : { $lte : [ "$createdDateTime", new Date(req.body.endDate) ] } } 
                                                    }                                                        
                                                ],
                                                default: { $eq: [ "$createdDateTime", "$createdDateTime" ]  }
                                            }, 
                                        }
                                                                    
                                     ],
                                                                   
                                 }
                             }
                      }, 
                      {
                          $group: 
                          {
                              _id: "$AGM._id",
                              //uniqueIds: {$addToSet: "$_id"},
                              totalMaleRegisteredUser : { $sum: 1 } 
                          }
                      },
                      { 
                          $project: 
                          {  
                                totalMaleRegisteredUser : "$totalMaleRegisteredUser"//,
                                //totalRegisteredUser: "$totalRegisteredUser",  
                                // genderId :  "$genderId",  
                                // DOB :  "$DOB",    
                                // // Age : { 
                                // //   e :  getAge("1990-01-09") ,
                                // //   q :  { $substr: [ "$DOB", 0, 10 ] } , 
                                // //   w :  getAge({ $substr: [ "$DOB", 0, 10 ] }) 
                                // // }, // getAge({ $substr: [ "$DOB", 0, 10 ] } ),   //{ $substr: [ "$DOB", 0, 10 ] } 
                                // //"NewAge" : "$$newAge",
                                // NewAge : {  
                                //     $divide: [{$subtract: [ new Date(), "$DOB" ] },  (365 * 24*60*60*1000)]
                                // }//,
                                // ,createdDateTime : "$createdDateTime"

                                //_id :  
                          } 
                      }
                  ],   

                  as: "maleUser"

              }  
          },   

          //--For Female Count   
          {
            $lookup:
            {
                from: "usermasters",
                //localField: "_id",
                //foreignField: "provider_user_Id",

                let: { fromAge: "$AGM.fromAge", toAge : "$AGM.toAge" }, //, order_qty: "$ordered" 
                pipeline: [
                    { 
                        $match:
                        { 
                            //  lookupDetails_Id : $degree,
                            $expr:
                            { 
                                $and:
                                [ 
                                    //{ $eq: [ "$countryId",  "$$countryMasterId" ] },
                                    { $eq: [ "$isActive", true ] },
                                    { $eq: [ "$isDeleted", false ]  },   
                                    { $eq: [ "$genderId", constant.Gender.Female] },  
                                    { $eq: [ "$userTypeId", ObjectId(constant.UserType.Consumer) ] },
                                    { $ne: [ "$DOB", null] },
                                    { $ne: [ "$DOB", ""] },

                                    //For Age Group Filter
                                    // Calculate Age : {$divide: [{$subtract: [ new Date(), "$DOB" ] },  (365 * 24*60*60*1000)]}
                                    {  
                                          $switch: 
                                          {
                                              branches: [
                                                  { 
                                                      case: { $and : [{  $ne: [ "$$fromAge", -1 ] }, {  $ne: [ "$$toAge", -1 ]  }] }, 
                                                          then: { $and : [{ $gte: [ {$divide: [{$subtract: [ new Date(), "$DOB" ] },  (365 * 24*60*60*1000)]},"$$fromAge" ] }, { $lte : [ {$divide: [{$subtract: [ new Date(), "$DOB" ] },  (365 * 24*60*60*1000)]}, "$$toAge" ] }] } 
                                                  },
                                                  { 
                                                      case: { $and : {  $ne: [ "$$fromAge" , -1 ] } }, 
                                                          then: { $and : { $gte: [ {$divide: [{$subtract: [ new Date(), "$DOB" ] },  (365 * 24*60*60*1000)]}, "$$fromAge" ] } } 
                                                  },
                                                  { 
                                                      case: { $and :  {  $ne: [ "$$toAge", -1 ]  } }, 
                                                          then: { $and : { $lte : [ {$divide: [{$subtract: [ new Date(), "$DOB" ] },  (365 * 24*60*60*1000)]},  "$$toAge" ] } } 
                                                  }                                                        
                                              ],
                                              default: { $eq: [{$divide: [{$subtract: [ new Date(), "$DOB" ] },  (365 * 24*60*60*1000)]}, {$divide: [{$subtract: [ new Date(), "$DOB" ] },  (365 * 24*60*60*1000)]} ]  }
                                          }, 
                                      },

                                    //For Date Range Filter
                                    {  
                                          $switch: 
                                          {
                                              branches: [
                                                  { 
                                                      case: { $and : [{  $ne: [ req.body.startDate.trim(), "" ] }, {  $ne: [ req.body.endDate.trim(), "" ]  }] }, 
                                                          then: { $and : [{ $gte: [ "$createdDateTime", new Date(req.body.startDate) ] }, { $lte : [ "$createdDateTime", new Date(req.body.endDate) ] }] } 
                                                  },
                                                  { 
                                                      case: { $and : {  $ne: [ req.body.startDate.trim(), "" ] } }, 
                                                          then: { $and : { $gte: [ "$createdDateTime", new Date(req.body.startDate) ] } } 
                                                  },
                                                  { 
                                                      case: { $and :  {  $ne: [ req.body.endDate.trim(), "" ]  } }, 
                                                          then: { $and : { $lte : [ "$createdDateTime", new Date(req.body.endDate) ] } } 
                                                  }                                                        
                                              ],
                                              default: { $eq: [ "$createdDateTime", "$createdDateTime" ]  }
                                          }, 
                                      }
                                                                  
                                   ],
                                                                 
                               }
                           }
                    }, 
                    {
                        $group: 
                        {
                            _id: "$AGM._id",
                            //uniqueIds: {$addToSet: "$_id"},
                            totalFemaleRegisteredUser : { $sum: 1 } 
                        }
                    },
                    { 
                        $project: 
                        {  
                            totalFemaleRegisteredUser : "$totalFemaleRegisteredUser"//,
                              //totalRegisteredUser: "$totalRegisteredUser",  
                              // genderId :  "$genderId",  
                              // DOB :  "$DOB",    
                              // // Age : { 
                              // //   e :  getAge("1990-01-09") ,
                              // //   q :  { $substr: [ "$DOB", 0, 10 ] } , 
                              // //   w :  getAge({ $substr: [ "$DOB", 0, 10 ] }) 
                              // // }, // getAge({ $substr: [ "$DOB", 0, 10 ] } ),   //{ $substr: [ "$DOB", 0, 10 ] } 
                              // //"NewAge" : "$$newAge",
                              // NewAge : {  
                              //     $divide: [{$subtract: [ new Date(), "$DOB" ] },  (365 * 24*60*60*1000)]
                              // }//,
                              // ,createdDateTime : "$createdDateTime"

                              //_id :  
                        } 
                    }
                ],   

                as: "femaleUser"

            }  
        },            
          {
              $match: {
                  "AGM.isActive": true,
                  "AGM.isDeleted": false,   
              }
          }, 
          { 
              $sort : { "AGM.fromAge" : 1 }
          },  
          {
              $project: {
                  ageGroupMastersId : "$AGM._id",
                  ageGroupName : "$AGM.ageGroupName", 
                  fromAge : "$AGM.fromAge",
                  toAge : "$AGM.toAge",
                 // Age : getAge('1990-01-09'),
                  registerdMale : 
                  { 
                    $cond: [ 
                        {
                            $eq: ["$maleUser", [] ]
                        }, 0, 
                        {
                            $arrayElemAt:[ "$maleUser.totalMaleRegisteredUser", 0]
                        }] 
                 },  
                  registerdFemale :
                  { 
                    $cond: [ 
                        {
                            $eq: ["$femaleUser", [] ]
                        }, 0, 
                        {
                            $arrayElemAt:[ "$femaleUser.totalFemaleRegisteredUser", 0]
                        }] 
                 },         
                //   test : 
                //   { 
                //       $cond: [ 
                //           {
                //               $eq: ["$maleUser", [] ]
                //           }, 0,  "$maleUser"
                //           ] 
                //   },                                              
                  _id: 0
              }
          }
      ];


      // For User List
      AgeGroupMasters.aggregate(pipeline, async (err, users) =>
      {    
          //console.log(getAge("1990-01-09"+""));
          if(!err)
          { 
              //.slice((Page no - 1) * PageSize, ((Page no - 1) * PageSize) + PageSize);  1 -> 0 to 9,  2-> 10 to 19,  3 -> 20 to 29, ....
              var StartRow = (req.body.pageNo - 1) * req.body.pageSize;
              var EndRow = StartRow + req.body.pageSize ;
     

              let promise = await new Promise(function(resolve, reject) {

                  var data =  new LINQ(users)                
                  .Where(function(item) 
                  { 
                      //console.log(item);
                      var RowValue = " ";
                      RowValue += item.ageGroupName == null ? " " : item.ageGroupName + " ";
                      RowValue += item.fromAge == null ? " " : item.fromAge + " ";
                      RowValue += item.toAge == null ? " " : item.toAge + " ";
                      RowValue += item.registerdMale == null ? " " : item.registerdMale + " ";
                      RowValue += item.registerdFemale == null ? " " : item.registerdFemale + " ";
                      
                       

                      if(req.body.searchText.trim() == "")
                      {
                          return contains(RowValue, " ") 
                      }
                      else
                      {
                          return contains(RowValue.toLowerCase(), req.body.searchText.toLowerCase())  
                      }

                      // //Filter When 
                      // if(req.body.startDate.trim() != "" ||  req.body.endDate.trim() != "" )
                      // {
                                            
                      // }
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
                                case "ageGroupName": 
                                    return data.ageGroupName.trim().toLowerCase();   
                                case "fromAge": 
                                    return data.fromAge.toString().trim().toLowerCase();   
                                case "toAge": 
                                    return data.toAge.toString().trim().toLowerCase(); 
                                case "registerdMale": 
                                    return data.registerdMale.toString().trim().toLowerCase(); 
                                case "registerdFemale": 
                                    return data.registerdFemale.toString().trim().toLowerCase();                                                                                                                   
                                                                                                                                                                
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
                                case "ageGroupName": 
                                    return data.ageGroupName.trim().toLowerCase();   
                                case "fromAge": 
                                    return data.fromAge.toString().trim().toLowerCase();   
                                case "toAge": 
                                    return data.toAge.toString().trim().toLowerCase();   
                                case "registerdMale": 
                                    return data.registerdMale.toString().trim().toLowerCase();   
                                case "registerdFemale": 
                                    return data.registerdFemale.toString().trim().toLowerCase();                                         
                                                                                                                                                          
                              }
                              
                          })   
                          .ToArray().slice(StartRow, EndRow)                        
                  }
                  else
                  {
                      result.records =  
                      new LINQ(data.items).OrderByDescending(function(data) 
                      { 
                          return data.fromAge;     
                      })   
                      .ToArray().slice(StartRow, EndRow)   
                  }
                  
                  resolve(result);  
 
              });

              res.send(ResponseDTO.DataRetrievedSuccessfully(constant.ErrorCode.DataRetrievedSuccessfully, constant.ErrorMsg.DataRetrievedSuccessfully, promise ));  
          }
          else
          {
              console.log(err);
              res.send(ResponseDTO.TechnicalError());  
          }
      }); //.skip( 0 ).limit(5 );

           
    }
 
});



module.exports = router;