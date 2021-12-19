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
var { WithdrawDetails, OTPDetail, LoginToken, DeviceTokenMasters, UserMaster, UserDetails, ProviderDetails, ProviderLangDetails, LookupLangDetails, UserPurchases, UserConsumptions, TemplateLangDetails, CategoryMasters } = require('../models/entity');
//var { Employee } = require('../models/-employee');
var ResponseDTO = require('../../../DTO/Consumer/ResponseDTO');   
var Helper = require('./Helper.js');
// => localhost:3000/account/
var contains = require("string-contains");
var dateFormat = require('dateformat');
const replaceString = require('replace-string');


// For UserList with filter, search, sorting, paging
router.post('/ProviderList', (req, res) => {
    
      console.log(req.body); 

      if(req.body.pageNo == undefined || req.body.pageSize == undefined || req.body.sortOrderId == undefined || req.body.sortFieldName == undefined || req.body.searchText == undefined )
      {
        res.send(ResponseDTO.InvalidParameter()); 
      }
      else if(req.body.pageNo <= 0 || req.body.pageSize <= 0 || req.body.sortOrderId > constant.SortOrderId.Default || req.body.sortOrderId < constant.SortOrderId.Asc || ((req.body.sortOrderId == constant.SortOrderId.Asc || req.body.sortOrderId == constant.SortOrderId.Desc) && req.body.sortFieldName.trim() == "" ) )
      {
        res.send(ResponseDTO.InvalidParameter()); 
      }
      else if(req.body.userStatusId == undefined || !(req.body.userStatusId == constant.UserStatus.ActiveUser || req.body.userStatusId == constant.UserStatus.NotApproveByAdmin))
      {
        console.log("Wrong userStatusId");
        res.send(ResponseDTO.InvalidParameter()); 
      }
      else
      {   

        var pipeline = [
            // {
            //     $let:
            //     {
            //         vars: { totalEarn : 0, noOfQue : 0 }, //high: "$$low"
            //         //in: { $gt: [ "$$low", "$$high" ] }
            //     }
            // },
            {
                $project: {
                    "_id": 0,
                    "um": "$$ROOT"
                }
            }, 
            {
                $lookup: {
                    "localField": "um._id",
                    "from": "providerdetails",
                    "foreignField": "user_Id",
                    "as": "pd"
                }
            }, 
            {
                $unwind: {
                    "path": "$pd",
                    "preserveNullAndEmptyArrays": true
                }
            }, 
            {
                $lookup: {
                    "localField": "um._id",
                    "from": "userconsumptions",
                    "foreignField": "provider_user_Id",
                    "as": "uc"
                }
            },  
            { 
                $lookup:
                {
                    from: "appointmentdetails",
                    //localField: "_id",
                    //foreignField: "provider_user_Id",

                    let: { userId: "$um._id" }, //, order_qty: "$ordered" 
                    pipeline: [
                        { 
                            $match:
                            { 
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
                                noOfQue: { $sum: 1 }
                            }
                        },
                        { 
                            $project : 
                            { 
                                // noOfQue : 
                                // { 
                                //     $cond : 
                                //     { 
                                //         if:  { $gt : [ "$noOfQue", 0] }, 
                                //         then: "$noOfQue", 
                                //         else: { $push:  0  }  
                                //     } 
                                // },
                                noOfQue: "$noOfQue", 
                                
                                //total: "$total", 
                                //avg : "$avg", 
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
            
            // {
            //     $group: 
            //     {
                    
            //         _id: "$uc.provider_user_Id",
            //         //uniqueIds: {$addToSet: "$_id"},
            //         totalEarn: { $sum: "$price" },
            //        // noOfQue: { $sum: 1 },
            //         //avg : { $avg : "$rate" },
            //         // count1 : {$count : "$_id" }
            //     }
            // },
            // {
            //     $unwind: {
            //         "path": "$uc",
            //         "preserveNullAndEmptyArrays": true
            //     }
            // },             
            {
                $match: {
                    "um.isActive": true,
                    "um.isDeleted": false,
                    "pd.isActive": true,
                    "pd.isDeleted": false,
                    "um.userTypeId": ObjectId(constant.UserType.Provider),
                    "um.userStatusId" : req.body.userStatusId
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
                   // emailAddress: "$um.emailAddress",
                    mobileNo: "$um.mobileNo",
                   // DOB: "$um.DOB",
                   // genderId: "$um.genderId",
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
                                        $or:[{
                                                $eq: [ "$um.image", null ] 
                                            },
                                            {
                                                $eq: [ "$um.image", "" ] 
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
                                                    input: "$um._id", to: "string" 
                                                } 
                                            }, "/", "$um.image" 
                                        ]
                                    }
                                }               
                            }
                        ]
                    }, 
                    userTypeId : "$um.userTypeId",
                    createdDateTime: "$um.createdDateTime",
                    providerdetailsId: "$pd._id",
                    noOfQue : //"$appointmentDetails.noOfQue",
                    {
                        $cond: [ 
                            {
                                $eq: ["$appointmentDetails", [] ]
                            }, 0, 
                            {
                                $arrayElemAt:[ "$appointmentDetails.noOfQue", 0]
                            }] 
                    }, 
                    totalEarn : "0",
                    supplierCode : { $ifNull: [ "$pd.supplierCode", 0 ] },
                   // ad : "$appointmentDetails",  
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
                        var RowValue = " ";
                        RowValue += item.firstName == null ? " " : item.firstName + " ";
                        RowValue += item.mobileNo == null ? " " : item.mobileNo + " "; 
                        //RowValue += item.image == null ? " " : item.image + " "; 
                        RowValue += item.noOfQue == null ? " " : item.noOfQue + " ";  
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
                                    case "firstName": 
                                        return data.firstName.trim().toLowerCase();
                                    case "mobileNo": 
                                        return data.mobileNo;
                                    case "image": 
                                        return data.image;                                                                                
                                    case "noOfQue": 
                                        return data.noOfQue;   
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
                                    case "firstName": 
                                        return data.firstName.trim().toLowerCase();
                                    case "mobileNo": 
                                        return data.mobileNo;
                                    case "image": 
                                        return data.image;  
                                    case "noOfQue": 
                                        return data.noOfQue;   
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
                throw err;
                //res.send(ResponseDTO.TechnicalError());  
            }
        }); 

             
      }
   
});

   
//For Create Provider Details - Done New Changes.
router.post('/CreateProvider', (req, res) => {

    console.log(req.body);
    var subCategory = null;

    if(req.body.subCategoryId == undefined || !req.body.subCategoryId.trim())
    { 
        subCategory = null;
    }
    else
    {
        subCategory = ObjectId(req.body.subCategoryId);
    }
    
    
    if(req.body.firstName == undefined || req.body.lastName == undefined || req.body.middleName == undefined || req.body.emailAddress == undefined || req.body.mobileNo == undefined || req.body.DOB == undefined || req.body.genderId == undefined || req.body.userTypeId == undefined || !req.body.firstName.trim() || !req.body.userTypeId.trim() || req.body.emailAddress.trim() == "" || !req.body.mobileNo.trim() || req.body.userTypeId != constant.UserType.Provider || (req.body.genderId < constant.Gender.Secret || req.body.genderId > constant.Gender.Female) || req.body.password == undefined || !req.body.password.trim() || req.body.userStatusId == undefined || !(req.body.userStatusId == constant.UserStatus.ActiveUser || req.body.userStatusId == constant.UserStatus.NotApproveByAdmin) )
    {
        //User Master 
        console.log("Invalid User Master");
        res.send(ResponseDTO.InvalidParameter()); 
    } 
    else if(req.body.experience == undefined || req.body.categoryId == undefined || req.body.degree == undefined || req.body.price == undefined || req.body.commissionPercentage == undefined || req.body.experience < 0 || req.body.price < 0 || req.body.commissionPercentage < 0 || req.body.degree.length < 1 || req.body.language == undefined || req.body.language.length < 1 || !req.body.categoryId.trim())
    {
        //Provider Details
        console.log("Invalid Provider Details");
        res.send(ResponseDTO.InvalidParameter()); 
    } 
    else if(req.body.description == undefined || req.body.description.length < 2)
    {
        //Description Details
        console.log("Invalid Description Details");
        res.send(ResponseDTO.InvalidParameter())
    }
    else if(req.body.price % 1 != 0)
    {
        res.send(ResponseDTO.InvalidParameter()); 
    } 
    else if(!(req.body.price <= 15 && req.body.price >= 1))
    {
        console.log("Price must be 1 KD to 15 KD.")
        res.send(ResponseDTO.InvalidParameter()); 
    }    
    else
    {  
 

        req.body.emailAddress = req.body.emailAddress.toLowerCase();
        console.log("Email Address : " + req.body.emailAddress);

        //console.log(req.body); 
        // if(req.body.userTypeId == constant.UserType.Provider && (req.body.genderId >= constant.Gender.Secret && req.body.genderId <= constant.Gender.Female)  )
        // {
        CategoryMasters.find({ _id : ObjectId(req.body.categoryId), isDeleted : false }, (err, categoryMastersDoc)  => 
        {   
            console.log("Check CategoryMasters"); 
            console.log("NoOfUseAsSubCategory : " + categoryMastersDoc.length); 
            
            if(!err)
            {   
                if(categoryMastersDoc.length > 0)
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
                                                    userStatusId: req.body.userStatusId,
                                                    isActive : true,
                                                    isDeleted : false, 
                                                    createdBy : ObjectId(req.headers.userid),
                                                    createdDateTime : new Date(),
                                                    updatedBy : null,
                                                    updatedDateTime : null,

                                                    password : req.body.password
                                                });
                                
                                                userMaster.save((err, userMasterDoc) => { 
                                                        if (!err) { 
                                                        
                                                        // console.log(userMasterDoc);

                                                        //console.log(userMasterDoc._id);

                                                        var providerDetail = new ProviderDetails({ 
                                                            user_Id : ObjectId(userMasterDoc._id),
                                                            experience : req.body.experience,
                                                            categoryId : ObjectId(req.body.categoryId),
                                                            subCategoryId : ObjectId(req.body.subCategoryId),
                                                            degree : req.body.degree, 
                                                            price : req.body.price, 
                                                            commissionPercentage : req.body.commissionPercentage,
                                                            isActive : true,
                                                            isDeleted : false, 
                                                            createdBy : ObjectId(req.headers.userid),
                                                            createdDateTime : new Date(),
                                                            updatedBy : null,
                                                            updatedDateTime : null,

                                                            language : req.body.language,
                                                        });
                                        
                                                        providerDetail.save((err, providerDetailsDoc) => { 
                                                            
                                                            if (!err) 
                                                            {  

                                                                var providerlangdetails = [];

                                                                req.body.description.forEach(function(item){

                                                                    var providerlangdetail = new ProviderLangDetails({  
                                                                        language_Id :  ObjectId(item.language_Id),
                                                                        providerdetails_Id : ObjectId(providerDetailsDoc._id),
                                                                        description : item.description,
                                                                        isActive : true,
                                                                        isDeleted : false, 
                                                                        createdBy : ObjectId(req.headers.userid),
                                                                        createdDateTime : new Date(),
                                                                        updatedBy : null,
                                                                        updatedDateTime : null  
                                                                    });

                                                                    providerlangdetails.push(providerlangdetail);

                                                                });

                                                                //console.log(providerlangdetails);

                                                                ProviderLangDetails.insertMany(providerlangdetails, (err, providerlangdetailsDoc) => {
                                                                    if (!err) {  
            
                                                                        var EmailDetails = {
                                                                            languageid : req.headers.languageid,
                                                                            templateCode : constant.TemplateCode.WelcomeEmail,
                                                                            to : userMasterDoc.emailAddress,
                                                                            from : appSetting.Email.FromEmail, 
                                                                            userName : userMasterDoc.emailAddress,
                                                                            password : userMasterDoc.password,
                                                                            firstName : userMasterDoc.firstName,
                                                                            userTypeId : constant.UserType.Provider
                                                                        } 



                                                                        var query = {
                                                                            language_Id : ObjectId(EmailDetails.languageid),
                                                                            templateCode : EmailDetails.templateCode, 
                                                                            isActive:  true, 
                                                                            isDeleted:  false 
                                                                        };
                                                                            
                                                                        console.log(query);

                                                                        TemplateLangDetails.find(query, async (err, templateLangDetails) => 
                                                                        {
                                                                
                                                                            console.log("======> " + templateLangDetails.length); 
                                                                            if (!err) 
                                                                            { 
                                                                                //console.log(doc);   
                                                                                console.log("Template Lang Details : ");
                                                                                console.log(templateLangDetails);
                                                                                
                                                                                if(templateLangDetails.length > 0 && templateLangDetails[0].emailSubject.length > 0 && templateLangDetails[0].emailBody.length > 0)
                                                                                { 

                                                                                    console.log("START send email...");

                                                                                    var emailBody = replaceString(templateLangDetails[0].emailBody, "@User@", EmailDetails.firstName );
                                                                                    emailBody = replaceString(emailBody, "@UserName@", EmailDetails.userName );
                                                                                    emailBody = replaceString(emailBody, "@Password@", EmailDetails.password );
                                                                                
                                                                                    console.log("Email Send Details");
                                                                                    console.log(EmailDetails);
                                                                                    console.log("1"); 
                                                                                    var IsSendEmail = await Helper.SendEmail({ To : EmailDetails.to, From : EmailDetails.from, Subject : templateLangDetails[0].emailSubject, Body : emailBody });
                                                                                    console.log("2");
                                                                                    console.log(IsSendEmail);


                                                                                }
                                                                                else
                                                                                {
                                                                                    console.log("Not found the template for send the email.");
                                                                                    console.log('Error :' + JSON.stringify(err, undefined, 2));
                                                                                    //res.send(ResponseDTO.ErrorMassage(constant.ErrorCode.InvalidLoginCredential, constant.ErrorMsg.InvalidLoginCredential, {} ) );
                                                                                }
                                                                                
                                                                            }
                                                                            else 
                                                                            { 
                                                                                console.log('Error :' + JSON.stringify(err, undefined, 2));
                                                                                //res.send(ResponseDTO.TechnicalError()); 
                                                                            }
                                                                        });                                                              


                                                                        console.log(providerlangdetailsDoc.length);
                                                                        res.send(ResponseDTO.DataRetrievedSuccessfully(constant.ErrorCode.CreateSuccessfully, constant.ErrorMsg.CreateSuccessfully, { userId : userMasterDoc._id } ) );
                                                                                                            
                                                                    }
                                                                    else {  
                                                                        //console.log("7");
                                                                        //throw err;
                                                                        res.send(ResponseDTO.TechnicalError()); 
                                                                    }
                                                                });                                                               
                                                        
                                                            }
                                                            else {  
                                                                //console.log("5");
                                                                //throw err;
                                                                res.send(ResponseDTO.TechnicalError()); 
                                                                }
                                                        });   
                                                            
                                                    }
                                                    else { 
                                                        //console.log("3"); 
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
                                            //console.log("2");
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
                                //console.log("1");
                                //throw err;
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

    
 
});

  
//For View Provider Details  - Done New Changes.
router.post('/ViewProvider', (req, res) => {
    console.log(req.body);
  
      if(req.body.userId == undefined || req.body.userId.trim() == "")
      {
          res.send(ResponseDTO.InvalidParameter()); 
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
                                                          //{ $eq: [ "$language_Id",  "$$language_Id" ]},
                                                          { $eq: [ "$isActive", true ] },
                                                          { $eq: [ "$isDeleted", false ]  }, 
                                                      ]
                                                  }
                                              }
                                          },
                                          { 
                                              $project: 
                                              { 
                                                    _id : 0,
                                                    language_Id : "$language_Id",
                                                    description: "$description", 

                                              } 
                                          }
                                      ],                  
          
                                      as: "providerLangDetails"
                                  }  
                              },     
                            //   {
                            //       $unwind:"$providerLangDetails"
                            //   }, 
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
                                    from: "categorymasters", 
                                    let: { categoryId : "$categoryId", language_Id: ObjectId(req.headers.languageid) }, //, order_qty: "$ordered" 
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
        
                                    let: { categoryId: "$categoryId", language_Id: ObjectId(req.headers.languageid)}, //, order_qty: "$ordered" 
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
                                                        { $eq: [ "$isActive", true ] },
                                                        { $eq: [ "$isDeleted", false ]  }, 
                                                    ]
                                                }
                                            }
                                        },
                                        // {
                                        //     $unwind:"$categorylangdetails"
                                        // },   
                                        { 
                                            $project: 
                                            { 
                                               // "categoryId": "$$ROOT",
                                                _id : 0, 
                                                categoryId: "$category_id", 
                                                categoryName: "$categoryName"
                                            } 
                                        }
                                    ],                  
        
                                    as: "categorylangdetails"
                                }, 

                            },    
                            // {
                            //     $unwind:"$categorylangdetails"
                            // },  
                            {
                                $unwind: {
                                    path: "$categorylangdetails",
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
                                                        //{ $or: [ { $eq: [ "$category_id",  null ] }, { $eq: [ "$category_id",  "$$subCategoryId" ] } ] },

                                                        { $eq: [ "$category_id",  "$$subCategoryId" ] },
                                                        { $eq: [ "$language_id",  "$$language_Id" ]},
                                                        { $eq: [ "$isActive", true ] },
                                                        { $eq: [ "$isDeleted", false ]  }, 
                                                    ]
                                                }
                                            }
                                        },
                                        // {
                                        //     $unwind:"$categorylangdetails"
                                        // },   
                                        { 
                                            $project: 
                                            { 
                                               // "categoryId": "$$ROOT",
                                                _id : 0, 
                                                categoryId: "$category_id" , 
                                                categoryName: "$categoryName", 
                                            } 
                                        }
                                    ],                  
        
                                    as: "subCategorylangdetails"
                                }, 

                            },    
                           // { $limit: 1 },
                            // {
                            //     $unwind:
                            //     {
                            //         path : "$subCategorylangdetails", 
                            //         includeArrayIndex: "subCategorylangdetails",
                            //         preserveNullAndEmptyArrays: false
                            //     }
                            // },    
                            // {
                            //     $unwind:"$subCategorylangdetails"
                            // },      
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
                                                        { $eq: [ "$isActive", true ] },
                                                        { $eq: [ "$isDeleted", false ]  }, 
                                                    ]
                                                }
                                            }
                                        },
                                        { 
                                            $project: 
                                            { 
                                                
                                                lookupDetails_Id: "$lookupDetails_Id",                                                 
                                                lookupValue: "$lookupValue", _id : 0, 
                                                // lookupDetails_Id : 
                                                // {
                                                //     $cond: 
                                                //     { 
                                                //         if: 
                                                //         { 
                                                //             $exists: true
                                                //         }, 
                                                //         then: "$lookupDetails_Id", 
                                                //         else: []
                                                        
                                                //     }                                                
                                                
                                                // }



                                            } 
                                        }
                                    ],                  
        
                                    as: "lookupLangDetailsForLanguage"
                                }  
                            },                                                                                    
                              { 
                                  $project: 
                                  {  
                                        _id : 0,
                                        providerDetailsId : "$_id",
                                        category : //"$categorylangdetails",
                                        {
                                            categoryId: "$categorylangdetails.categoryId", 
                                            categoryName: "$categorylangdetails.categoryName",  
                                            hasSubCategory : "$categorymasters.hasSubCategory"                                                  
                                        },
                                        //subCategory : "$subCategorylangdetails",
                                        subCategory : //"$subCategorylangdetails",
                                        { 
                                            $cond: 
                                            {
                                                if: { $eq : [ "$subCategorylangdetails" , [] ] },
                                                then: 
                                                {
                                                    categoryId : "", 
                                                    categoryName : ""
                                                },
                                                else: 
                                                { 
                                                    $arrayElemAt: [ "$subCategorylangdetails", 0 ]  
                                                }
                                            } 
                                        },
                                    //   {
                                    //     categoryId : "$subCategorylangdetails[0].categoryId",
                                    //     categoryName : "$subCategorylangdetails[0].categoryName"
                                    //   },
                                      experience : "$experience",
                                      price : "$price", 
                                      currencySymbol: constant.CurrencySymbol.Kuwait,
                                      commissionPercentage : "$commissionPercentage",
                                      description:"$providerLangDetails",
  
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
                //   {
                //       $unwind:"$appointmentDetails"
                //   },                                   
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
                          noOfQue: "$appointmentDetails.NoOfQue",
                          rate : "$appointmentDetails.avg",  
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
                          userStatusId : "$userStatusId",
                          providerDetails : "$providerDetails",  
                          //degree: "$lookupLangDetails",
                          
                      }
                  },  
  
  
              ], (err, provider) =>
              {      
                  console.log(provider);
                 // console.log(provider[0].providerDetails);
                  res.send(ResponseDTO.GetProviderList(constant.ErrorCode.DataRetrievedSuccessfully, constant.ErrorMsg.DataRetrievedSuccessfully, provider[0] ));  
  
              });//.skip( NoOfSkipRec ).limit( appSetting.SystemConfiguration.PageSize );
  
      }
   
  });
  


