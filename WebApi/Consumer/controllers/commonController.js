
let date = require('date-and-time');
date.locale('hi');
var appSetting = require('../appsetting');  
// var { mongoose } = require('../db');
const express = require('express');
const fileUpload = require('express-fileupload');
var router = express.Router();
//var db = require('mongoose');
var ObjectId = require('mongoose').Types.ObjectId; 
var { SystemConfigurations } = require('../models/entity');
 
var constant = require('../../../CommonUtility/constant');  


var fs = require('fs'); 
var shell = require('shelljs');
const split = require('split-string');
var dateFormat = require('dateformat');

// constant.SUMMER.BEGINNING 
var { Feedback } = require('../models/entity');
var { CountryMasters, CountryLangMasters, LookupDetails, UserMaster, CategoryMasters, AppointmentDetails, AppointmentDocuments } = require('../models/entity');
var ResponseDTO = require('../../../DTO/Consumer/ResponseDTO');   


////////////  IOS  //////////////////
//Under Maintenance issue 
router.post('/ManageFlow', (req, res) => 
{  
    if(req.body.userId == undefined || req.body.userId.length <= 0)
    {
        //res.send(ResponseDTO.InvalidParameter()); 

        var data = {
            IsForUnderMaintenance : appSetting.SystemConfiguration.IsVisibleProviderRegistration 
        };
 
        res.send(ResponseDTO.ErrorMassage(constant.ErrorCode.DataRetrievedSuccessfully, constant.ErrorMsg.DataRetrievedSuccessfully,  data));    

    }
    else
    { 

        var data = {
            IsForUnderMaintenance : appSetting.SystemConfiguration.MaintenanceUserList.includes(req.body.userId) 
        };
 
        res.send(ResponseDTO.ErrorMassage(constant.ErrorCode.DataRetrievedSuccessfully, constant.ErrorMsg.DataRetrievedSuccessfully,  data));    

    } 

});    

router.post('/ProviderRegistration', (req, res) => 
{   
    res.send(ResponseDTO.ErrorMassage(constant.ErrorCode.ProviderRegistrationSuccessfully, constant.ErrorMsg.ProviderRegistrationSuccessfully, {}));    
});    

 ////////////  IOS  //////////////////



// Feedback 
router.post('/Feedback', (req, res) => 
{ 

    if(req.body.emailAddress == undefined || req.body.feedback == undefined || req.body.emailAddress.trim() == "" || req.body.feedback.trim() == "" )
    {
        res.send(ResponseDTO.InvalidParameter()); 
    }
    else
    {

        req.body.emailAddress = req.body.emailAddress.toLowerCase();
        console.log("Email Address : " + req.body.emailAddress);
                
        var feedbackDetails = new Feedback({  
            user_Id : ObjectId(req.headers.userid),
            emailAddress : req.body.emailAddress,
            feedback : req.body.feedback, 
            isActive : true,
            isDeleted : false, 
            createdBy : ObjectId(req.headers.userid),
            createdDateTime : new Date(),
            updatedBy : null,
            updatedDateTime : null
        });

        feedbackDetails.save((err, feedbackDoc) => {
            if (!err) {  
                res.send(ResponseDTO.ErrorMassage(constant.ErrorCode.FeedbackSentSuccessfully, constant.ErrorMsg.FeedbackSentSuccessfully, {} ));             
            }
            else { 
                console.log(err);
                res.send(ResponseDTO.TechnicalError());
                }
        });    
    }

});


