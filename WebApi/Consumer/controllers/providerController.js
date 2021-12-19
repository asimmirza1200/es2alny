//var async = require('async');
const TokenGenerator = require('uuid-token-generator');
let date = require('date-and-time');
date.locale('hi');
var appSetting = require('../appsetting');  
// var { mongoose } = require('../db');
const express = require('express');
var router = express.Router();
//var db = require('mongoose');
var ObjectId = require('mongoose').Types.ObjectId; 
 
var constant = require('../../../CommonUtility/constant');  
var LINQ = require('node-linq').LINQ;
var path = require('path');


// constant.SUMMER.BEGINNING 
var { UserMaster, WithdrawDetails, CategoryMasters, CategoryLangDetails, UserConsumptions, AppointmentDetails, LookupLangDetails, ProviderDetails, ProviderLangDetails, ProfileVisitors } = require('../models/entity');
//var { Employee } = require('../models/-employee');
var ResponseDTO = require('../../../DTO/Consumer/ResponseDTO');   
var Helper = require('./Helper.js');
var contains = require("string-contains");
var dateFormat = require('dateformat');

  
async function getData(req) { // Async function statment

    console.log("============1=============");  
    var data = {
        NoOfSkipRec : 0,
        NoOfLimitRec : 0
    } 

    if(req.body.pageNo == 0)
    {
       
        await UserMaster.count({userTypeId : ObjectId(constant.UserType.Provider), isActive : true, isDeleted : false},  (err, NoOfDoc)  =>  {

            if(!err)
            {
                console.log("============2=============");  
                data.NoOfSkipRec = 0;
                data.NoOfLimitRec = NoOfDoc; 
                console.log("No Of Skip Rec : " + data.NoOfSkipRec); 
                console.log("No Of Limit Rec : " + data.NoOfLimitRec); 
                console.log("1"); 
            } 

        });

    }
    else
    {
        console.log("2"); 
        console.log("============2============="); 
        console.log("Page No : " + req.body.pageNo);  
        console.log("Page Size : " + appSetting.SystemConfiguration.PageSize);
        data.NoOfSkipRec = (appSetting.SystemConfiguration.PageSize * (req.body.pageNo - 1)) ;
        data.NoOfLimitRec = data.NoOfSkipRec + appSetting.SystemConfiguration.PageSize; 
        console.log("No Of Skip Rec : " + data.NoOfSkipRec); 
        console.log("No Of Limit Rec : " + data.NoOfLimitRec); 
    }
    console.log("============3=============");  
    return data;
  }



// Get Provider List -> Approved & disapprowed filter -  New Changes Done
router.post('/ProviderList', (req, res) => {
    //  console.log(req.body);
    
    if(req.body.pageNo == undefined || req.body.categoryId == undefined || req.body.categoryId.trim() == "")
    {
        res.send(ResponseDTO.InvalidParameter()); 
    }
    else
    {  
     
    console.log("============S=============");  

    getData(req) // returns a promise
      .then(function(data) {
            console.log(data);

            console.log("============E=============");  
                UserMaster.aggregate(
                [   
                    {
                        $lookup:
                        {
                            from: "providerdetails",
                            localField: "_id",
                            foreignField: "user_Id",
                            as: "providerDetails"
                        }  
                    }, 
                    {
                        $unwind:"$providerDetails"
                    },  
                    {
                        $sort : {
                            "firstName" : 1
                        }
                    },                          
                    {
                        $lookup:
                        {
                            from: "lookuplangdetails", 

                            let: { degree: "$providerDetails.degree", language_Id: ObjectId(req.headers.languageid)}, //, order_qty: "$ordered" 
                            pipeline: [
                                { 
                                    $match:
                                    {  
                                        $expr:
                                        { 
                                            $and:
                                            [ 
                                                { $in: [ "$lookupDetails_Id",  "$$degree" ] },
                                                { $eq: [ "$language_Id",  "$$language_Id" ]}
                                            ]
                                        }
                                    }
                                },
                                { 
                                    $project: 
                                    { 
                                        lookupDetails_Id: "$lookupDetails_Id", lookupValue: "$lookupValue", _id : 0 
                                    } 
                                }
                            ],                  

                            as: "lookupLangDetails"
                        }  
                    }, 
                    {
                        $lookup:
                        {
                            from: "appointmentdetails",
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
                                                { $eq: [ "$provider_user_Id",  "$$userId" ] },
                                                { $eq: [ "$isActive", true ] },
                                                { $eq: [ "$isDeleted", false ]  }, 
                                                { $ne: [ "$question",  null ] }
                                            ]
                                        }
                                    }
                                }, 
                                {
                                    $group: 
                                    {
                                        _id: "$provider_user_Id", 
                                        noOfQue: { $sum: 1 }, 
                                    }
                                },
                                { 
                                    $project: 
                                    { 
                                        NoOfQue: "$noOfQue",  
                                        _id : 0 
                                    } 
                                }
                            ],   

                            as: "appointmentDetailsForQue"

                        }  
                    },                      
                    {
                        $lookup:
                        {
                            from: "appointmentdetails",
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
                                                { $eq: [ "$provider_user_Id",  "$$userId" ] },
                                                { $eq: [ "$isActive", true ] },
                                                { $eq: [ "$isDeleted", false ]  }, 
                                                { $ne: [ "$rate",  null ] }
                                            ]
                                        }
                                    }
                                }, 
                                {
                                    $group: 
                                    {
                                        _id: "$provider_user_Id",
                                        //uniqueIds: {$addToSet: "$_id"},
                                        total: { $sum: "$rate" },
                                        //noOfQue: { $sum: 1 },
                                        avg : { $avg : "$rate" },
                                        // count1 : {$count : "$_id" }
                                    }
                                },
                                { 
                                    $project: 
                                    { 
                                        //NoOfQue: "$noOfQue", 
                                        total: "$total", 
                                        avg : "$avg", 
                                        // count1 : "$count1",
                                        _id : 0 
                                    } 
                                }
                            ],   

                            as: "appointmentDetails"

                        }  
                    },  
                    // {
                    //     $unwind:"$appointmentDetails"
                    // },                                   
                    {
                        $match : 
                        { 
                            $and :
                            [
                                {
                                    $or : 
                                    [
                                        {"providerDetails.categoryId" : ObjectId(req.body.categoryId),},
                                        {"providerDetails.subCategoryId" : ObjectId(req.body.categoryId)}
                                    ]
                                },   
                                {
                                    userTypeId : ObjectId(constant.UserType.Provider), isActive : true, isDeleted : false, 
                                    //"providerDetails.categoryId" : ObjectId(req.body.categoryId), 
                                    userStatusId : constant.UserStatus.ActiveUser
                                }
                            ]
                        }
                    },  
                    {
                        $project:
                        {   
                            _id: 0,
                            userId: "$_id", 
                            providerDetailsId: "$providerDetails._id",
                            userTypeId: "$userTypeId",
                            firstName: "$firstName",
                            lastName: "$lastName",
                            middleName: "$middleName",
                            genderId: "$genderId",
                            image: //"$image", 
                            {
                                $concat: 
                                [
                                    //appSetting.SystemConfiguration.APIBaseUrl, 
                                    appSetting.SystemConfiguration.UserDisplayImagePath,
                                    {
                                        $cond: 
                                        { 
                                            if: 
                                            { 
                                                $or : 
                                                [{
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
                            noOfQue: //"$appointmentDetails.NoOfQue",
                            {
                                $cond: [ 
                                    {
                                        $eq: ["$appointmentDetailsForQue", [] ]
                                    }, 0, 
                                    {
                                        $arrayElemAt:[ "$appointmentDetailsForQue.NoOfQue", 0]
                                    }] 
                            }, 
                            rate : //"$appointmentDetails.avg",                                        
                            {
                                $cond: [ 
                                    {
                                        $eq: ["$appointmentDetails", [] ]
                                    }, 0, 
                                    {
                                        $arrayElemAt:[ "$appointmentDetails.avg", 0]
                                    }] 
                            }, 
                            degree: "$lookupLangDetails" 
                        }
                    }, 
                    // {
                    //     $sort : { "providerDetails.firstName" : 1 } 
                    // },
                    // { 
                    //     $out: "ResultOfPovidorList" 
                    // } 
                    { 
                        $limit: data.NoOfLimitRec
                    },
                    { 
                    //  $skip: data.NoOfSkipRec 
                        $skip: data.NoOfSkipRec , 
                    }
    
                ], (err, provider) =>
                {      
                    //console.log("L : " + provider.length);
                    res.send(ResponseDTO.GetProviderList(constant.ErrorCode.DataRetrievedSuccessfully, constant.ErrorMsg.DataRetrievedSuccessfully, provider ));  

                });//.skip( data.NoOfSkipRec ).limit( appSetting.SystemConfiguration.PageSize );
                //.skip( NoOfSkipRec ).limit( appSetting.SystemConfiguration.PageSize );

            
            });

         

        }   

        
});

 
 
