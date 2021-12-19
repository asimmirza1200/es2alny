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


// constant.SUMMER.BEGINNING 
var { UserMaster, CategoryMasters, CategoryLangDetails, AppointmentDetails, LookupLangDetails, ProviderDetails } = require('../models/entity');
//var { Employee } = require('../models/-employee');
var ResponseDTO = require('../../../DTO/Consumer/ResponseDTO');   

var LINQ = require('node-linq').LINQ;


// Get Category List
router.post('/CategoryList', (req, res) => {
    //  console.log(req.body);
    
      if(req.body.categoryId == undefined)
      {
          res.send(ResponseDTO.InvalidParameter()); 
      }
      else
      {  
            //console.log(ObjectId(req.headers.languageid));
            if(!req.body.categoryId.trim())
            {
                //Master Category
                console.log("Master Category");

                    // For Category
                    CategoryMasters.aggregate([  
                    {
                       $match : { parent_Id : null, isActive : true, isDeleted : false }
                    },
                    {
                        $lookup:
                        {
                            from: "categorylangdetails",
                            localField: "_id",
                            foreignField: "category_id",
                            as: "categoryDetails"
                        }  
                   },
                   { 
                        $addFields: 
                        { 
                            categoryDetails: 
                            { 
                                $arrayElemAt : [{
                                    $filter:{
                                        input: "$categoryDetails",
                                        as: "cd",
                                        cond: {
                                            $eq: [ "$$cd.language_id", ObjectId(req.headers.languageid)] 
                                        }                                        
                                    }
                                }, 0] 
                            } 
                        } 
                    },
                    {
                        $sort : { "categoryDetails.categoryName" : 1 }
                    } 
 
                ], (err, data) =>
                {    
                    var categories = []; 
                    // console.log("1");
                    // console.log(!data.length);
                    data.forEach(
                        function(doc) 
                        {
                            var cd = 
                            {
                                categoryId : doc._id,
                                categoryCode : doc.categoryCode,
                                //appSetting.SystemConfiguration.APIBaseUrl + 
                                imageURL :  appSetting.SystemConfiguration.CategoryDisplayImagePath + (doc.imageURL == null || doc.imageURL == "" ? appSetting.SystemConfiguration.CategoryDefaultImage : doc.imageURL),
                                
                                // {
                                //     $cond: { $ifNull: { $gte: [ "$qty", 250 ] }, then: 30, else: 20 }
                                // },  //doc.imageURL,
                                categoryName : doc.categoryDetails.categoryName,
                                categoryDescription : doc.categoryDetails.categoryDescription,
                                hasSubCategory : doc.hasSubCategory 
                            } 
                            categories.push(cd);
                            // console.log("2"); 
                        }, 
                        function(err) 
                        {
                            //throw err;
                            res.send(ResponseDTO.TechnicalError());  
                        }
                    );

                    // console.log("3");




                    //For Provider 
                    UserMaster.count({userTypeId : ObjectId(constant.UserType.Provider), isActive : true, isDeleted : false, userStatusId : constant.UserStatus.ActiveUser}, (err, NoOfDoc) => {
                        if (!err) 
                        {    
                            var random = Math.floor( Math.random() * NoOfDoc - 5  ); 
                            random = random < 0 ? 0 : random; 
                            console.log("random : " + random);  
 
                            // For Provider
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
                                        //localField: "providerDetails.degree",
                                        //foreignField: "lookupDetails_Id",
 
                                        let: { degree: "$providerDetails.degree", language_Id: ObjectId(req.headers.languageid)}, //, order_qty: "$ordered" 
                                        pipeline: [
                                           { 
                                                $match:
                                                { 
                                                  //  lookupDetails_Id : $degree,
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
                                        userTypeId : ObjectId(constant.UserType.Provider), isActive : true, isDeleted : false, userStatusId : constant.UserStatus.ActiveUser
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
                                        image:
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
                                        // appSetting.SystemConfiguration.APIBaseUrl + appSetting.SystemConfiguration.UserDisplayImagePath + ("$image" == null || "$image" == "" ? appSetting.SystemConfiguration.UserDefaultImage : "$_id" +"/"+ "$image"),  
                                        //noOfQue: "$appointmentDetails.NoOfQue",
                                        //rate : "$appointmentDetails.avg",
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
                                // } 
  
                            ], (err, provider) =>
                            {    
 
                                res.send(ResponseDTO.GetCategoryWithProviderDetails(constant.ErrorCode.DataRetrievedSuccessfully, constant.ErrorMsg.DataRetrievedSuccessfully, categories, new LINQ(provider).ToArray().slice(random, random + 5) )); //provider

                            });
 
                        }
                        else
                        {
                            //throw err;
                            res.send(ResponseDTO.TechnicalError()); 
                        }
                           
                    });  

 
                });            
                 

            }
            else
            { 
                //Sub Category
                console.log("Sub Category");

                // For Sub Category
                CategoryMasters.aggregate([   
                    {
                       $match : { parent_Id : ObjectId(req.body.categoryId), isActive : true, isDeleted : false },
                    },
                    {
                        $lookup:
                        {
                            from: "categorylangdetails",
                            localField: "_id",
                            foreignField: "category_id",
                            as: "categoryDetails"
                        }  
                   }, 
                   { 
                        $addFields: 
                        { 
                            categoryDetails: 
                            { 
                                $arrayElemAt : [{
                                    $filter:{
                                        input: "$categoryDetails",
                                        as: "cd",
                                        cond: {
                                            $eq: [ "$$cd.language_id", ObjectId(req.headers.languageid)  ], 
                                        }                                        
                                    } 
                                }, 0]
                                
                                
                            } 
                        } 
                    }, 
                    {
                        $sort : {"categoryDetails.categoryName" : 1 }
                    } 
 
                ], (err, data) =>
                {    
                    //console.log(data);
                    var categories = [];  
                    //data.sort({ "item.category": 1, "item.type": -1 } )
                    console.log(!data.length);
                    data.forEach(
                        function(doc) { 
                            var cd = {
                                categoryId : doc._id,
                                categoryCode : doc.categoryCode,
                                //appSetting.SystemConfiguration.APIBaseUrl + 
                                imageURL : appSetting.SystemConfiguration.CategoryDisplayImagePath + (doc.imageURL == null || doc.imageURL == "" ? appSetting.SystemConfiguration.CategoryDefaultImage : doc.imageURL),
                                categoryName : doc.categoryDetails.categoryName,
                                categoryDescription : doc.categoryDetails.categoryDescription 
                            } 
                            categories.push(cd);
                        }, 
                        function(err) {
                            //throw err;
                            res.send(ResponseDTO.TechnicalError());  
                        }
                    );



                        //5 Provider List
                        UserMaster.aggregate([    
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
                        //$match : { userTypeId : ObjectId(constant.UserType.Provider), isActive : true, isDeleted : false, userStatusId : constant.UserStatus.ActiveUser },

                            $match : 
                            { 
                                $and :
                                [
                                    // {
                                    //     $or : 
                                    //     [
                                    //         {"providerDetails.categoryId" : ObjectId(req.body.categoryId),},
                                    //         //{"providerDetails.subCategoryId" : ObjectId(req.body.categoryId)}
                                    //     ]
                                    // },   
                                    {
                                        userTypeId : ObjectId(constant.UserType.Provider), isActive : true, isDeleted : false, 
                                        "providerDetails.categoryId" : ObjectId(req.body.categoryId), 
                                        userStatusId : constant.UserStatus.ActiveUser
                                    }
                                ]
                            }
                        }   
                    ], (err, data) =>
                    {  
                        console.log("No of Provider : " + data.length);

                        if (!err) 
                        {    
                            console.log("NoOfDoc : " + data.length); 
                            var random = Math.floor( Math.random() * data.length - 5  ); 
                            random = random < 0 ? 0 : random; 
                            console.log("random : " + random); 
 
 
                            // For Provider
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
                                                    noOfQue: { $sum: 1 }
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
                                // {
                                //     $unwind:"$appointmentDetails"
                                // },                                   
                                {
                                    $match : 
                                    { 
                                        userTypeId : ObjectId(constant.UserType.Provider), isActive : true, isDeleted : false, 
                                        "providerDetails.categoryId" : ObjectId(req.body.categoryId), userStatusId : constant.UserStatus.ActiveUser
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
                                        image: 
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
                                        degree: "$lookupLangDetails"
                                    }
                                }, 
                                // {
                                //     $sort : { "providerDetails.firstName" : 1 }
                                // } 
 

            
                            ], (err, provider) =>
                            {     
                                res.send(ResponseDTO.GetCategoryWithProviderDetails(constant.ErrorCode.DataRetrievedSuccessfully, constant.ErrorMsg.DataRetrievedSuccessfully, categories, new LINQ(provider).ToArray().slice(random, random + 5) ));  
 
                            });
                        }

                    });




                    //For Provider 
                    // ProviderDetails.count({categoryId : ObjectId(req.body.categoryId), isActive : true, isDeleted : false}, (err, NoOfDoc) => {
                    //     if (!err) 
                    //     {    
                    //         console.log("NoOfDoc : " + NoOfDoc); 
                    //         var random = Math.floor( Math.random() * NoOfDoc - 5  ); 
                    //         random = random < 0 ? 0 : random; 
                    //         console.log("random : " + random); 
 
 
                    //         // For Provider
                    //         UserMaster.aggregate(
                    //         [   
                    //             {
                    //                 $lookup:
                    //                 {
                    //                     from: "providerdetails",
                    //                     localField: "_id",
                    //                     foreignField: "user_Id",
                    //                     as: "providerDetails"
                    //                 }  
                    //             }, 
                    //             {
                    //                 $unwind:"$providerDetails"
                    //             },       
                    //             {
                    //                 $sort : {
                    //                     "firstName" : 1
                    //                 }
                    //             },                                                           
                    //             {
                    //                 $lookup:
                    //                 {
                    //                     from: "lookuplangdetails", 
 
                    //                     let: { degree: "$providerDetails.degree", language_Id: ObjectId(req.headers.languageid)}, //, order_qty: "$ordered" 
                    //                     pipeline: [
                    //                        { 
                    //                             $match:
                    //                             {  
                    //                                 $expr:
                    //                                 { 
                    //                                     $and:
                    //                                     [ 
                    //                                        { $in: [ "$lookupDetails_Id",  "$$degree" ] },
                    //                                        { $eq: [ "$language_Id",  "$$language_Id" ]}
                    //                                     ]
                    //                                 }
                    //                             }
                    //                        },
                    //                         { 
                    //                            $project: 
                    //                             { 
                    //                                 lookupDetails_Id: "$lookupDetails_Id", lookupValue: "$lookupValue", _id : 0 
                    //                             } 
                    //                         }
                    //                     ],                  

                    //                     as: "lookupLangDetails"
                    //                 }  
                    //             }, 
                    //             {
                    //                 $lookup:
                    //                 {
                    //                     from: "appointmentdetails",
                    //                     //localField: "_id",
                    //                     //foreignField: "provider_user_Id",

                    //                     let: { userId: "$_id" }, //, order_qty: "$ordered" 
                    //                     pipeline: [
                    //                        { 
                    //                             $match:
                    //                             { 
                    //                               //  lookupDetails_Id : $degree,
                    //                                 $expr:
                    //                                 { 
                    //                                     $and:
                    //                                     [ 
                    //                                        { $eq: [ "$provider_user_Id",  "$$userId" ] },
                    //                                        { $eq: [ "$isActive", true ] },
                    //                                        { $eq:  [ "$isDeleted", false ]  }, 
                    //                                        { $ne: [ "$rate",  null ] }
                    //                                     ]
                    //                                 }
                    //                             }
                    //                        }, 
                    //                        {
                    //                            $group: 
                    //                            {
                    //                                 _id: "$provider_user_Id",
                    //                                 //uniqueIds: {$addToSet: "$_id"},
                    //                                 total: { $sum: "$rate" },
                    //                                 noOfQue: { $sum: 1 },
                    //                                 avg : { $avg : "$rate" },
                    //                                // count1 : {$count : "$_id" }
                    //                             }
                    //                         },
                    //                         { 
                    //                            $project: 
                    //                             { 
                    //                                 NoOfQue: "$noOfQue", 
                    //                                 total: "$total", 
                    //                                 avg : "$avg", 
                    //                                // count1 : "$count1",
                    //                                 _id : 0 
                    //                             } 
                    //                         }
                    //                     ],   

                    //                     as: "appointmentDetails"

                    //                 }  
                    //             },  
                    //             // {
                    //             //     $unwind:"$appointmentDetails"
                    //             // },                                   
                    //             {
                    //                 $match : 
                    //                 { 
                    //                     userTypeId : ObjectId(constant.UserType.Provider), isActive : true, isDeleted : false, 
                    //                     "providerDetails.categoryId" : ObjectId(req.body.categoryId), userStatusId : constant.UserStatus.ActiveUser
                    //                 }
                    //             },  
                    //             {
                    //                 $project:
                    //                 {   
                    //                     _id: 0,
                    //                     userId: "$_id", 
                    //                     providerDetailsId: "$providerDetails._id",
                    //                     userTypeId: "$userTypeId",
                    //                     firstName: "$firstName",
                    //                     lastName: "$lastName",
                    //                     middleName: "$middleName",
                    //                     genderId: "$genderId",
                    //                     image: 
                    //                     {
                    //                         $concat: 
                    //                         [
                    //                             //appSetting.SystemConfiguration.APIBaseUrl, 
                    //                             appSetting.SystemConfiguration.UserDisplayImagePath,
                    //                             {
                    //                                 $cond: 
                    //                                 { 
                    //                                     if: 
                    //                                     { 
                    //                                         $or : [{
                    //                                             $eq: [ "$image", null ] 
                    //                                         },
                    //                                         {
                    //                                             $eq: [ "$image", "" ] 
                    //                                         }] 
                    //                                     }, 
                    //                                     then: appSetting.SystemConfiguration.UserDefaultImage, 
                    //                                     else: 
                    //                                     { 
                    //                                         $concat: 
                    //                                         [ 
                    //                                             { 
                    //                                                 $convert: 
                    //                                                 { 
                    //                                                     input: "$_id", to: "string" 
                    //                                                 } 
                    //                                             }, "/", "$image" 
                    //                                         ]
                    //                                     }
                    //                                 }               
                    //                             }
                    //                         ]
                    //                     },
                    //                     // noOfQue: "$appointmentDetails.NoOfQue",
                    //                     // rate : "$appointmentDetails.avg", 
                    //                     noOfQue: //"$appointmentDetails.NoOfQue",
                    //                     {
                    //                         $cond: [ 
                    //                             {
                    //                                 $eq: ["$appointmentDetails", [] ]
                    //                             }, 0, 
                    //                             {
                    //                                 $arrayElemAt:[ "$appointmentDetails.NoOfQue", 0]
                    //                             }] 
                    //                     }, 
                    //                     rate : //"$appointmentDetails.avg",                                        
                    //                     {
                    //                         $cond: [ 
                    //                             {
                    //                                 $eq: ["$appointmentDetails", [] ]
                    //                             }, 0, 
                    //                             {
                    //                                 $arrayElemAt:[ "$appointmentDetails.avg", 0]
                    //                             }] 
                    //                     },                                        
                    //                     degree: "$lookupLangDetails"
                    //                 }
                    //             }, 
                    //             // {
                    //             //     $sort : { "providerDetails.firstName" : 1 }
                    //             // } 
 

            
                    //         ], (err, provider) =>
                    //         {     
                    //             res.send(ResponseDTO.GetCategoryWithProviderDetails(constant.ErrorCode.DataRetrievedSuccessfully, constant.ErrorMsg.DataRetrievedSuccessfully, categories, new LINQ(provider).ToArray().slice(random, random + 5) ));  
 
                    //         });
                    //     }
                    // });
 
                });    

                
            }
 
      }
   
  });


  module.exports = router;