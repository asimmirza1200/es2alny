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
   
var multer = require('multer')

var LINQ = require('node-linq').LINQ;
var path = require('path');
//const upload = multer({dest: __dirname + '/uploads/images'}); 
const roundTo = require('round-to');
 
var constant = require('../../../CommonUtility/constant');   

// constant.SUMMER.BEGINNING 
var { PaymentDetails, LoginToken, DeviceTokenMasters, UserMaster, UserDetails, ProviderDetails, ProviderLangDetails,  LookupLangDetails, UserPurchases, UserConsumptions } = require('../models/entity');
//var { Employee } = require('../models/-employee');
var ResponseDTO = require('../../../DTO/Consumer/ResponseDTO');   
var Helper = require('./Helper.js');
var contains = require("string-contains");
var dateFormat = require('dateformat');
// => localhost:3000/account/

  
// For UserList with filter, search, sorting, paging
router.post('/UserList', (req, res) => {
      console.log(req.body); 
      
      req.body.startDate = "";
      req.body.endDate = "";

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
                                        { $eq: [ "$isDeleted", false ]  }, 
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
                                             
                                                // if: 
                                                // { 
                                                //     $and : [{  $ne: [ req.body.startDate.trim(), "" ] }, {  $ne: [ req.body.endDate.trim(), "" ]  }] 
                                                // }, 
                                                // then:  
                                                // { 
                                                //     $and : [{ $gte: [ "$createdDateTime", new Date(req.body.startDate) ] }, { $lte : [ "$createdDateTime", new Date(req.body.endDate) ] }] 
                                                // }, 
                                                // else : 
                                                // { 
                                                //     if: 
                                                //     { 
                                                //         $ne: [ req.body.startDate.trim(), "" ] 
                                                //     }, 
                                                //     then:  
                                                //     { 
                                                //         $and : { $gte: [ "$createdDateTime", new Date(req.body.startDate) ] }
                                                //     }, 
                                                //     else : 
                                                //     { 
                                                //         if: 
                                                //         {  
                                                //             $and :  {  $ne: [ req.body.endDate.trim(), "" ]  }
                                                //         }, 
                                                //         then:  
                                                //         { 
                                                //             $and : { $lte : [ "$createdDateTime", new Date(req.body.endDate) ] }
                                                //         }, 
                                                //         else : 
                                                //         { 
                                                //             $eq: [ "$createdDateTime", "$createdDateTime" ]  
                                                //         }                                                          
                                                //     }                                                    
                                                // }
                                          //  }    
                                        }                                         
                                    ],
                                    //$and : [{ $gte: [ "$createdDateTime", new Date(req.body.startDate) ] }, { $lte : [ "$createdDateTime", new Date(req.body.endDate) ] }] ,

                                        
                                    // $cond: 
                                    // { 

                                    //     $switch: {
                                    //         branches: [
                                    //             { 
                                    //                case: { $and : [{  $ne: [ req.body.startDate.trim(), "" ] }, {  $ne: [ req.body.endDate.trim(), "" ]  }] }, 
                                    //                     then: { $and : [{ $gte: [ "$createdDateTime", new Date(req.body.startDate) ] }, { $lte : [ "$createdDateTime", new Date(req.body.endDate) ] }] } 
                                    //             },
                                    //             { 
                                    //                 case: { $and : {  $ne: [ req.body.startDate.trim(), "" ] } }, 
                                    //                     then: { $and : { $gte: [ "$createdDateTime", new Date(req.body.startDate) ] } } 
                                    //             },
                                    //             { 
                                    //                 case: { $and :  {  $ne: [ req.body.endDate.trim(), "" ]  } }, 
                                    //                      then: { $and : { $lte : [ "$createdDateTime", new Date(req.body.endDate) ] } } 
                                    //             }                                                        
                                    //         ],
                                    //         //default: <expression>
                                    //      },

                                    //     // if: 
                                    //     // { 
                                    //     //     $and : [{  $ne: [ req.body.startDate.trim(), "" ] }, {  $ne: [ req.body.endDate.trim(), "" ]  }] 
                                    //     // }, 
                                    //     // then:  
                                    //     // { 
                                    //     //     $and : [{ $gte: [ "$createdDateTime", new Date(req.body.startDate) ] }, { $lte : [ "$createdDateTime", new Date(req.body.endDate) ] }] 
                                    //     // }, 
                                    //     // else : 
                                    //     // { 
                                    //     //     $and : [{ $gte: [ "$createdDateTime", new Date(req.body.startDate) ] }, { $lte : [ "$createdDateTime", new Date(req.body.endDate) ] }] , 
                                    //     // }
                                    // }                                      
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
            // {
            //     $unwind:"$userConsumptions"
            // },                                                                  
            // {
            //     $match : 
            //     { 
            //         _id : ObjectId(userId), userTypeId : ObjectId(constant.UserType.Consumer), isActive : true, isDeleted : false
            //     }
            // },
            //--Price End

            {
                $match: {
                    "um.isActive": true,
                    "um.isDeleted": false,
                    "ud.isActive": true,
                    "ud.isDeleted": false,
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

 

//For Create Consumer Details
router.post('/CreateConsumer', (req, res) => {

    console.log(req.body);
    if(req.body.firstName == undefined || req.body.lastName == undefined || req.body.middleName == undefined || req.body.emailAddress == undefined || req.body.mobileNo == undefined || req.body.DOB == undefined || req.body.genderId == undefined || req.body.userTypeId == undefined || !req.body.firstName.trim() || !req.body.userTypeId.trim() || !req.body.mobileNo.trim() || req.body.emailAddress.trim() == "")
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
                                        createdBy : ObjectId(req.headers.userid),
                                        createdDateTime : new Date(),
                                        updatedBy : null,
                                        updatedDateTime : null
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
                                                    createdBy : ObjectId(req.headers.userid),
                                                    createdDateTime : new Date(),
                                                    updatedBy : null,
                                                    updatedDateTime : null
                                                });
                                
                                                userDetails.save((err, userDetailsDoc) => {
                                                    if (!err) { 
                                                        
                                                        if(!userDetailsDoc.length)
                                                        {
                                                            //Data Retrieved Successfully 
                                                            //addUpdateDeviceToken(userMasterDoc._id, req.headers.appid, req.headers.deviceid, req.body.deviceToken);
            
                                                            //const tokgen = new TokenGenerator(256, TokenGenerator.BASE62);  
                                                            //var loginToken = tokgen.generate();
                                                            //addUpdateLoginToken(userMasterDoc._id, req.headers.appid, req.headers.deviceid, loginToken);
                                                                
                                                           // getTotalPurchasesAndConsumptionsByUserIdgetTotalPurchasesAndConsumptionsByUserId(userMasterDoc._id).then(function (walletDetails) {
                                                            //    console.log(walletDetails);

                                                                userMasterDoc.image = appSetting.SystemConfiguration.APIBaseUrl + appSetting.SystemConfiguration.UserDisplayImagePath + (userMasterDoc.image == null || userMasterDoc.image == "" ? appSetting.SystemConfiguration.UserDefaultImage : userMasterDoc._id +"/"+ userMasterDoc.image);

                                                                res.send(ResponseDTO.GetConsumerDetails(constant.ErrorCode.RegistrationSuccessfully, constant.ErrorMsg.RegistrationSuccessfully , userMasterDoc, userDetailsDoc, "", 0) );
                                                           // });
                                                            
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

  

// For Update Consumer Details
router.post('/UpdateConsumer', (req, res) => {
 
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

        console.log(req.headers);
 
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
                    UserMaster.updateOne({ _id: ObjectId(req.body.userId), isActive : true, isDeleted : false }, { $set: { firstName : req.body.firstName, lastName : req.body.lastName, middleName : req.body.middleName, emailAddress : req.body.emailAddress, DOB : req.body.DOB, genderId : req.body.genderId, updatedBy: ObjectId(req.headers.userid), updatedDateTime : new Date() } }, function(err, result) {
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



// For Delete Consumer Details 
router.post('/DeleteConsumer', (req, res) => {

 
    if(req.body.userId == undefined)
    {
        res.send(ResponseDTO.InvalidParameter()); 
    }
    else
    {  
        // Delete User Details


        // Delete User Details
        UserMaster.find({ _id: req.body.userId }, (err, userMaster)  => 
        {  
            if(!err)
            {
                if(userMaster.length)
                {
                    //Update
                    UserMaster.updateOne({ _id: req.body.userId }, { $set: { isDeleted : true } }, function(err, UserMasterDoc) {
                        if (!err) 
                        {
                                console.log("Delete User Master"); 
                                // Delete User Details
                                UserDetails.find({ user_Id: req.body.userId },(err, userDetails) => 
                                {  
                                    if(!err)
                                    {
                                        if(userDetails.length)
                                        {
                                            //Update
                                            UserDetails.updateOne({ user_Id: req.body.userId }, { $set: { isDeleted : true } }, function(err, UserDetailsDoc) {
                                                if (!err)
                                                { 
                                                     
                                                    LoginToken.updateMany({ user_Id: req.body.userId }, { $set: { isActive : false } }, function(err, LoginToken) {
                                                        if (err)
                                                        {
                                                            res.send(ResponseDTO.TechnicalError());
                                                        } 
                                                        else
                                                        {
                                                            console.log("Delete Login Token Details"); 
                                                        } 
                                                    }); 
                                                              
                                                    DeviceTokenMasters.updateMany({ user_Id: req.body.userId }, { $set: { isActive : false } }, function(err, DeviceTokenMasters) {
                                                        if (err)
                                                        {
                                                            res.send(ResponseDTO.TechnicalError());
                                                        } 
                                                        else
                                                        {
                                                            console.log("Delete Push Notification Details"); 
                                                        }   
                                                    }); 
                                                          
                                                    console.log("Delete User Details"); 
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
                                            res.send(ResponseDTO.ErrorMassage(constant.ErrorCode.InvalidUserId, constant.ErrorMsg.InvalidUserId, {}));
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
                            res.send(ResponseDTO.TechnicalError());
                        }
                        
                        
                    }); 
                }
                else
                {  
                    res.send(ResponseDTO.ErrorMassage(constant.ErrorCode.InvalidUserId, constant.ErrorMsg.InvalidUserId, {}));
                } 
            }
            else
            {
                res.send(ResponseDTO.TechnicalError());
            }
    
        }); 
      

    }

  
});



//Add Credits By Admin For User (Consumer)
router.post('/AddCreditsByAdmin', (req, res) => {

    if(req.body.userId == undefined || req.body.userId.trim() == "" || req.body.price == undefined || req.body.price <= 0 || req.body.message == undefined )
    {
        res.send(ResponseDTO.InvalidParameter()); 
    }
    else if(req.body.price % 1 != 0)
    {
        res.send(ResponseDTO.InvalidParameter()); 
    } 
    else
    {  
          
        UserMaster.count({_id : ObjectId(req.body.userId), isActive : true, isDeleted : false, userTypeId : ObjectId(constant.UserType.Consumer) }, (err, IsExistUser) => {

            if(!err)
            {
                if(IsExistUser > 0)
                {
 
                    var paymentDetails = new PaymentDetails({ 
                        user_Id: ObjectId(req.body.userId),
                        orderId: null,
                        trackingId: null,
                        bankRefNo: null,
                        orderStatus: "SUCCESS",
                        failureMessage: null,
                        paymentMode: "Admin",
                        cardName: null,
                        statusCode: 1, //1 - Success, 0 - Fail
                        statusMessage: req.body.message ,
                        price: req.body.price,
                        paymentGetwayType: constant.PaymentType.AddByAdmin,
                        isActive: true,
                        isDeleted: false,
                        createdBy: ObjectId(req.headers.userid),
                        createdDateTime: new Date(),
                        updatedBy: null,
                        updatedDateTime: null,
                        //planId: ""
                    });
                    
                    paymentDetails.save((err, paymentDetailsDoc) => {
                        if (!err) {
                            if (!paymentDetailsDoc.length) {
                                var userPurchases = new UserPurchases({
                                user_Id: ObjectId(req.body.userId),
                                payment_Id: ObjectId(paymentDetailsDoc._id),
                                price: req.body.price,
                                expiryDate: null,
                                isActive: true,
                                isDeleted: false,
                                createdBy: ObjectId(req.headers.userid),
                                createdDateTime: new Date(),
                                updatedBy: null,
                                updatedDateTime: null
                                });
                        
                                if(paymentDetails.statusCode == 1)
                                {
                                    userPurchases.save((err, userPurchasesDoc) => {
                                        if (!err) {
                                            if (!userPurchasesDoc.length) 
                                            { 

                                                var pipeline = [ 
                                                    {
                                                        $project: {
                                                            "_id": 0,
                                                            "dtm": "$$ROOT"
                                                        }
                                                    },      
                                                    {
                                                        $match: { 
                                                            "dtm.isActive": true,
                                                            "dtm.isDeleted": false,
                                                            "dtm.user_Id" : ObjectId(req.body.userId)
                                                       }
                                                    },  
                                                    {
                                                        $project: {
                                                            userId: "$dtm.user_Id", 
                                                            deviceId : "$dtm.deviceId",
                                                            deviceToken : "$dtm.deviceToken", 
                                                            appId: "$dtm.appId", 
                                                            title: "Amount Credited",
                                                            message : { $concat : [ req.body.price+"", " ", constant.CurrencySymbol.Kuwait, " added successfully in your wallet."] }, 
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
                                                        console.log(UserTokens); 
                                                        Helper.SendPushNotification(UserTokens); 
                                                        res.send(ResponseDTO.ErrorMassage(constant.ErrorCode.PaymentSuccessfully, constant.ErrorMsg.PaymentSuccessfully, {} ) );
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
                                                res.send(ResponseDTO.TechnicalError());
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
                                    res.send(ResponseDTO.TechnicalError());           
                                }
                        
                        
                            } 
                            else 
                            {
                                //throw err;
                                res.send(ResponseDTO.TechnicalError()); 
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
            }
            else
            {
                res.send(ResponseDTO.TechnicalError()); 
            }

        });


    }
 
});
 
 

//For Transaction Details with Current Balance
router.post('/TransactionHistory', (req, res) => {
    //  console.log(req.body);

    // console.log(roundTo(123.000999 , 0))
    // console.log(roundTo(123.12 , 0))

    // console.log(roundTo(123.49 , 0))
    // console.log(roundTo(123.50 , 0))
    
    // console.log(roundTo(123.51 , 0))
    // console.log(roundTo(123.55 , 0))

    // console.log(roundTo(123.60 , 0))
    // console.log(roundTo(123.99 , 0))

    if(req.body.pageNo == undefined || req.body.pageSize == undefined || req.body.sortOrderId == undefined || req.body.sortFieldName == undefined || req.body.searchText == undefined )
    {
      res.send(ResponseDTO.InvalidParameter()); 
    }
    else if(req.body.pageNo <= 0 || req.body.pageSize <= 0 || req.body.sortOrderId > constant.SortOrderId.Default || req.body.sortOrderId < constant.SortOrderId.Asc || ((req.body.sortOrderId == constant.SortOrderId.Asc || req.body.sortOrderId == constant.SortOrderId.Desc) && req.body.sortFieldName.trim() == "" ) )
    {
      res.send(ResponseDTO.InvalidParameter()); 
    }
    else if(req.body.userId == undefined || req.body.userId.trim() == "" )
    {
        res.send(ResponseDTO.InvalidParameter()); 
    }
    else
    {  
     
     
             UserMaster.aggregate(
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
                                                { $eq: [ "$isDeleted", false ] }, 
                                                { $ne: [ "$price",  null ] }
                                            ]
                                        }
                                    }
                                }, 
                                { 
                                    $project: 
                                    { 
                             
                                        image : //"", 
                                        {
                                            $concat: 
                                            [
                                                appSetting.SystemConfiguration.APIBaseUrl, 
                                                appSetting.SystemConfiguration.UserDisplayImagePath,
                                                appSetting.SystemConfiguration.AddMoneyDefaultImage
                                            ]
                                        }, 
                                        providerName : "Money Added",
                                        genderId : 
                                        {
                                            $convert: 
                                            { 
                                                input: 0, to: "double" 
                                            }
                                        }, 
                                        price: "$price", 
                                        createdDateTime : "$createdDateTime", 
                                        currentDateTime : new Date(),
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
                        $match : 
                        { 
                            _id : ObjectId(req.body.userId), userTypeId : ObjectId(constant.UserType.Consumer), isActive : true, isDeleted : false
                        }
                    },   
                    {
                        $project:
                        {  
                            _id: 0, 
                            userPurchases : "$userPurchases",  
                        }
                    },  
                ], (err, userPurchasesDetail) =>
                {      
                    if(!err)
                    {

                        UserConsumptions.aggregate(
                            [    
                                {
                                    $lookup:
                                    {
                                        from: "usermasters",
                                        //localField: "_id",
                                        //foreignField: "provider_user_Id",
                    
                                        let: { provider_user_Id: "$provider_user_Id" }, //, order_qty: "$ordered" 
                                        pipeline: [
                                            { 
                                                $match:
                                                { 
                                                    //  lookupDetails_Id : $degree,
                                                    $expr:
                                                    { 
                                                        $and:
                                                        [ 
                                                            { $eq: [ "$_id",  "$$provider_user_Id" ] },
                                                            { $eq: [ "$isActive", true ] },
                                                            //{ $eq: [ "$isDeleted", false ]  }, 
                                                            //{ $ne: [ "$price",  null ] }
                                                        ]
                                                    }
                                                }
                                            },  
                                            { 
                                                $project: 
                                                { 
                                                    image : 
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
                                                    providerName : "$firstName",
                                                    //provider_user_Id : "$provider_user_Id",
                                                    genderId : "$genderId",
                                                    //price: "$price", 
                                                    //createdDateTime : "$createdDateTime", 
                                                    //currentDateTime : new Date(), 
                                                    _id : 0 
                                                } 
                                            }
                                        ],   
                    
                                        as: "usermasters",
                                        
                                 
                                    }  
                                },   
                                {
                                    $unwind:"$usermasters"
                                },                                                    
                                {
                                    $match : 
                                    { 
                                        consumer_user_Id : ObjectId(req.body.userId), isActive : true, isDeleted : false
                                    }
                                },   
                                {
                                    $project:
                                    {  
                                        image : "$usermasters.image", 
                                        providerName : "$usermasters.providerName",
                                        //provider_user_Id : "$provider_user_Id",
                                        genderId : "$usermasters.genderId",
                                        price: "$price", 
                                        createdDateTime : "$createdDateTime", 
                                        currentDateTime : new Date(), 
                                        _id : 0  
                                    }
                                },  
                            ], async (err, userConsumptions) =>
                            {      
                                if(!err)
                                {
                                    // console.log(userPurchasesDetail);  
                                    // console.log(userConsumptions);  
                                    
                                    if(userPurchasesDetail.length > 0)
                                    {
                                        userPurchasesDetail[0].userPurchases.forEach( async function(item){
                                            userConsumptions.push(item);
                                        });
                                    }
                                    transactionDetails = userConsumptions;
                                    //     walletBalance : transactionDetail[0].currentBalance,
                                    //     transactionHistory : userConsumptions
                                    // }
            

                                    var StartRow = (req.body.pageNo - 1) * req.body.pageSize;
                                    var EndRow = StartRow + req.body.pageSize ;
                    
                                    var WalletDetails = await Helper.getWalletDetailsByUserId(req.body.userId);
                    
                                    let promise = await new Promise(async function(resolve, reject) {
 
                                        var data =  new LINQ(transactionDetails)                
                                        .Where(function(item) 
                                        { 
                                            var RowValue = " ";
                                            //RowValue += item.image == null ? " " : item.image + " "; 
                                            RowValue += item.providerName == null ? " " : item.providerName + " ";
                                            RowValue += item.genderId == null ? " " : item.genderId + " ";
                                            RowValue += item.price == null ? " " : item.price + " ";
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
                                            walletBalance : WalletDetails.CurrentBalance,
                                            transactionHistory : [] 
                                        } 
                    
                    
                                        if(constant.SortOrderId.Asc == req.body.sortOrderId)
                                        {
                                            result.transactionHistory =  
                                                new LINQ(data.items).OrderBy(function(data) 
                                                { 
                                                    switch(req.body.sortFieldName)
                                                    {
                                                        case "providerName": 
                                                            return data.providerName.trim().toLowerCase();
                                                        case "genderId": 
                                                            return data.genderId; 
                                                        case "price": 
                                                            return data.price; 
                                                        case "createdDateTime": 
                                                            return data.createdDateTime;                          
                                                    }
                                                    
                                                })   
                                                .ToArray().slice(StartRow, EndRow)
                                        }
                                        else if(constant.SortOrderId.Desc == req.body.sortOrderId)
                                        {
                                            result.transactionHistory =  
                                                new LINQ(data.items).OrderByDescending(function(data) 
                                                { 
                                                    switch(req.body.sortFieldName)
                                                    {
                                                        case "providerName": 
                                                            return data.providerName.trim().toLowerCase();
                                                        case "genderId": 
                                                            return data.genderId; 
                                                        case "price": 
                                                            return data.price; 
                                                        case "createdDateTime": 
                                                            return data.createdDateTime;                         
                                                    }
                                                    
                                                })   
                                                .ToArray().slice(StartRow, EndRow)                        
                                        }
                                        else
                                        {
                                            result.transactionHistory =  
                                            new LINQ(data.items).OrderByDescending(function(data) 
                                            { 
                                                return data.createdDateTime;     
                                            })   
                                            .ToArray().slice(StartRow, EndRow)   
                                        }
                                        
                                        resolve(result);  



                                        // resolve(result = {
                                        //     totalRecords : new LINQ(transactionDetails)                
                                        //     .Where(function() 
                                        //     { 
                                        //         return true  
                                        //     }).Count(),
                                        //     walletBalance : WalletDetails.CurrentBalance,
                                        //     transactionHistory : await (
                                        //         new LINQ(transactionDetails) 
                                        //         .OrderByDescending(function(transactionDetail) 
                                        //         {  
                                        //             //console.log(transactionDetail);
                                        //             return transactionDetail.createdDateTime;   
                                        //         })   
                                        //         //.ToArray().slice(0, 500)
                                        //         .ToArray().slice(StartRow, EndRow)
                                        //     )
                                        // });
                                    });
                    
                                    // data.UserId = transactionDetail[0].userId;
                                    // data.TotalPurchase = transactionDetail[0].totalPurchases;
                                    // data.TotalConsumption = transactionDetail[0].totalConsumptions;
                                    // data.CurrentBalance = transactionDetail[0].currentBalance;
                                
                                    // console.log(data);
            
                           
             
                                    // console.log(data);
                                    res.send(ResponseDTO.DataRetrievedSuccessfully(constant.ErrorCode.DataRetrievedSuccessfully, constant.ErrorMsg.DataRetrievedSuccessfully, promise ));  
                                    //resolve (data);
                                }
                                else
                                {
                                    res.send(ResponseDTO.TechnicalError());  
                                }
                            });

                    }
                    else
                    {
                        res.send(ResponseDTO.TechnicalError());  
                    }

                }); 
     
       
                
            

        
    }
 
        
});




module.exports = router;