// -- Remove -- Get Provider Details
router.post('/_ProviderDetails', (req, res) => {
  console.log(req.body);

    if(req.body.userId == undefined || req.body.userId.trim() == "")
    {
        res.send(ResponseDTO.InvalidParameter()); 
    }
    else
    {   

        UserMaster.count({_id : ObjectId(req.body.userId), isActive : true, isDeleted : true }, (err, IsUserExist) => {

            if(!err)
            {
                if(IsUserExist > 0)
                {
                    res.send(ResponseDTO.ErrorMassage(constant.ErrorCode.DeletedUser, constant.ErrorMsg.DeletedUser , {} )); 
                }
                else
                {
 
                    console.log("============E============= " + req.headers.appid);  
                    UserMaster.aggregate(
                    [    
                        {
                            $lookup:
                            {
                                from: "providerdetails",
                                //localField: "_id",
                                //foreignField: "user_Id",

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
                                                    { $eq: [ "$isDeleted", false ]  }
                                                    
                                                ]
                                            }
                                        }
                                    },  
                                    {
                                        $lookup:
                                        {
                                            from: "lookuplangdetails", 
                
                                            let: { degree: "$degree", language_Id: ObjectId(req.headers.languageid)}, //, order_qty: "$ordered" 
                                            pipeline: [
                                                { 
                                                    $match:
                                                    {  
                                                        $expr:
                                                        { 
                                                            $and:
                                                            [ 
                                                                { $in: [ "$lookupDetails_Id",  "$$degree" ] },
                                                               // { $eq: [ "$language_Id",  "$$language_Id" ]},
                                                               // { $eq: [ "$isActive", true ] },
                                                               // { $eq: [ "$isDeleted", false ]  }, 
                                                            ]
                                                        }
                                                    }
                                                },
                                                { 
                                                    $project: 
                                                    { 
                                                        language_Id : "$language_Id", lookupDetails_Id: "$lookupDetails_Id", lookupValue: "$lookupValue", _id : 0 
                                                    } 
                                                }
                                            ],                  
                
                                            as: "lookupLangDetails"
                                        }  
                                    },     
                                    {
                                        $lookup:
                                        {
                                            from: "providerlangdetails", 
                
                                            let: { providerDetailsId: "$_id", language_Id: ObjectId(req.headers.languageid)}, //, order_qty: "$ordered" 
                                            pipeline: [
                                                { 
                                                    $match:
                                                    {  
                                                        $expr:
                                                        { 
                                                            $and:
                                                            [ 
                                                                { $eq: [ "$providerdetails_Id",  "$$providerDetailsId" ] },
                                                                { $eq: [ "$language_Id",  "$$language_Id" ]},
                                                                { $eq: [ "$isActive", true ] },
                                                                { $eq: [ "$isDeleted", false ]  }, 
                                                            ]
                                                        }
                                                    }
                                                },
                                                { 
                                                    $project: 
                                                    { 
                                                        description: "$description", _id : 0 
                                                    } 
                                                }
                                            ],                  
                
                                            as: "providerLangDetails"
                                        }  
                                    },     
                                    {
                                        $unwind:"$providerLangDetails"
                                    },                                                           
                                    { 
                                        $project: 
                                        {  
                                            _id : 0,
                                            providerDetailsId : "$_id",
                                            categoryId : "$categoryId",
                                            subCategoryId : "$subCategoryId",
                                            experience : "$experience",
                                            price : "$price", 
                                            currencySymbol: constant.CurrencySymbol.Kuwait,
                                            commissionPercentage : "$commissionPercentage",
                                            description:"$providerLangDetails.description",

                                            //user_Id : "$user_Id",
                                            
                                            degree : "$lookupLangDetails",
                                            
                                        } 
                                    }
                                ],

                                as: "providerDetails"
                            }  
                        }, 
                        {
                            $unwind:"$providerDetails"
                        },        
                        // {
                        //     $unwind: {
                        //         path: "$providerDetails",
                        //         preserveNullAndEmptyArrays: true
                        //     }
                        // },
                        // {
                        //     $lookup:
                        //     {
                        //         from: "logintokens",
                        //         // localField: "_id",
                        //         // foreignField: "user_Id",
                        //         let: { userId: "$_id" }, //, order_qty: "$ordered" 
                        //         pipeline: [
                        //             { 
                        //                 $match:
                        //                 { 
                        //                     //  lookupDetails_Id : $degree,
                        //                     $expr:
                        //                     { 
                        //                         $and:
                        //                         [ 
                        //                             { $eq: [ "$user_Id",  "$$userId" ] },
                        //                             { $eq: [ "$isActive", true ] },
                        //                             { $eq: [ "$isDeleted", false ]  }, 
                        //                             { $eq: [ "$deviceId",  req.headers.deviceid ] },
                        //                             { $eq: [ "$appId",  parseInt(req.headers.appid) ] } 
                        //                         ]
                        //                     }
                        //                 }
                        //             },  
                        //             { 
                        //                 $project: 
                        //                 {  
                        //                     loginToken : 1
                        //                 } 
                        //             }
                        //         ],   

                        //         as: "logintokens"
                        //     }  
                        // },    
                        // {
                        //     $unwind:"$logintokens"
                        // },   
                        {
                            $lookup:
                            {
                                from: "appointmentdetails",
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
                                                    { $eq: [ "$provider_user_Id",  "$$userId" ] },
                                                    { $eq: [ "$isActive", true ] },
                                                    { $eq:  [ "$isDeleted", false ]  }, 
                                                    { $ne: [ "$rate",  null ] }
                                                ]
                                            }
                                        }
                                    }, 
                                    {
                                        $group: 
                                        {
                                            _id: "$provider_user_Id",
                                            //uniqueIds: {$addToSet: "$_id"},
                                            total: { $sum: "$rate" },
                                            noOfQue: { $sum: 1 },
                                            avg : { $avg : "$rate" },
                                            // count1 : {$count : "$_id" }
                                        }
                                    },
                                    { 
                                        $project: 
                                        { 
                                            NoOfQue: "$noOfQue", 
                                            total: "$total", 
                                            avg : "$avg", 
                                            // count1 : "$count1",
                                            _id : 0 
                                        } 
                                    }
                                ],   

                                as: "appointmentDetails"

                            }  
                        },  
                        // {
                        //     $unwind:"$appointmentDetails"
                        // },                                   
                        {
                            $match : 
                            { 
                                _id : ObjectId(req.body.userId), userTypeId : ObjectId(constant.UserType.Provider), isActive : true, isDeleted : false
                            }
                        },  

                        {
                            $project:
                            {  
                                _id: 0,
                                userId: "$_id",  
                                firstName: "$firstName",
                                lastName: "$lastName",
                                middleName: "$middleName", 
                                emailAddress : "$emailAddress",
                                mobileNo : "$mobileNo",
                                DOB : "$DOB",
                                genderId : "$genderId",
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
                                userTypeId: "$userTypeId", 
                                loginToken : "", //"$logintokens.loginToken",
                                createdDateTime : "$createdDateTime", 
                                // noOfQue: "$appointmentDetails.NoOfQue", 
                                // rate : "$appointmentDetails.avg",  
                                noOfQue: //"$appointmentDetails.NoOfQue",
                                {
                                    $cond: [ 
                                        {
                                            $eq: ["$appointmentDetails", [] ]
                                        }, 0, 
                                        {
                                            $arrayElemAt:[ "$appointmentDetails.NoOfQue", 0]
                                        }] 
                                }, 
                                rate : //"$appointmentDetails.avg",                                        
                                {
                                    $cond: [ 
                                        {
                                            $eq: ["$appointmentDetails", [] ]
                                        }, 0, 
                                        {
                                            $arrayElemAt:[ "$appointmentDetails.avg", 0]
                                        }] 
                                }, 

                                providerDetails : "$providerDetails",  
                                degree: "$lookupLangDetails" 
                            }
                        },  


                    ], (err, provider) =>
                    {      
                        console.log(provider);
                    // console.log(provider[0].providerDetails);
                        res.send(ResponseDTO.GetProviderList(constant.ErrorCode.DataRetrievedSuccessfully, constant.ErrorMsg.DataRetrievedSuccessfully, provider[0] ));  

                    });//.skip( NoOfSkipRec ).limit( appSetting.SystemConfiguration.PageSize );

                }
            }
            else
            {
                res.send(ResponseDTO.TechnicalError()); 
            }

        });
    }
 
});


