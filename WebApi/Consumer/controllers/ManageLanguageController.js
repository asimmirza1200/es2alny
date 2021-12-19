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
var { LookupDetails, LookupLangDetails, ProviderDetails } = require('../models/entity');
//var { Employee } = require('../models/-employee');
var ResponseDTO = require('../../../DTO/Consumer/ResponseDTO');   
var contains = require("string-contains");
var dateFormat = require('dateformat');
// => localhost:3000/account/

  
// For Language List with filter, search, sorting, paging

 

//For Language List
router.post('/LanguageList', (req, res) => {
    
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
                    "ld": "$$ROOT"
                }
            },  
            {
                $lookup:
                {
                    from: "lookuplangdetails",  
                    let: { lookupDetailsId: "$ld._id" }, //languageId : req.headers.languageid, order_qty: "$ordered" 
                    pipeline: [
                        { 
                            $match:
                            { 
                                $expr:
                                { 
                                    $and:
                                    [ 
                                        { $eq: [ "$lookupDetails_Id",  "$$lookupDetailsId" ] },
                                        { $eq: [ "$isActive", true ] },
                                        { $eq: [ "$isDeleted", false ]  }, 
                                        { $eq: [ "$language_Id", ObjectId(req.headers.languageid) ] }
                                    ]
                                }
                            }
                        }, 
                        { 
                            $project: 
                            { 
                                lookupValue : "$lookupValue",
                                _id : 0 
                            } 
                        }
                    ],   

                    as: "lookuplangdetails"

                }  
            },  
            {
                $unwind:"$lookuplangdetails"
            },      
             {
                $match: { 
                    "ld.isActive": true,
                    "ld.isDeleted": false, 
                    "ld.lookupCode": constant.LookupCode.SpeaksAndUnderstandsLanguage,  
               }
            }, 
            {
               // $sort: [['um._id','asc']] //, ['field2','desc']
                $sort : { "lookuplangdetails.lookupValue" : 1 }
            },  
            {
                $project: {
                    lookupDetailsId: "$ld._id", 
                    lookupValue : "$lookuplangdetails.lookupValue",
                    createdDateTime: "$ld.createdDateTime", 
                    _id: 0
                }
            }
        ];

 
        // For User List
        LookupDetails.aggregate(pipeline, async (err,  lookupDetails) =>
        {    
            if(!err)
            { 
                //.slice((Page no - 1) * PageSize, ((Page no - 1) * PageSize) + PageSize);  1 -> 0 to 9,  2-> 10 to 19,  3 -> 20 to 29, ....
                var StartRow = (req.body.pageNo - 1) * req.body.pageSize;
                var EndRow = StartRow + req.body.pageSize ;
       
                console.log(lookupDetails);
 
                let promise = await new Promise(function(resolve, reject) {

                    var data =  new LINQ(lookupDetails)                
                    .Where(function(item) 
                    { 
                        var RowValue = " ";
                        RowValue += item.lookupValue == null ? " " : item.lookupValue + " "; 
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
                                    case "lookupValue": 
                                        return data.lookupValue.trim().toLowerCase(); 
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
                                    case "lookupValue": 
                                        return data.lookupValue.trim().toLowerCase(); 
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

  
//For Add Edit in Language 
router.post('/AddUpdateLanguage', (req, res) => {



    if(req.body.lookupDetailsId == undefined || req.body.lookupLangDetail == undefined || req.body.lookupLangDetail.length < 2)
    {
        res.send(ResponseDTO.InvalidParameter()); 
    }
    else
    {
        if(req.body.lookupDetailsId.trim() == "")
        {
            //Add Category 
            var lookupDetails = new LookupDetails({  
                lookupCode : constant.LookupCode.SpeaksAndUnderstandsLanguage,  
                isActive : true,
                isDeleted : false, 
                createdBy : ObjectId(req.headers.userid),
                createdDateTime : new Date(),
                updatedBy : null,
                updatedDateTime : null  
            });

            lookupDetails.save((err, lookupDetailDoc) => { 
                    if (!err) 
                    {  

                        var lookuplangdetails = [];

                        req.body.lookupLangDetail.forEach(function(item){

                            var lookupLangDetail = new LookupLangDetails({ 
                                language_Id :  item.language_id, 
                                lookupDetails_Id : ObjectId(lookupDetailDoc._id),
                                lookupValue : item.languageName,  
                                isActive : true,
                                isDeleted : false, 
                                createdBy : ObjectId(req.headers.userid),
                                createdDateTime : new Date(),
                                updatedBy : null,
                                updatedDateTime : null   
                            });

                            lookuplangdetails.push(lookupLangDetail);

                        });
 
                        LookupLangDetails.insertMany(lookuplangdetails, (err, lookuplangdetailsDocs) => {
                            if (!err) {  

                                console.log(lookuplangdetailsDocs.length);
                                res.send(ResponseDTO.DataRetrievedSuccessfully(constant.ErrorCode.CreateSuccessfully, constant.ErrorMsg.CreateSuccessfully, {} ) );
                                                                    
                            }
                            else {  
                                //console.log("7");
                                //throw err;
                                res.send(ResponseDTO.TechnicalError()); 
                            }
                        });                                                               
                            
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
            //Edit Category Details
            LookupDetails.count({ _id : ObjectId(req.body.lookupDetailsId), isActive : true, isDeleted : false }, async (err, IsExistLanguage) => {
                console.log(IsExistLanguage);
 
                if(!err)
                {
                    if(IsExistLanguage > 0)
                    {
                        //Code for Edit Category Details 
                        var NoOfUpdateRecords = 0;
                        console.log("==> 1 <==   " + NoOfUpdateRecords);
                        
                        
                        await req.body.lookupLangDetail.forEach( async function(item){


                            LookupLangDetails.update(
                                { language_Id: ObjectId(item.language_id), lookupDetails_Id : ObjectId(req.body.lookupDetailsId), isActive : true, isDeleted : false }, 
                                { $set: { lookupValue : item.languageName, updatedBy: ObjectId(req.headers.userId), updatedDateTime : new Date() } }, function(err, lookupLangDetailsDoc) {
                            
                                    console.log(lookupLangDetailsDoc);
                                    // console.log(categoryLangDetailsDoc.n)
                                if (!err)  
                                {
                                    if(lookupLangDetailsDoc.n > 0)
                                    { 
                                        NoOfUpdateRecords = NoOfUpdateRecords + 1;
                                        console.log("==> 2 <==   " + NoOfUpdateRecords);

                                        if(NoOfUpdateRecords == 2)
                                        { 
                                            console.log("Language Updated successfully."); 
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
                                        res.send(ResponseDTO.ErrorMassage(constant.ErrorCode.NotUpdated, constant.ErrorMsg.NotUpdated, {} ));  
                                        return; 
                                    } 

                                }
                                else 
                                { 
                                    // throw err
                                    res.send(ResponseDTO.TechnicalError());
                                }
                            }); 

                        }) ;

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

  
//For View Language Details
router.post('/ViewLanguage', (req, res) => {
     
    //console.log(req.body);
  
      if(req.body.lookupDetailsId == undefined || req.body.lookupDetailsId.trim() == "")
      {
          res.send(ResponseDTO.InvalidParameter()); 
      }
      else
      {   

        var pipeline = [ 
            {
                $project: {
                    "_id": 0,
                    "ld": "$$ROOT"
                }
            },  
            {
                $lookup:
                {
                    from: "lookuplangdetails",  
                    let: { lookupDetailsId: "$ld._id" }, //languageId : req.headers.languageid, order_qty: "$ordered" 
                    pipeline: [
                        { 
                            $match:
                            { 
                                $expr:
                                { 
                                    $and:
                                    [ 
                                        { $eq: [ "$lookupDetails_Id",  "$$lookupDetailsId" ] },
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
                                languageId : "$language_Id",
                                lookupValue : "$lookupValue",

                                _id : 0 
                            } 
                        }
                    ],   

                    as: "lookuplangdetails"

                }  
            },  
            // {
            //     $unwind:"$lookuplangdetails"
            // },      
             {
                $match: { 
                    "ld.isActive": true,
                    "ld.isDeleted": false, 
                    "ld.lookupCode": constant.LookupCode.SpeaksAndUnderstandsLanguage,  
                    "ld._id" : ObjectId(req.body.lookupDetailsId),
               }
            }, 
            {
               // $sort: [['um._id','asc']] //, ['field2','desc']
                $sort : { "lookuplangdetails.lookupValue" : 1 }
            },  
            {
                $project: {
                    lookupdetailsId: "$ld._id", 
                    languageName : "$lookuplangdetails",
                    createdDateTime: "$ld.createdDateTime", 
                    _id: 0
                }
            }
        ];

     
  
        // For User List
        LookupDetails.aggregate(pipeline, async (err,  lookupDetails) =>
        {    
            console.log(lookupDetails);
            if(!err)
            {   
                res.send(ResponseDTO.GetProviderList(constant.ErrorCode.DataRetrievedSuccessfully, constant.ErrorMsg.DataRetrievedSuccessfully, lookupDetails[0] ));
            }
            else
            {
                //throw err;
                res.send(ResponseDTO.TechnicalError());  
            }
        }); 
  
      }
   
  });
  
 
  
// For Delete Language Details 
router.post('/DeleteLanguage', (req, res) => {

    if(req.body.lookupDetailsId == undefined || req.body.lookupDetailsId.trim() == "")
    {
        res.send(ResponseDTO.InvalidParameter()); 
    }
    else
    {  
     

        // Delete Category and Sub Category Details
        LookupDetails.find({ _id: req.body.lookupDetailsId }, (err, lookupDetails)  => 
        {  
            if(!err)
            {
                if(lookupDetails.length)
                {

                    //check this Language use or not if use then you can not delete it other wise delete Language
                    ProviderDetails.find({ language : ObjectId(req.body.lookupDetailsId), isActive : true, isDeleted : false }, function(err, result) {
                        if (!err)  
                        {
                            
                            console.log("language : " + req.body.lookupDetailsId)
                            console.log("Length : " + result.length)
                            console.log("Result : " + result)
                            
                            if(result.length > 0)
                            {
                                res.send(ResponseDTO.ErrorMassage(constant.ErrorCode.NotDeleteUseLanguage, constant.ErrorMsg.NotDeleteUseLanguage, {} ));     
                            }
                            else
                            {
                                //Delete User Master Details
                                LookupDetails.updateOne({ _id: req.body.lookupDetailsId }, { $set: { isDeleted : true } }, function(err, lookupDetailsDoc) {
                                    if (!err) 
                                    {
                                        console.log("Delete Lookup Details"); 
                                        // Delete Category Details 
                                        LookupLangDetails.updateMany({ lookupDetails_Id: req.body.lookupDetailsId, isActive : true, isDeleted : false }, { $set: { isDeleted : true } }, function(err, lookupLangDetails) {
                                            if (!err)
                                            { 
                                                console.log("Delete lookup Lang Details"); 
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