//SystemConfiguration
router.post('/SystemConfiguration', (req, res) => 
{ 


    SystemConfigurations.find({isActive : true, isDeleted : false}, async (err,  systemConfigurationsDoc) =>
    {    
        console.log(systemConfigurationsDoc);
        if(!err)
        {   
            if(systemConfigurationsDoc.length > 0)
            {
            
                var SystemConfigurationDetails = {
                    pageSize : appSetting.SystemConfiguration.PageSize,
                    termeAndCondition : appSetting.SystemConfiguration.APIBaseUrl + "staticpage/termeandcondition",
                    aboutUs : appSetting.SystemConfiguration.APIBaseUrl + "staticpage/about",
                    privacyPolicy : appSetting.SystemConfiguration.APIBaseUrl + "staticpage/privacypolicy", 
                    whatsAppMobileNo : systemConfigurationsDoc[0].whatsapp_mobile_no 
                    // isUnderMaintenance : appSetting.SystemConfiguration.IsUnderMaintenance,
                    // underMaintenanceAppVersion : appSetting.SystemConfiguration.UnderMaintenanceAppVersion 
                    //maintenanceUserList : appSetting.SystemConfiguration.MaintenanceUserList
                };
            
                res.send(ResponseDTO.ErrorMassage(constant.ErrorCode.DataRetrievedSuccessfully, constant.ErrorMsg.DataRetrievedSuccessfully, SystemConfigurationDetails ));    
 
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
    }).sort({ _id : -1}).limit(1);;     


});    
  


// LookupDetails 
router.post('/LookupDetails', (req, res) => 
{ 

    if(req.body.lookupCode == undefined || req.body.lookupCode <= 0)
    {
        res.send(ResponseDTO.InvalidParameter()); 
    }
    else
    {
        var pipeline = [
            {
                "$project": {
                    "_id": 0,
                    "ld": "$$ROOT"
                }
            }, 
            {
                "$lookup": {
                    "localField": "ld._id",
                    "from": "lookuplangdetails",
                    "foreignField": "lookupDetails_Id",
                    "as": "lld"
                }
            }, 
            {
                "$unwind": {
                    "path": "$lld",
                    "preserveNullAndEmptyArrays": true
                }
            }, 
            {
                "$match": {
                    "ld.lookupCode": req.body.lookupCode,
                    "ld.isActive": true,
                    "ld.isDeleted": false,
                    "lld.isActive": true,
                    "lld.isDeleted": false,
                    "lld.language_Id": ObjectId(req.headers.languageid)
                }
            },
            {
                "$project": {
                    "lookupDetails_Id": "$lld.lookupDetails_Id",
                    "lookupValue": "$lld.lookupValue",
                    "_id": 0
                }
            }
        ];
        
        LookupDetails.aggregate(pipeline, (err, lookupDetails) =>
        {     
            if(!err)
            {
                console.log(lookupDetails);
                res.send(ResponseDTO.DataRetrievedSuccessfully(constant.ErrorCode.DataRetrievedSuccessfully, constant.ErrorMsg.DataRetrievedSuccessfully, lookupDetails ));  
            }
            else
            {
                res.send(ResponseDTO.TechnicalError());
            }

        });
    }

});
   

// Manage Country, State and City 
router.post('/CountryDetils', (req, res) => 
{ 

    var pipeline = [
        {
            "$project": {
                "_id": 0,
                "cd": "$$ROOT"
            }
        },  
        {
            "$match": { 
                "cd.isActive": true,
                "cd.isDeleted": false, 
                "cd.language_id": ObjectId(req.headers.languageid)
            }
        },
        {
            "$project": {
                "countryId": "$cd.countrymaster_id",
                "countryName": "$cd.countryName",
                "_id": 0
            }
        }
    ];
    
    CountryLangMasters.aggregate(pipeline, (err, countryLangMasters) =>
    {     
        if(!err)
        {
            console.log(countryLangMasters);
            res.send(ResponseDTO.DataRetrievedSuccessfully(constant.ErrorCode.DataRetrievedSuccessfully, constant.ErrorMsg.DataRetrievedSuccessfully, countryLangMasters ));  
        }
        else
        {
            res.send(ResponseDTO.TechnicalError());
        }

    });


});


//Category & SubCategory For Drop down  // Get Category List
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
                                //categoryCode : doc.categoryCode,
                                //appSetting.SystemConfiguration.APIBaseUrl + 
                                //imageURL :  appSetting.SystemConfiguration.CategoryDisplayImagePath + (doc.imageURL == null || doc.imageURL == "" ? appSetting.SystemConfiguration.CategoryDefaultImage : doc.imageURL),
                                
                                // {
                                //     $cond: { $ifNull: { $gte: [ "$qty", 250 ] }, then: 30, else: 20 }
                                // },  //doc.imageURL,
                                categoryName : doc.categoryDetails.categoryName,
                                //categoryDescription : doc.categoryDetails.categoryDescription,
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

 
                    res.send(ResponseDTO.CommonResponse(constant.ErrorCode.DataRetrievedSuccessfully, constant.ErrorMsg.DataRetrievedSuccessfully, categories)); //provider

    
 
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
                                //categoryCode : doc.categoryCode,
                                //appSetting.SystemConfiguration.APIBaseUrl + 
                                //imageURL : appSetting.SystemConfiguration.CategoryDisplayImagePath + (doc.imageURL == null || doc.imageURL == "" ? appSetting.SystemConfiguration.CategoryDefaultImage : doc.imageURL),
                                categoryName : doc.categoryDetails.categoryName,
                               // categoryDescription : doc.categoryDetails.categoryDescription 
                            } 
                            categories.push(cd);
                        }, 
                        function(err) {
                            //throw err;
                            res.send(ResponseDTO.TechnicalError());  
                        }
                    );



    
                    res.send(ResponseDTO.CommonResponse(constant.ErrorCode.DataRetrievedSuccessfully, constant.ErrorMsg.DataRetrievedSuccessfully, categories));  

                         
 
                });    

                
            }
 
      }
   
  });
 
 