// Get Provider Details - New Changes Done
router.post('/ProviderDetailsV1', (req, res) => {
    console.log(req.body);
  
      if(req.body.userId == undefined || req.body.userId.trim() == "")
      {
          res.send(ResponseDTO.InvalidParameter()); 
      }
      else
      {   
  
          UserMaster.count({_id : ObjectId(req.body.userId), isActive : true, isDeleted : true }, (err, IsUserExist) => {
  
              if(!err)
              {
                  if(IsUserExist > 0)
                  {
                      res.send(ResponseDTO.ErrorMassage(constant.ErrorCode.DeletedUser, constant.ErrorMsg.DeletedUser , {} )); 
                  }
                  else
                  {
   
                      console.log("============E============= " + req.headers.appid);  
                      UserMaster.aggregate(
                      [    
                          {
                              $lookup:
                              {
                                  from: "providerdetails",
                                  //localField: "_id",
                                  //foreignField: "user_Id",
  
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
                                                      { $eq: [ "$isDeleted", false ]  }
                                                      
                                                  ]
                                              }
                                          }
                                      },  
                                      {
                                          $lookup:
                                          {
                                              from: "lookuplangdetails", 
                  
                                              let: { degree: "$degree", language_Id: ObjectId(req.headers.languageid)}, //, order_qty: "$ordered" 
                                              pipeline: [
                                                  { 
                                                      $match:
                                                      {  
                                                          $expr:
                                                          { 
                                                              $and:
                                                              [ 
                                                                  { $in: [ "$lookupDetails_Id",  "$$degree" ] },
                                                                 // { $eq: [ "$language_Id",  "$$language_Id" ]},
                                                                 // { $eq: [ "$isActive", true ] },
                                                                 // { $eq: [ "$isDeleted", false ]  }, 
                                                              ]
                                                          }
                                                      }
                                                  },
                                                  { 
                                                      $project: 
                                                      { 
                                                          language_Id : "$language_Id", lookupDetails_Id: "$lookupDetails_Id", lookupValue: "$lookupValue", _id : 0 
                                                      } 
                                                  }
                                              ],                  
                  
                                              as: "lookupLangDetails"
                                          }  
                                      },     
                                      {
                                          $lookup:
                                          {
                                              from: "providerlangdetails", 
                  
                                              let: { providerDetailsId: "$_id", language_Id: ObjectId(req.headers.languageid)}, //, order_qty: "$ordered" 
                                              pipeline: [
                                                  { 
                                                      $match:
                                                      {  
                                                          $expr:
                                                          { 

                                                            $and:
                                                            [ 
                                                                //  { $in: [ "$_id",  ['5cc82799dbe49723b09506e1', '5cc827a8dbe49723b09506e4'] ] }
                                                                { $eq: [ "$providerdetails_Id",  "$$providerDetailsId" ] }//,
                                                                //{ $eq: [ "$language_Id",  "$$language_Id" ]},
                                                                //{ $eq: [ "$isActive", true ] },
                                                                //{ $eq: [ "$isDeleted", false ]  }, 
                                                            ]

                                                            //   $and:
                                                            //   [ 
                                                            //       //  { $in: [ "$_id",  ['5cc82799dbe49723b09506e1', '5cc827a8dbe49723b09506e4'] ] }
                                                            //       { $eq: [ "$providerdetails_Id",  "$$providerDetailsId" ] }//,
                                                            //       //{ $eq: [ "$language_Id",  "$$language_Id" ]},
                                                            //       //{ $eq: [ "$isActive", true ] },
                                                            //       //{ $eq: [ "$isDeleted", false ]  }, 
                                                            //   ]
                                                          }
                                                      }
                                                  }
                                                //   ,
                                                //   { 
                                                //     $unwind: 
                                                //     { 
                                                //         language_Id : "$language_Id", description: "$description", _id : 0 
                                                //     }                                                       
                                                //     //   $project: 
                                                //     //   { 
                                                //     //       description: "$description", _id : 0 
                                                //     //   } 
                                                //   }
                                              ],                  
                  
                                              as: "providerLangDetails"
                                          }  
                                      },     
                                      {
                                          $unwind:"$providerLangDetails"
                                      },    
                                        {
                                            $lookup:
                                            {
                                                from: "lookuplangdetails", 
                                                let: { language: "$language", language_Id: ObjectId(req.headers.languageid)}, //, order_qty: "$ordered" 
                                                pipeline: [
                                                    { 
                                                        $match:
                                                        {  
                                                            $expr:
                                                            { 
                                                                $and:
                                                                [ 
                                                                    { $in: [ "$lookupDetails_Id",  "$$language" ] },
                                                                    { $eq: [ "$language_Id",  "$$language_Id" ]},
                                                                    // { $eq: [ "$isActive", true ] },
                                                                    // { $eq: [ "$isDeleted", false ]  }, 
                                                                ]
                                                            }
                                                        }
                                                    },
                                                    { 
                                                        $project: 
                                                        { 
                                                            lookupDetails_Id: "$lookupDetails_Id", lookupValue: "$lookupValue", _id : 0 
                                                        } 
                                                    }
                                                ],                  

                                                as: "lookupLangDetailsForLanguage"
                                            }  
                                        },  

                                        {
                                            $lookup:
                                            {
                                                from: "categorymasters", 
                                                let: { categoryId : "$categoryId", language_Id: ObjectId(req.headers.languageid)}, //, order_qty: "$ordered" 
                                                pipeline: [
                                                    { 
                                                        $match:
                                                        {  
                                                            $expr:
                                                            { 
                                                                $and:
                                                                [ 
                                                                    { $eq: [ "$_id",  "$$categoryId" ] }, 
                                                                    // { $eq: [ "$isActive", true ] },
                                                                    // { $eq: [ "$isDeleted", false ]  }, 
                                                                ]
                                                            }
                                                        }
                                                    },
                                                    { 
                                                        $project: 
                                                        {  
                                                            hasSubCategory : "$hasSubCategory",
                                                            _id : 0 
                                                        } 
                                                    }
                                                ],                  

                                                as: "categorymasters"
                                            }  
                                        },    
                                        {
                                            $unwind: {
                                                path: "$categorymasters",
                                                preserveNullAndEmptyArrays: true
                                            }
                                        },    
                                        {
                                            $lookup:
                                            {
                                                from: "categorylangdetails", 
                                                let: { categoryId : "$categoryId", language_Id: ObjectId(req.headers.languageid)}, //, order_qty: "$ordered" 
                                                pipeline: [
                                                    { 
                                                        $match:
                                                        {  
                                                            $expr:
                                                            { 
                                                                $and:
                                                                [ 
                                                                    { $eq: [ "$category_id",  "$$categoryId" ] },
                                                                    { $eq: [ "$language_id",  "$$language_Id" ]},
                                                                    // { $eq: [ "$isActive", true ] },
                                                                    // { $eq: [ "$isDeleted", false ]  }, 
                                                                ]
                                                            }
                                                        }
                                                    },
                                                    { 
                                                        $project: 
                                                        { 
                                                           // csss : "$$categoryId", 
                                                            categoryId: "$category_id", 
                                                            categoryName: "$categoryName",   
                                                            _id : 0 
                                                        } 
                                                    }
                                                ],                  

                                                as: "categoryInfo"
                                            }  
                                        },    
                                        {
                                            $unwind: {
                                                path: "$categoryInfo",
                                                preserveNullAndEmptyArrays: true
                                            }
                                        },    
                                        {
                                            $lookup:
                                            {
                                                from: "categorylangdetails", 
                                                let: { subCategoryId: "$subCategoryId", language_Id: ObjectId(req.headers.languageid)}, //, order_qty: "$ordered" 
                                                pipeline: [
                                                    { 
                                                        $match:
                                                        {  
                                                            $expr:
                                                            { 
                                                                $and:
                                                                [ 
                                                                    { $eq: [ "$category_id",  "$$subCategoryId" ] },
                                                                    { $eq: [ "$language_id",  "$$language_Id" ]},
                                                                    // { $eq: [ "$isActive", true ] },
                                                                    // { $eq: [ "$isDeleted", false ]  }, 
                                                                ]
                                                            }
                                                        }
                                                    },
                                                    { 
                                                        $project: 
                                                        {  
                                                            categoryId: "$category_id",
                                                            categoryName: "$categoryName", 
                                                            _id : 0 
                                                        } 
                                                    }
                                                ],                  

                                                as: "subCategoryInfo"
                                            }  
                                        },    
                                        // {
                                        //     $unwind: {
                                        //         path: "$subCategoryInfo",
                                        //         preserveNullAndEmptyArrays: true
                                        //     }
                                        // },                                                                                                                                                                                                                    
                                      { 
                                          $project: 
                                          {  
                                              _id : 0,
                                              providerDetailsId : "$_id",

                                              //categoryId : "$categoryId",
                                              category : //"$categoryInfo",
                                              {
                                                categoryId: "$categoryInfo.categoryId", 
                                                categoryName: "$categoryInfo.categoryName",  
                                                hasSubCategory : "$categorymasters.hasSubCategory"                                                  
                                              },
                                            
                                            //   subCategoryId : //"$subCategoryId",
                                            //     {
                                            //         $cond: 
                                            //         {
                                            //             if: { $eq : [ "$subCategoryId" , null ] },
                                            //             then: "",
                                            //             else: "$subCategoryId"
                                            //         }       
                                            //     },  
                                            
                                            subCategory : //"$subCategoryInfo", 
                                            {
                                                $cond: 
                                                {
                                                    if: { $eq : [ "$subCategoryInfo", [] ] },
                                                    then: 
                                                    {
                                                        categoryId: "",
                                                        categoryName: "", 
                                                    },
                                                    else: 
                                                    {
                                                        $arrayElemAt: [ "$subCategoryInfo", 0 ]
                                                    }
                                                }       
                                            },  

                                            //   categoryId : "$categoryId",
                                            //   subCategoryId : //"$subCategoryId",
                                            //     {
                                            //         $cond: 
                                            //         {
                                            //             if: { $eq : [ "$subCategoryId" , null ] },
                                            //             then: "",
                                            //             else: "$subCategoryId"
                                            //         }       
                                            //     },                                        
                                              experience : "$experience",
                                              price : "$price", 
                                              currencySymbol: constant.CurrencySymbol.Kuwait,
                                              commissionPercentage : "$commissionPercentage",
                                              description: "$providerLangDetails",   //"$providerLangDetails.description",
  
                                              //user_Id : "$user_Id",
                                              
                                              degree : "$lookupLangDetails",
                                              language : "$lookupLangDetailsForLanguage"
                                          } 
                                      }
                                  ],
  
                                  as: "providerDetails"
                              }  
                          }, 
                          {
                              $unwind:"$providerDetails"
                          },        
                          // {
                          //     $unwind: {
                          //         path: "$providerDetails",
                          //         preserveNullAndEmptyArrays: true
                          //     }
                          // },
                          // {
                          //     $lookup:
                          //     {
                          //         from: "logintokens",
                          //         // localField: "_id",
                          //         // foreignField: "user_Id",
                          //         let: { userId: "$_id" }, //, order_qty: "$ordered" 
                          //         pipeline: [
                          //             { 
                          //                 $match:
                          //                 { 
                          //                     //  lookupDetails_Id : $degree,
                          //                     $expr:
                          //                     { 
                          //                         $and:
                          //                         [ 
                          //                             { $eq: [ "$user_Id",  "$$userId" ] },
                          //                             { $eq: [ "$isActive", true ] },
                          //                             { $eq: [ "$isDeleted", false ]  }, 
                          //                             { $eq: [ "$deviceId",  req.headers.deviceid ] },
                          //                             { $eq: [ "$appId",  parseInt(req.headers.appid) ] } 
                          //                         ]
                          //                     }
                          //                 }
                          //             },  
                          //             { 
                          //                 $project: 
                          //                 {  
                          //                     loginToken : 1
                          //                 } 
                          //             }
                          //         ],   
  
                          //         as: "logintokens"
                          //     }  
                          // },    
                          // {
                          //     $unwind:"$logintokens"
                          // },   
                          {
                              $lookup:
                              {
                                  from: "appointmentdetails",
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
                                                      { $eq: [ "$provider_user_Id",  "$$userId" ] },
                                                      { $eq: [ "$isActive", true ] },
                                                      { $eq:  [ "$isDeleted", false ]  }, 
                                                      { $ne: [ "$rate",  null ] }
                                                  ]
                                              }
                                          }
                                      }, 
                                      {
                                          $group: 
                                          {
                                              _id: "$provider_user_Id",
                                              //uniqueIds: {$addToSet: "$_id"},
                                              total: { $sum: "$rate" },
                                              //noOfQue: { $sum: 1 },
                                              avg : { $avg : "$rate" },
                                              // count1 : {$count : "$_id" }
                                          }
                                      },
                                      { 
                                          $project: 
                                          { 
                                              //NoOfQue: "$noOfQue", 
                                              total: "$total", 
                                              avg : "$avg", 
                                              // count1 : "$count1",
                                              _id : 0 
                                          } 
                                      }
                                  ],   
  
                                  as: "appointmentDetails"
  
                              }  
                          },  

                          {
                            $lookup:
                            {
                                from: "appointmentdetails",
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
                                                    { $eq: [ "$provider_user_Id",  "$$userId" ] },
                                                    { $eq: [ "$isActive", true ] },
                                                    { $eq:  [ "$isDeleted", false ]  }, 
                                                    { $ne: [ "$question",  null ] }
                                                ]
                                            }
                                        }
                                    }, 
                                    {
                                        $group: 
                                        {
                                            _id: "$provider_user_Id",
                                            noOfQue: { $sum: 1 },
                                        }
                                    },
                                    { 
                                        $project: 
                                        { 
                                            NoOfQue: "$noOfQue", 
                                            _id : 0 
                                        } 
                                    }
                                ],   

                                as: "appointmentDetailsForQue"

                            }  
                        },                           
                          // {
                          //     $unwind:"$appointmentDetails"
                          // },   
                          {
                            $lookup:
                            {
                                from: "appointmentdetails",
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
                                                    { $eq: [ "$provider_user_Id",  "$$userId" ] },
                                                    { $eq: [ "$isActive", true ] },
                                                    { $eq:  [ "$isDeleted", false ]  }, 
                                                    { $ne: [ "$answer", null] }
                                                    //{ $ne: [ "$rate",  null ] }
                                                ]
                                            }
                                        }
                                    }, 
                                    {
                                        $group: 
                                        {
                                            _id: "$provider_user_Id",
                                            noOfAns: { $sum: 1 },
                                        }
                                    },
                                    { 
                                        $project: 
                                        { 
                                            NoOfAns: "$noOfAns", 
                                            _id : 0 
                                        } 
                                    }
                                ],   

                                as: "appointmentDetailsForAns"

                            }  
                        },   
                        {
                            $lookup:
                            {
                                from: "profilevisitors",
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
                                                    { $eq:  [ "$isDeleted", false ]  } //, 
                                                    //{ $ne: [ "$answer", null] }
                                                    //{ $ne: [ "$rate",  null ] }
                                                ]
                                            }
                                        }
                                    }, 
                                    {
                                        $group: 
                                        {
                                            _id: "$user_Id",
                                            //uniqueIds: {$addToSet: "$_id"},
                                            //total: { $sum: "$rate" },
                                            noOfVisitor: { $sum: 1 },
                                            //avg : { $avg : "$rate" },
                                            // count1 : {$count : "$_id" }
                                        }
                                    },
                                    { 
                                        $project: 
                                        { 
                                            noOfVisitor: "$noOfVisitor", 
                                            //total: "$total", 
                                            //avg : "$avg", 
                                            // count1 : "$count1",
                                            _id : 0 
                                        } 
                                    }
                                ],   

                                as: "profilevisitors"

                            }  
                        },                           
                          {
                              $match : 
                              { 
                                  _id : ObjectId(req.body.userId), userTypeId : ObjectId(constant.UserType.Provider), isActive : true, isDeleted : false
                              }
                          },  
  
                          {
                              $project:
                              {  
                                    _id: 0,
                                    userId: "$_id",  
                                    firstName: "$firstName",
                                    lastName: "$lastName",
                                    middleName: "$middleName", 
                                    emailAddress : "$emailAddress",
                                    mobileNo : "$mobileNo",
                                    DOB : "$DOB",
                                    genderId : "$genderId",
                                    image : 
                                    {
                                        $concat: 
                                        [
                                            //appSetting.SystemConfiguration.APIBaseUrl, 
                                            appSetting.SystemConfiguration.UserDisplayImagePath,
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
                                    userTypeId: "$userTypeId", 
                                    loginToken : "", //"$logintokens.loginToken",
                                    createdDateTime : "$createdDateTime", 
                                    // noOfQue: "$appointmentDetails.NoOfQue", 
                                    // rate : "$appointmentDetails.avg",  
                                    noOfQue: //"$appointmentDetails.NoOfQue",
                                    {
                                        $cond: [ 
                                            {
                                                $eq: ["$appointmentDetailsForQue", [] ]
                                            }, 0, 
                                            {
                                                $arrayElemAt:[ "$appointmentDetailsForQue.NoOfQue", 0]
                                            }] 
                                    },                                    
                                    rate : //"$appointmentDetails.avg",                                        
                                    {
                                        $cond: [ 
                                            {
                                                $eq: ["$appointmentDetails", [] ]
                                            }, 0, 
                                            {
                                                $arrayElemAt:[ "$appointmentDetails.avg", 0]
                                            }] 
                                    },  
                                    providerDetails : "$providerDetails",  
                                    degree: "$lookupLangDetails",
                                    noOfAns: //"$appointmentDetails.NoOfQue",
                                    {
                                        $cond: [ 
                                            {
                                                $eq: ["$appointmentDetailsForAns", [] ]
                                            }, 0, 
                                            {
                                                $arrayElemAt:[ "$appointmentDetailsForAns.NoOfAns", 0]
                                            }] 
                                    },
                                    noOfVisitor : 
                                    {
                                        $cond: [ 
                                            {
                                                $eq: ["$profilevisitors", [] ]
                                            }, 0, 
                                            {
                                                $arrayElemAt:[ "$profilevisitors.noOfVisitor", 0]
                                            }] 
                                    }, 

                                }
                            },  
  
    
                        ], async (err, provider) =>
                        {     
                            console.log("====>" + provider[0]);
                            console.log("====>" + provider);
                            console.log(provider[0]);
                        // console.log(provider[0].providerDetails);

                            if(provider != undefined && provider[0] != undefined && provider[0].providerDetails != undefined)
                            {
                                
                                await ProviderLangDetails.find({providerdetails_Id : ObjectId(provider[0].providerDetails.providerDetailsId), isActive : true, isDeleted : false}, {  _id : 0, language_Id : 1 , description : 1  }, (err, providerLangDetails) => 
                                {                   
                                    if (!err) 
                                    {  
                                        provider[0].providerDetails.description = providerLangDetails;
                                        res.send(ResponseDTO.GetProviderList(constant.ErrorCode.DataRetrievedSuccessfully, constant.ErrorMsg.DataRetrievedSuccessfully, provider[0] ));  
                                    }
                                })

                                
                            }  

                            
    
                        });//.skip( NoOfSkipRec ).limit( appSetting.SystemConfiguration.PageSize );
    
                    }
                }
                else
                {
                    res.send(ResponseDTO.TechnicalError()); 
                }
    
            });
        }
    
    });