// For Provider Update Profile Details - Done New Changes.
router.post('/UpdateProvider', (req, res) => {

    var subCategory = null;

    if(req.body.subCategoryId == undefined || !req.body.subCategoryId.trim())
    { 
        subCategory = null;
    }
    else
    {
        subCategory = ObjectId(req.body.subCategoryId);
    }

    if(req.body.userId == undefined || req.body.firstName == undefined || req.body.lastName == undefined || req.body.middleName == undefined || req.body.emailAddress == undefined || req.body.mobileNo == undefined || req.body.DOB == undefined || req.body.genderId == undefined || req.body.userTypeId == undefined || !req.body.firstName.trim() || !req.body.userTypeId.trim() ||  req.body.emailAddress.trim() == "" || !req.body.mobileNo.trim() || req.body.userTypeId != constant.UserType.Provider || req.body.genderId < constant.Gender.Secret || req.body.genderId > constant.Gender.Female || req.body.userStatusId == undefined || !(req.body.userStatusId == constant.UserStatus.ActiveUser || req.body.userStatusId == constant.UserStatus.NotApproveByAdmin)  )
    {
        //User Master 
        console.log("Invalid User Master");
        res.send(ResponseDTO.InvalidParameter()); 
    } 
    else if(req.body.experience == undefined || req.body.categoryId == undefined || req.body.degree == undefined || req.body.price == undefined || req.body.commissionPercentage == undefined || req.body.experience < 0 || req.body.price < 0 || req.body.commissionPercentage < 0 || req.body.degree.length < 1  || req.body.language == undefined || req.body.language.length < 1 || !req.body.categoryId.trim())
    {
        //Provider Details
        console.log("Invalid Provider Details");
        res.send(ResponseDTO.InvalidParameter()); 
    }
    else if(req.body.description == undefined || req.body.description.length < 2)
    {
        //Description Details
        console.log("Invalid Description Details");
        res.send(ResponseDTO.InvalidParameter())
    }
    else if(req.body.price % 1 != 0)
    {
        res.send(ResponseDTO.InvalidParameter()); 
    } 
    else if(!(req.body.price <= 15 && req.body.price >= 1))
    {
        console.log("Price must be 1 KD to 15 KD.")
        res.send(ResponseDTO.InvalidParameter()); 
    }        
    else
    {   


        req.body.emailAddress = req.body.emailAddress.toLowerCase();
        console.log("Email Address : " + req.body.emailAddress);

        var EmailExist = {
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


        var MobileExist = {
            "$and": [
                {
                    "_id": {
                        "$ne": ObjectId(req.body.userId)
                    }
                },
                {
                    "mobileNo": req.body.mobileNo
                },
                {
                    "isActive": true
                },
                {
                    "isDeleted": false
                },
                {
                    "mobileNo": {
                        "$ne": ""
                    }
                }
            ]
        };        
        
        //UserMaster.updateOne({ _id: ObjectId(req.body.userId), isActive : true, isDeleted : false }, { $set: { firstName : req.body.firstName, lastName : req.body.lastName, middleName : req.body.middleName, emailAddress : req.body.emailAddress, mobileNo : req.body.mobileNo, DOB : req.body.DOB, genderId : req.body.genderId, updatedBy: ObjectId(req.headers.userId), updatedDateTime : new Date(), userStatusId : req.body.userStatusId } }, function(err, userMasterResult) {
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
                            if(userMasterDoc[0].userStatusId == constant.UserStatus.ActiveUser && req.body.userStatusId == constant.UserStatus.NotApproveByAdmin)
                            {
                                console.log("You can not change the user status active to deactive(DisApproved).");
                                res.send(ResponseDTO.ErrorMassage( constant.ErrorCode.NotApprovedToDisApprovedUser, constant.ErrorMsg.NotApprovedToDisApprovedUser, {} ));                              
                            }
                            else if(categoryMastersDoc[0].hasSubCategory == true && subCategory == null)
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
        
                                UserMaster.find(EmailExist, (err, IsExistEmailAddress) => 
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

                                            UserMaster.find(MobileExist, (err, IsExistMobileNo) => 
                                            {                   
                                                if (!err) 
                                                { 
                                                    if(IsExistMobileNo.length > 0)
                                                    { 
                                                        //Already Mobile No exist
                                                        res.send(ResponseDTO.ErrorMassage( constant.ErrorCode.MobileNoAlreadyExists, constant.ErrorMsg.MobileNoAlreadyExists, {} )); 
                                                    }
                                                    else
                                                    {                     

                                                        //Update Provider Common Details
                                                        UserMaster.updateOne({ _id: ObjectId(req.body.userId), isActive : true, isDeleted : false }, { $set: { firstName : req.body.firstName, lastName : req.body.lastName, middleName : req.body.middleName, emailAddress : req.body.emailAddress, mobileNo : req.body.mobileNo, DOB : req.body.DOB, genderId : req.body.genderId, updatedBy: ObjectId(req.headers.userId), updatedDateTime : new Date(), userStatusId : req.body.userStatusId } }, function(err, userMasterResult) {
                                                            console.log(userMasterResult);
                                                            if (!err)  
                                                            {

                                                                if(userMasterResult.n > 0)
                                                                { 
                                        
                                                                    //Update Provider Details
                                                                    ProviderDetails.updateOne({ user_Id: ObjectId(req.body.userId), isActive : true, isDeleted : false }, { $set: { categoryId : req.body.categoryId, subCategoryId : subCategory, experience : req.body.experience, price : req.body.price, commissionPercentage : req.body.commissionPercentage, degree: req.body.degree , updatedBy: ObjectId(req.headers.userId), updatedDateTime : new Date(), language : req.body.language } },  { new : true },async function(err, providerDetailsDoc) {
                                                                        //console.log(providerDetailsDoc);
                                                                        if (!err)  
                                                                        { 
                                                                            // console.log(providerDetailsDoc);
                                                                            var NoOfUpdateRecords = 0;
                                                                            console.log("==> 1 <==   " + NoOfUpdateRecords);
                                                                            
                                                                            
                                                                            await req.body.description.forEach( async function(item){


                                                                                ProviderLangDetails.updateOne(
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
                                                                                                res.send(ResponseDTO.ErrorMassage(constant.ErrorCode.UpdateSuccessfully, constant.ErrorMsg.UpdateSuccessfully, {} ));   
                                                                                            }
                                                                                            // else
                                                                                            // {
                                                                                            //     res.send(ResponseDTO.ErrorMassage(constant.ErrorCode.NotUpdateProfile, constant.ErrorMsg.NotUpdateProfile, {} ));  
                                                                                            // }

                                                                                        }
                                                                                        else
                                                                                        {
                                                                                            // return res.send(ResponseDTO.ErrorMassage(constant.ErrorCode.NotUpdateProfile, constant.ErrorMsg.NotUpdateProfile, {} ));  
                                                                                            
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
                                                    //throw err;
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

 

// For Delete Provider Details 
router.post('/DeleteProvider', (req, res) => {

    if(req.body.userId == undefined)
    {
        res.send(ResponseDTO.InvalidParameter()); 
    }
    else
    {  
     

        // Delete User Details
        UserMaster.find({ _id: req.body.userId }, (err, userMaster)  => 
        {  
            if(!err)
            {
                if(userMaster.length)
                {
                    //Delete User Master Details
                    UserMaster.updateOne({ _id: req.body.userId }, { $set: { isDeleted : true } }, function(err, userMaster) {
                        if (!err) 
                        {
                            console.log("Delete User Master"); 
                            // Delete Provider Details 
                            ProviderDetails.updateOne({ user_Id: req.body.userId }, { $set: { isDeleted : true } }, function(err, providerDetails) {
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
                                        

                                    console.log("Delete Provider Details"); 
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





//For Transaction Details with Current Balance
router.post('/TransactionHistory', (req, res) => {
    //  console.log(req.body);
    
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
                    consumerName: "$usermasters.firstName", 
                    genderId: "$usermasters.genderId", 
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
                                image: //appSetting.SystemConfiguration.WithdrawDefaultImage, 
                                {
                                    $concat: 
                                    [
                                        appSetting.SystemConfiguration.APIBaseUrl, 
                                        appSetting.SystemConfiguration.UserDisplayImagePath,
                                        appSetting.SystemConfiguration.WithdrawDefaultImage
                                    ]
                                }, 
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
 
                            var StartRow = (req.body.pageNo - 1) * req.body.pageSize;
                            var EndRow = StartRow + req.body.pageSize ;
            
                            var WalletDetails = await Helper.getProviderWalletDetailsByUserId(req.body.userId);
            
                            let promise = await new Promise(async function(resolve, reject) {


                                var data =  new LINQ(transactionDetails)                
                                .Where(function(item) 
                                { 
                                    var RowValue = " ";
                                    RowValue += item.commissionPercentage == null ? " " : item.commissionPercentage + " ";
                                    RowValue += item.price == null ? " " : item.price + " ";
                                    RowValue += item.commissionPrice == null ? " " : item.commissionPrice + " ";
                                    RowValue += item.totalPrice == null ? " " : item.totalPrice + " ";
                                    RowValue += item.consumerName == null ? " " : item.consumerName + " ";
                                    //RowValue += item.image == null ? " " : item.image + " "; 
                                    RowValue += item.genderId == null ? " " : item.genderId + " ";
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
                                                case "commissionPercentage": 
                                                    return data.commissionPercentage;   
                                                case "price": 
                                                    return data.price;   
                                                case "commissionPrice": 
                                                    return data.commissionPrice;   
                                                case "totalPrice": 
                                                    return data.totalPrice;      
                                                case "consumerName": 
                                                    return data.consumerName.trim().toLowerCase();
                                                case "genderId": 
                                                    return data.genderId;   
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
                                                case "commissionPercentage": 
                                                    return data.commissionPercentage;   
                                                case "price": 
                                                    return data.price;   
                                                case "commissionPrice": 
                                                    return data.commissionPrice;   
                                                case "totalPrice": 
                                                    return data.totalPrice;                                                                                                   
                                                case "consumerName": 
                                                    return data.consumerName.trim().toLowerCase(); 
                                                case "genderId": 
                                                    return data.genderId;      
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



module.exports = router;