// default options
router.use(fileUpload());

async function UploadFile(File, DestinationPath, NewFileName)  //FileType => 1=ProfileImage, 2=CategoryImage, 3=DocumentImage
{
    // console.log(File)
    // console.log(DestinationPath)
    // console.log(NewFileName)

    shell.mkdir('-p', DestinationPath);
    let promise = await new Promise(async function(resolve, reject) {  
        await File.mv(DestinationPath + NewFileName, function(err) {
            if (!err) 
            {   
                console.log("Upload Successfully.")
                resolve (true); 
            }
            else
            {
                //throw err;
                console.log("Invalid file name");
                console.log(err);
                resolve (false); 
            }
        });
        
    }); 

    return promise;
}

router.post('/UploadFile', async function(req, res) {
 
    console.log(req.body.fileType);
    console.log(req.files);
    console.log(req.files.file);
    if(req.files == undefined || req.files.file == undefined || req.body.fileType == undefined)
    {
        console.log("Missing files or fileType");
        res.send(ResponseDTO.InvalidParameter());
    }
    else if (Object.keys(req.files).length == 0) {
        //return res.status(400).send('No files were uploaded.');
        console.log("Invalid File");
        res.send(ResponseDTO.ErrorMassage(constant.ErrorCode.InvalidFile, constant.ErrorMsg.InvalidFile, {})); 
    }
    else
    {
     
        let File = req.files.file; 
        var extention = "." + split(File.name, { separator: '.' }).slice(-1)[0];
        var NewFileName = dateFormat(new Date(), "yyyy-mm-dd_hh-MM-ss-l_TT") + extention; 
        var DestinationPath = ""; 
        var DisplayPath = "";
        console.log(NewFileName); 


        console.log(req.body.fileType == constant.FileTypeId.UserProfileImage);

        if(req.body.fileType == constant.FileTypeId.UserProfileImage)
        {
            //NewFileName = "UserProfileImage" + ".png"; 


            console.log(req.body.userId);
            if(req.body.userId == undefined || req.body.userId.trim() == "")
            {
                res.send(ResponseDTO.InvalidParameter());
            }
            else
            {
                //appSetting.SystemConfiguration.APIBaseUrl + 
                DisplayPath = appSetting.SystemConfiguration.UserDisplayImagePath + req.body.userId + "/" + NewFileName ;
                DestinationPath = appSetting.SystemConfiguration.UploadUserImagePath + req.body.userId + "/";
               
                await UploadFile(req.files.file, DestinationPath, NewFileName).then(function(IsUploadFile){ 
                    if(IsUploadFile)
                    {
                       
                        UserMaster.findOneAndUpdate({_id : ObjectId(req.body.userId), isActive : true, isDeleted : false}, { $set: { image : NewFileName } }, (err, userMaster) => {
                            if(!err)
                            {
                                if(userMaster != null)
                                {
                                    res.send(ResponseDTO.ErrorMassage(constant.ErrorCode.FileUploadSuccessfully, constant.ErrorMsg.FileUploadSuccessfully, { URL : DisplayPath })); 
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
                    else
                    {
                        res.send(ResponseDTO.TechnicalError());
                    } 
                });

            }
 
        }
        else if(req.body.fileType == constant.FileTypeId.CategoryImage)
        {
            if(req.body.categoryId == undefined || req.body.categoryId.trim() == "")
            {
                res.send(ResponseDTO.InvalidParameter());
            }
            else
            {
                DisplayPath = appSetting.SystemConfiguration.APIBaseUrl + appSetting.SystemConfiguration.CategoryDisplayImagePath + NewFileName;
                DestinationPath = appSetting.SystemConfiguration.CategoryUploadImagePath;

                await UploadFile(req.files.file, DestinationPath, NewFileName).then(function(IsUploadFile){ 
                    if(IsUploadFile)
                    {
                       
                        CategoryMasters.findOneAndUpdate({_id : ObjectId(req.body.categoryId), isActive : true, isDeleted : false}, { $set: { imageURL : NewFileName } }, (err, categoryMaster) => {
                            if(!err)
                            {
                                if(categoryMaster != null)
                                {
                                    res.send(ResponseDTO.ErrorMassage(constant.ErrorCode.FileUploadSuccessfully, constant.ErrorMsg.FileUploadSuccessfully, { URL : DisplayPath })); 
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
                    else
                    {
                        res.send(ResponseDTO.TechnicalError());
                    } 
                });

            }
        }
        else if(req.body.fileType == constant.FileTypeId.AppointmentDocument)
        {
            if(req.body.appointmentId == undefined ||  req.body.toUserId == undefined || req.body.fromUserId == undefined || req.body.appointmentId.trim() == "" || req.body.toUserId.trim() == "" || req.body.fromUserId.trim() == "" || req.body.fromUserId == req.body.toUserId ) //|| req.body.appointmentDocumentType == undefined || req.body.appointmentDocumentType.trim() == ""
            {
                res.send(ResponseDTO.InvalidParameter());
            }
            else
            {
                //appSetting.SystemConfiguration.APIBaseUrl + 
                DisplayPath = appSetting.SystemConfiguration.DisplayAppointmentDocumentPath + req.body.appointmentId  + "/" + NewFileName;
                DestinationPath = appSetting.SystemConfiguration.UploadAppointmentDocumentPath + req.body.appointmentId + "/";
                            
                var query = {
                    "$or": [
                        {
                            "$and": [
                                {
                                    "_id": ObjectId(req.body.toUserId)
                                }, 
                                {
                                    "isActive": true
                                },
                                {
                                    "isDeleted": false
                                }
                            ]
                        },
                        {
                            "$and": [
                                {
                                    "_id": ObjectId(req.body.fromUserId)
                                }, 
                                {
                                    "isActive": true
                                },
                                {
                                    "isDeleted": false
                                }
                            ]
                        }
                    ]
                };
    
                //{_id : ObjectId(providerUserId), userTypeId : ObjectId(constant.UserType.Provider), isActive : true, isDeleted : false}
    
                UserMaster.count(query,  (err, NoOfDoc)  =>  { 
                    if(!err)
                    {
                        if(NoOfDoc == 2)
                        {
                            
                            AppointmentDetails.count({_id : ObjectId(req.body.appointmentId), isActive : true, isDeleted : false}, async (err, IsExistAppointmentId) => {
                                if(!err)
                                {
                                    console.log(IsExistAppointmentId)
                                    if(IsExistAppointmentId > 0)
                                    {

                                        await UploadFile(req.files.file, DestinationPath, NewFileName).then(function(IsUploadFile){ 
                                            if(IsUploadFile)
                                            {

                                                var appointmentDocuments = new AppointmentDocuments({ 
                                                    appointmentdetails_Id : ObjectId(req.body.appointmentId),
                                                    to_user_Id : ObjectId(req.body.toUserId), 
                                                    from_user_Id : ObjectId(req.body.fromUserId),
                                                    document : NewFileName,
                                                    isActive : true,
                                                    isDeleted : false, 
                                                    createdBy : ObjectId(req.headers.userid),
                                                    createdDateTime : new Date(),
                                                    updatedBy : null,
                                                    updatedDateTime : null  
                                                });
                    
                                                appointmentDocuments.save((err, result) => { 
                                                    if (!err) 
                                                    {
                                                        console.log(result);
                                                        res.send(ResponseDTO.ErrorMassage(constant.ErrorCode.FileUploadSuccessfully, constant.ErrorMsg.FileUploadSuccessfully, { URL : DisplayPath, FileName : NewFileName })); 
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
                                        console.log("4");
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
                            console.log("3");
                            res.send(ResponseDTO.InvalidParameter()); 
                        }
                    }
                    else
                    {
                        //Wrong Pass consumerUserId or providerUserId parameters
                        console.log("2");
                        res.send(ResponseDTO.InvalidParameter()); 
                    }
                });

            }
        }
        else
        {
            console.log("1");
            res.send(ResponseDTO.InvalidParameter());
        }




        //For Call Upload File Function
        // await UploadFile(req.files.file, DestinationPath, NewFileName).then(function(IsUploadFile){ 
        //     if(IsUploadFile)
        //     {
        //         res.send(ResponseDTO.ErrorMassage(constant.ErrorCode.FileUploadSuccessfully, constant.ErrorMsg.FileUploadSuccessfully, { URL : NewFileName})); 
        //     }
        //     else
        //     {
        //         res.send(ResponseDTO.TechnicalError());
        //     } 
        // });

           
    }
});



  module.exports = router;