// For Provider Update Profile Details - New Changes Done
router.post('/ProviderUpdateProfile', (req, res) => {
 
    var subCategory = null;

    if(req.body.subCategoryId == undefined || !req.body.subCategoryId.trim())
    { 
        subCategory = null;
    }
    else
    {
        subCategory = ObjectId(req.body.subCategoryId);
    }


    if(req.body.userId == undefined || req.body.firstName == undefined || req.body.lastName == undefined || req.body.middleName == undefined || req.body.DOB == undefined || req.body.genderId == undefined || req.body.experience == undefined || req.body.price == undefined || req.body.degree == undefined || !req.body.firstName.trim() || req.body.genderId.price < 0 || req.body.degree.length < 1 )
    {
        console.log("Invalid Provider Details");
        res.send(ResponseDTO.InvalidParameter()); 
    }
    else if(req.body.categoryId == undefined || !req.body.categoryId.trim() || req.body.language == undefined || req.body.language.length < 1)
    {
        console.log("Invalid Provider Details");
        res.send(ResponseDTO.InvalidParameter()); 
    }
    else if(req.body.price % 1 != 0)
    {
        console.log("Invalid price - " + req.body.price);
        res.send(ResponseDTO.InvalidParameter()); 
    }
    else if(!(req.body.price <= 15 && req.body.price >= 1))
    {
        console.log("Price must be 1 KD to 15 KD.")
        res.send(ResponseDTO.InvalidParameter()); 
    }        
    else if(req.body.description == undefined || req.body.description.length < 2)
    {
        //Description Details
        console.log("Invalid Description Details");
        res.send(ResponseDTO.InvalidParameter())
    } 
    else
    {   

        // var query = {
        //     "$and": [
        //         {
        //             "_id": {
        //                 "$ne": ObjectId(req.body.userId)
        //             }
        //         },
        //         {
        //             "emailAddress": req.body.emailAddress
        //         },
        //         {
        //             "isActive": true
        //         },
        //         {
        //             "isDeleted": false
        //         },
        //         {
        //             "emailAddress": {
        //                 "$ne": ""
        //             }
        //         }
        //     ]
        // };

        UserMaster.find({ _id : ObjectId(req.body.userId), isActive : true, isDeleted : false }, (err, userMasterDoc)  => 
        {
             
            if(!err)
            {   

                CategoryMasters.find({ _id : ObjectId(req.body.categoryId), isDeleted : false }, (err, categoryMastersDoc)  => 
                {   
                    console.log("Check CategoryMasters"); 
                    console.log("NoOfUseAsSubCategory : " + categoryMastersDoc.length); 
                    
                    if(!err)
                    {   
                        if(categoryMastersDoc.length > 0 && userMasterDoc.length > 0)
                        { 
                            if(categoryMastersDoc[0].hasSubCategory == true && subCategory == null)
                            { 
                                console.log("Missing sub category Id");
                                res.send(ResponseDTO.InvalidParameter()); 
                                //res.send(ResponseDTO.ErrorMassage( constant.ErrorCode.NotDeleteUseCategory, constant.ErrorMsg.NotDeleteUseCategory, {} )); 
                            } 
                            else if(categoryMastersDoc[0].hasSubCategory == false && subCategory != null)
                            { 
                                console.log("Not Sub category of parent category. so no need to sub category");
                                res.send(ResponseDTO.InvalidParameter()); 
                                //res.send(ResponseDTO.ErrorMassage( constant.ErrorCode.NotDeleteUseCategory, constant.ErrorMsg.NotDeleteUseCategory, {} )); 
                            }  
                            else
                            {   

                                //Update Provider Common Details
                                UserMaster.updateOne({ _id: ObjectId(req.body.userId), isActive : true, isDeleted : false }, { $set: { firstName : req.body.firstName, lastName : req.body.lastName, middleName : req.body.middleName, DOB : req.body.DOB, genderId : req.body.genderId, updatedBy: ObjectId(req.body.userId), updatedDateTime : new Date() } }, function(err, userMasterResult) { //emailAddress : req.body.emailAddress,
                                    console.log(userMasterResult);
                                    if (!err)  
                                    {

                                        if(userMasterResult.n > 0)
                                        {
                                            console.log(req.body.degree);
                                            var degrees = []; 

                                            // for(var val of req.body.degree) {
                                            //     console.log(val)
                                            //     degrees.push(ObjectId(val));
                                            // }
                                            // console.log(degrees);

                                            // req.body.degree.forEach(function (element)   {
                                            //     //console.log(element);
                                            //     degrees.push( ObjectId(element));
                                            //     console.log(element);
                                            //     //element = ObjectId(element);
                                            // });
                                            
                                            console.log(degrees);
                

                                            //Update Provider Details
                                            ProviderDetails.findOneAndUpdate({ user_Id: ObjectId(req.body.userId), isActive : true, isDeleted : false }, { $set: { categoryId : req.body.categoryId, subCategoryId : subCategory, experience : req.body.experience, price : req.body.price, degree: req.body.degree, language : req.body.language, updatedBy: ObjectId(req.body.userId), updatedDateTime : new Date() } },  { multi: true, new : true }, async function(err, providerDetailsDoc) {

                                                console.log("Provider Details Doc =>");
                                                console.log(providerDetailsDoc);
                                            // console.log(providerDetailsDoc._id != undefined);
                                                if (!err)  
                                                {
                                                    if(providerDetailsDoc._id != undefined)//providerDetailsDoc.n > 0
                                                    {

                                                        var NoOfUpdateRecords = 0;
                                                        console.log("==> 1 <==   " + NoOfUpdateRecords);
                                                        
                                                        
                                                        await req.body.description.forEach( async function(item){


                                                            ProviderLangDetails.update(
                                                                { language_Id: ObjectId(item.language_Id), providerdetails_Id : ObjectId(providerDetailsDoc._id), isActive : true, isDeleted : false }, 
                                                                { $set: { description : item.description, updatedBy: ObjectId(req.headers.userId), updatedDateTime : new Date() } }, function(err, providerLangDetailsDoc) {
                                                            
                                                                    console.log(providerLangDetailsDoc);
                                                                    // console.log(providerLangDetailsDoc.n)
                                                                if (!err)  
                                                                {
                                                                    if(providerLangDetailsDoc.n > 0)
                                                                    { 
                                                                        NoOfUpdateRecords = NoOfUpdateRecords + 1;
                                                                        console.log("==> 2 <==   " + NoOfUpdateRecords);

                                                                        if(NoOfUpdateRecords == 2)
                                                                        { 

                                                                            console.log("Profile Update successfully."); 
                                                                            //res.send(ResponseDTO.ErrorMassage( constant.ErrorCode.EmailAlreadyExists, constant.ErrorMsg.EmailAlreadyExists, {} )); 
                                                                            res.send(ResponseDTO.ErrorMassage(constant.ErrorCode.UpdateProfileSuccessfully, constant.ErrorMsg.UpdateProfileSuccessfully, {} ));  
                                                                            
                                                                        }
                                                                        // else
                                                                        // {
                                                                        //     res.send(ResponseDTO.ErrorMassage(constant.ErrorCode.NotUpdateProfile, constant.ErrorMsg.NotUpdateProfile, {} ));  
                                                                        // }

                                                                    }
                                                                    else
                                                                    {
                                                                        res.send(ResponseDTO.ErrorMassage(constant.ErrorCode.NotUpdateProfile, constant.ErrorMsg.NotUpdateProfile, {} ));  
                                                                        return; 
                                                                    } 

                                                                }
                                                                else 
                                                                { 
                                                                    // throw err
                                                                    res.send(ResponseDTO.TechnicalError());
                                                                }
                                                            }); 

                                                        })                                             
                                                    
                                                    }
                                                    else
                                                    {
                                                        res.send(ResponseDTO.ErrorMassage(constant.ErrorCode.NotUpdateProfile, constant.ErrorMsg.NotUpdateProfile, {} ));  
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
                            console.log("Invalid category Id");
                            res.send(ResponseDTO.InvalidParameter()); 
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
 
});


//For Transaction Details with Current Balance
router.post('/TransactionDetail', (req, res) => {
    //  console.log(req.body);
    
    if(req.body.userId == undefined || req.body.userId.trim() == "" || req.body.pageNo == undefined )
    {
        res.send(ResponseDTO.InvalidParameter()); 
    }
    else
    {  
     
     
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
            {
                $unwind:"$usermasters"
            },                            
            {
                $match : 
                { 
                     //"$usermasters.userTypeId" : ObjectId(constant.UserType.Provider),
                     "provider_user_Id" : ObjectId(req.body.userId), 
                    // isActive : true, isDeleted : false
                 
                }
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
                    consumerName: "$usermasters.firstName", 
                    genderId: "$usermasters.genderId", 
                    image: //"$image", 
                    {
                        $concat: 
                        [
                            //appSetting.SystemConfiguration.APIBaseUrl, 
                            appSetting.SystemConfiguration.UserDisplayImagePath,
                            {
                                $cond: 
                                {  
                                    if:
                                    {
                                        $eq : [ "$usermasters.genderId", constant.Gender.Male ]
                                    },
                                    then : 
                                        appSetting.SystemConfiguration.UserMenDefaultImage,
                                    else : 
                                        appSetting.SystemConfiguration.UserWomenDefaultImage,
 
                                }               
                            }
                        ]
                    }, 
                    createdDateTime: "$createdDateTime",
                    currentDateTime: new Date() 
                }
            },  

        ], async (err, transactionDetails) =>
        {        
            console.log(transactionDetails)
 
            if(!err)
            {
 
                WithdrawDetails.aggregate(
                    [   
                        {
                            $lookup:
                            {
                                from: "usermasters",
                                localField: "user_Id",
                                foreignField: "_id",
                                as: "usermasters"
                            }  
                        }, 
                        // {
                        //     $unwind:"$usermasters"
                        // },                            
                        {
                            $match : 
                            { 
                                 //"$usermasters.userTypeId" : ObjectId(constant.UserType.Provider),
                                 "user_Id" : ObjectId(req.body.userId), 
                                 isWithdraw : true
                                // isActive : true, isDeleted : false
                             
                            }
                        },   
                        {
                            $project:
                            {   
                                _id : 0,
                                appointmentId: "", 
                                consumerUserId: "",
                                //providerUserId : "$provider_user_Id",
                                commissionPercentage: 
                                {
                                    $convert: 
                                    { 
                                        input: 0.0, to: "double" 
                                    }
                                },
                                //{ input: 0.1, to: "double" },
                                price:                 
                                {
                                    $convert: 
                                    { 
                                        input: 0.0, to: "double" 
                                    }
                                },
                                commissionPrice: 
                                {
                                    $convert: 
                                    { 
                                        input: 0.0, to: "double" 
                                    }
                                },
                                totalPrice : "$price",
                                consumerName: "Withdraw", 
                                genderId: 
                                {
                                    $convert: 
                                    { 
                                        input: 0, to: "double" 
                                    }
                                }, 
                                image: "", 
                                createdDateTime: "$withdrawDateTime",
                                currentDateTime: new Date() 
                            }
                        },   
            
                    ], async (err, withdrawdetails) =>
                    {  
                        if(!err)
                        {
                            //console.log("W");
                            //console.log(withdrawdetails);

                            //transactionDetails.concat(withdrawdetails)

                            withdrawdetails.forEach( async function(item){
                                transactionDetails.push(item);
                            });
 
                            var StartRow = (req.body.pageNo - 1) * appSetting.SystemConfiguration.PageSize;
                            var EndRow = StartRow + appSetting.SystemConfiguration.PageSize;
            
                            var WalletDetails = await Helper.getProviderWalletDetailsByUserId(req.body.userId);
            
                            let promise = await new Promise(async function(resolve, reject) {
                                resolve(result = {
                                    walletBalance : WalletDetails.CurrentBalance,
                                    transactionHistory : await (
                                        new LINQ(transactionDetails) 
                                        .OrderByDescending(function(transactionDetail) 
                                        {  
                                            //console.log(transactionDetail);
                                            return transactionDetail.createdDateTime;   
                                        })   
                                        //.ToArray().slice(0, 500)
                                        .ToArray().slice(StartRow, EndRow)
                                    )
                                });
                            });
            
                            //console.log(promise);
            
                            res.send(ResponseDTO.DataRetrievedSuccessfully(constant.ErrorCode.DataRetrievedSuccessfully, constant.ErrorMsg.DataRetrievedSuccessfully, promise ));  
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


//For Provider Profile - Increase visitor count
router.post('/VisitProfile', (req, res) => {
 
    if(req.body.userId == undefined || req.body.userId.trim() == "" || req.body.visitorUserId == undefined || req.body.visitorUserId.trim() == "" || req.body.userId == req.body.visitorUserId )
    {
        res.send(ResponseDTO.InvalidParameter()); 
    }
    else
    {   

        var query = {
            $or : 
            [
                { _id : ObjectId(req.body.userId), userTypeId : constant.UserType.Provider },
                { _id : ObjectId(req.body.visitorUserId), userTypeId : constant.UserType.Consumer } 
            ]
        };

        UserMaster.count(query, (err, ValidUsers) => { 
            if(!err)
            {
                console.log( "No Of Valid User : " + ValidUsers)
                if(ValidUsers == 2)
                {

                    ProfileVisitors.find({user_Id : ObjectId(req.body.userId), visitor_user_Id  : ObjectId(req.body.visitorUserId), isActive : true, isDeleted : false }, (err, profileVisitorsDoc) => {
                        if(!err)
                        {
                            if(profileVisitorsDoc.length > 0)
                            {
                                ProfileVisitors.updateOne({ _id : ObjectId(profileVisitorsDoc[0]._id)}, { $set: { updatedBy: ObjectId(req.body.userId), updatedDateTime : new Date() } }, function(err, resProfileVisitors) {
                                    if (!err) 
                                    {
                                        console.log("Already vist profile. Update Last Visit Time ");
                                        res.send(ResponseDTO.ErrorMassage(constant.ErrorCode.UpdateVisitProfileSuccessfully, constant.ErrorMsg.UpdateVisitProfileSuccessfully , {} )); 
                                    }
                                    else
                                    {
                                        console.log(err);
                                        res.send(ResponseDTO.TechnicalError()); 
                                    } 
                                }); 
                            
                            }
                            else
                            { 
                                                                
                                var profileVisitorDetails = new ProfileVisitors({  
                                    user_Id : ObjectId(req.body.userId),
                                    visitor_user_Id : ObjectId(req.body.visitorUserId), 
                                    isActive : true,
                                    isDeleted : false, 
                                    createdBy : ObjectId(req.headers.userid),
                                    createdDateTime : new Date(),
                                    updatedBy : null,
                                    updatedDateTime : null
                                });
                        
                                profileVisitorDetails.save((err, profileVisitorDoc) => {
                                    if (!err) 
                                    {  
                                        if(!profileVisitorDoc.length)
                                        {
                                            console.log("Add - Vist Profile Update Succesfully.");
                                            res.send(ResponseDTO.ErrorMassage(constant.ErrorCode.UpdateVisitProfileSuccessfully, constant.ErrorMsg.UpdateVisitProfileSuccessfully , {} )); 
                                        }
                                        else
                                        {
                                            console.log(err);
                                            res.send(ResponseDTO.TechnicalError());
                                        }
                                    }
                                    else 
                                    { 
                                        console.log(err);
                                        res.send(ResponseDTO.TechnicalError());
                                    }
                                });                                                             

                             
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
                    console.log("Invalid userId Or visitorUserId");
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