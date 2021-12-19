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
var { CreditPlans, WithdrawDetails, UserMaster } = require('../models/entity');
//var { Employee } = require('../models/-employee');
var ResponseDTO = require('../../../DTO/Consumer/ResponseDTO');   
var contains = require("string-contains");
var dateFormat = require('dateformat');
// => localhost:3000/account/

  
// For Category List with filter, search, sorting, paging

 

//For Withdraw List
router.post('/WithdrawList', (req, res) => {
    
    console.log(req.headers.languageid); 
     
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

      var pipeline = [ 
          {
              $project: {
                  "_id": 0,
                  "wd": "$$ROOT"
              }
          },  
          {
              $lookup:
              {
                  from: "usermasters",  
                  let: { userId: "$wd.user_Id" }, //languageId : req.headers.languageid, order_qty: "$ordered" 
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
                                emailAddress : "$emailAddress",
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
                  "wd.isActive": true,
                  "wd.isDeleted": false, 
             }
          }, 
          {
             // $sort: [['um._id','asc']] //, ['field2','desc']
              $sort : { "wd.createdDateTime" : -1 }
          },  
          {
              $project: {
                  withdrawDetailsId: "$wd._id", 
                  emailAddress : "$usermasters.emailAddress",
                  isWithdraw : "$wd.isWithdraw",
                  userName: "$usermasters.userName",
                  mobileNo: "$usermasters.mobileNo",
                  image: "$usermasters.image",
                  genderId: "$usermasters.genderId", 
                  price: "$wd.price", 
                  requestDateTime: "$wd.requestDateTime", 
                  withdrawDateTime : "$wd.withdrawDateTime", 
                  createdDateTime: "$wd.createdDateTime", 
                  _id: 0
              }
          }
      ];


      // For Withdraw Details
      WithdrawDetails.aggregate(pipeline, async (err,  withdrawDetails) =>
      {    
          if(!err)
          { 
              //.slice((Page no - 1) * PageSize, ((Page no - 1) * PageSize) + PageSize);  1 -> 0 to 9,  2-> 10 to 19,  3 -> 20 to 29, ....
              var StartRow = (req.body.pageNo - 1) * req.body.pageSize;
              var EndRow = StartRow + req.body.pageSize ;
     
              console.log(withdrawDetails);

              let promise = await new Promise(function(resolve, reject) {

 

                var data =  new LINQ(withdrawDetails)                
                .Where(function(item) 
                { 
                    var RowValue = " ";
                    RowValue += item.emailAddress == null ? " " : item.emailAddress + " ";
                    RowValue += item.isWithdraw == null ? " " : item.isWithdraw + " ";
                    RowValue += item.userName == null ? " " : item.userName + " ";
                    RowValue += item.mobileNo == null ? " " : item.mobileNo + " ";
                    //RowValue += item.image == null ? " " : item.image + " "; 
                    RowValue += item.genderId == null ? " " : item.genderId + " ";
                    RowValue += item.price == null ? " " : item.price + " ";
                    RowValue += item.requestDateTime == null ? " " : dateFormat(item.requestDateTime, appSetting.SystemConfiguration.AdminGridDateFormat)  + " ";
                    RowValue += item.withdrawDateTime == null ? " " : dateFormat(item.withdrawDateTime, appSetting.SystemConfiguration.AdminGridDateFormat)  + " ";
                    RowValue += item.createdDateTime == null ? " " : dateFormat(item.createdDateTime, appSetting.SystemConfiguration.AdminGridDateFormat)  + " ";

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
                                case "emailAddress": 
                                    return data.emailAddress.trim().toLowerCase();   
                                case "isWithdraw": 
                                    return data.isWithdraw;   
                                case "userName": 
                                    return data.userName.trim().toLowerCase();   
                                case "mobileNo": 
                                    return data.mobileNo;       
                                case "genderId": 
                                    return data.genderId;   
                                case "price": 
                                    return data.price;               
                                case "requestDateTime": 
                                    return data.requestDateTime;  
                                case "withdrawDateTime": 
                                    return data.withdrawDateTime;                          
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
                                case "emailAddress": 
                                    return data.emailAddress.trim().toLowerCase();   
                                case "isWithdraw": 
                                    return data.isWithdraw;   
                                case "userName": 
                                    return data.userName.trim().toLowerCase();   
                                case "mobileNo": 
                                    return data.mobileNo;                               
                                case "genderId": 
                                    return data.genderId;      
                                case "price": 
                                    return data.price;   
                                case "requestDateTime": 
                                    return data.requestDateTime;  
                                case "withdrawDateTime": 
                                    return data.withdrawDateTime;  
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



                //   resolve (result = {
                //       totalRecords : new LINQ(withdrawDetails)                
                //           .Where(function(withdrawDetail) 
                //           { 
                //               return withdrawDetail.emailAddress != 'testupdates3@gmail.com' 
                //               // return withdrawDetail.firstName == 'testupdates3@gmail.com' || withdrawDetail.firstName == 'Nilesh Kyada 18'; 
                //           }).Count(),
                //       records : new LINQ(withdrawDetails)                
                //           .Where(function(withdrawDetail) 
                //           { 
                //               return withdrawDetail.emailAddress != 'testupdates3@gmail.com' 
                //               // return withdrawDetail.firstName == 'testupdates3@gmail.com' || withdrawDetail.firstName == 'Nilesh Kyada 18'; 
                //           }) 
                //           .OrderBy(function(withdrawDetail) 
                //           { 
                //               switch(req.body.sortFieldName)
                //               {
                //                   // case "emailAddress": 
                //                   //     return withdrawDetail.emailAddress;
                //                   case "emailAddress": 
                //                       return withdrawDetail.emailAddress;                            
                //               }
                              
                //           })   
                //           .ToArray().slice(StartRow, EndRow)
                //   });
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
router.post('/PaidByAdmin', (req, res) => {

 
    if(req.body.withdrawDetailsId == undefined || req.body.withdrawDetailsId.trim() == "")
    {
        res.send(ResponseDTO.InvalidParameter()); 
    }
    else
    { 
            //Edit PaidByAdmin Details
            WithdrawDetails.count({ _id : ObjectId(req.body.withdrawDetailsId), isActive : true, isWithdraw : false }, async (err, IsExistWithdrawDetails) => {
                console.log(IsExistWithdrawDetails);
 
                if(!err)
                {
                    if(IsExistWithdrawDetails > 0)
                    {
                         
                        WithdrawDetails.update(
                            { _id : ObjectId(req.body.withdrawDetailsId), isActive : true, isWithdraw : false }, 
                            { $set: { isWithdraw : true, withdrawDateTime : new Date(), updatedBy: ObjectId(req.headers.userId), updatedDateTime : new Date() } }, function(err, withdrawDetail) {
                         
                            if (!err)  
                            {
                                if(withdrawDetail.n > 0)
                                {  
                                    console.log("withdraw Detail Updated successfully.");  
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


 
 
});
 

module.exports = router;