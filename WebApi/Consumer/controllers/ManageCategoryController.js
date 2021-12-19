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
var { LoginMaster, OTPDetail, LoginToken, DeviceTokenMasters, UserMaster, UserDetails, ProviderDetails, ProviderLangDetails, LookupLangDetails, UserPurchases, UserConsumptions, CategoryMasters, CategoryLangDetails } = require('../models/entity');
//var { Employee } = require('../models/-employee');
var ResponseDTO = require('../../../DTO/Consumer/ResponseDTO');   
var contains = require("string-contains");
var dateFormat = require('dateformat');
// => localhost:3000/account/

  
// For Category List with filter, search, sorting, paging
 

//For Category List
router.post('/CategoryList', (req, res) => {
    
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

        var pipeline = [ 
            {
                $project: {
                    "_id": 0,
                    "cm": "$$ROOT"
                }
            },  
            {
                $lookup:
                {
                    from: "categorylangdetails",  
                    let: { categoryId: "$cm._id" }, //languageId : req.headers.languageid, order_qty: "$ordered" 
                    pipeline: [
                        { 
                            $match:
                            { 
                                $expr:
                                { 
                                    $and:
                                    [ 
                                        { $eq: [ "$category_id",  "$$categoryId" ] },
                                        { $eq: [ "$isActive", true ] },
                                        { $eq: [ "$isDeleted", false ]  }, 
                                        { $eq: [ "$language_id", ObjectId(req.headers.languageid) ] }
                                    ]
                                }
                            }
                        }, 
                        { 
                            $project: 
                            { 
                                categoryName : "$categoryName",
                                _id : 0 
                            } 
                        }
                    ],   

                    as: "categorylangdetails"

                }  
            },  
            {
                $unwind:"$categorylangdetails"
            },      
             {
                $match: { 
                    "cm.isActive": true,
                    "cm.isDeleted": false, 
                    $or:[
                            { "cm.parent_Id" : { $eq : null } },
                            { "cm.parent_Id" : { $eq : ""}},
                            //{ $eq: [ "cm.parent_Id", "" ] }
                        ]  
               }
            }, 
            {
               // $sort: [['um._id','asc']] //, ['field2','desc']
                $sort : { "categorylangdetails.categoryName" : 1 }
            },  
            {
                $project: {
                    categoryId: "$cm._id",
                    //categoryCode: "$cm.categoryCode", 
                    categoryName : "$categorylangdetails.categoryName",
                    imageURL: //"$cm.imageURL", 
                    {
                        $concat: 
                        [ 
                            appSetting.SystemConfiguration.APIBaseUrl, appSetting.SystemConfiguration.CategoryDisplayImagePath,
                            {
                                $cond: 
                                { 
                                    if: 
                                    { 
                                        $or:[{
                                                $eq: [ "$cm.imageURL", null ] 
                                            },
                                            {
                                                $eq: [ "$cm.imageURL", "" ] 
                                            }] 
                                    }, 
                                    then: appSetting.SystemConfiguration.CategoryDefaultImage, 
                                    else: 
                                    { 
                                        $concat: 
                                        [ "$cm.imageURL" ]
                                    }
                                }               
                            }
                        ]
                    },  
                    createdDateTime: "$cm.createdDateTime", 
                    hasSubCategory : "$cm.hasSubCategory",
                    _id: 0
                }
            }
        ];

 
        // For User List
        CategoryMasters.aggregate(pipeline, async (err,  category) =>
        {    
            if(!err)
            { 
                //.slice((Page no - 1) * PageSize, ((Page no - 1) * PageSize) + PageSize);  1 -> 0 to 9,  2-> 10 to 19,  3 -> 20 to 29, ....
                var StartRow = (req.body.pageNo - 1) * req.body.pageSize;
                var EndRow = StartRow + req.body.pageSize ;
       
                console.log(category);


 
                let promise = await new Promise(function(resolve, reject) {


                    var data =  new LINQ(category)                
                    .Where(function(item) 
                    { 
                        var RowValue = " ";
                        RowValue += item.categoryName == null ? " " : item.categoryName + " ";
                        //RowValue += item.imageURL == null ? " " : item.imageURL + " "; 
                        RowValue += item.hasSubCategory == null ? " " : item.hasSubCategory + " ";  
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
                                    case "categoryName": 
                                        return data.categoryName.trim().toLowerCase();
                                    case "hasSubCategory": 
                                        return data.hasSubCategory;       
                                    case "imageURL": 
                                        return data.imageURL;   
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
                                    case "categoryName": 
                                        return data.categoryName.trim().toLowerCase();
                                    case "hasSubCategory": 
                                        return data.hasSubCategory;                                           
                                    case "imageURL": 
                                        return data.imageURL;   
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


//For Sub Category List
router.post('/SubCategoryList', (req, res) => {
    
    console.log( req.headers.languageid); 
    
  
    if(req.body.categoryId == undefined || req.body.categoryId.trim() == "")
    {
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
                  "cm": "$$ROOT"
              }
          },  
          {
              $lookup:
              {
                  from: "categorylangdetails",  
                  let: { categoryId: "$cm._id" }, //languageId : req.headers.languageid, order_qty: "$ordered" 
                  pipeline: [
                      { 
                          $match:
                          { 
                              $expr:
                              { 
                                  $and:
                                  [ 
                                      { $eq: [ "$category_id",  "$$categoryId" ] },
                                      { $eq: [ "$isActive", true ] },
                                      { $eq: [ "$isDeleted", false ]  }, 
                                      { $eq: [ "$language_id", ObjectId(req.headers.languageid) ] }
                                  ]
                              }
                          }
                      }, 
                      { 
                          $project: 
                          { 
                              categoryName : "$categoryName",
                              _id : 0 
                          } 
                      }
                  ],   

                  as: "categorylangdetails"

              }  
          },  
          {
              $unwind:"$categorylangdetails"
          },      
           {
              $match: { 
                  "cm.isActive": true,
                  "cm.isDeleted": false, 
                  "cm.parent_Id" : ObjectId(req.body.categoryId), 
             }
          }, 
          {
             // $sort: [['um._id','asc']] //, ['field2','desc']
              $sort : { "categorylangdetails.categoryName" : 1 }
          },  
          {
              $project: {
                  categoryId: "$cm._id",
                  //categoryCode: "$cm.categoryCode", 
                  categoryName : "$categorylangdetails.categoryName",
                  imageURL: //"$cm.imageURL", 
                  {
                      $concat: 
                      [ 
                          appSetting.SystemConfiguration.APIBaseUrl, appSetting.SystemConfiguration.CategoryDisplayImagePath,
                          {
                              $cond: 
                              { 
                                  if: 
                                  { 
                                      $or:[{
                                              $eq: [ "$cm.imageURL", null ] 
                                          },
                                          {
                                              $eq: [ "$cm.imageURL", "" ] 
                                          }] 
                                  }, 
                                  then: appSetting.SystemConfiguration.CategoryDefaultImage, 
                                  else: 
                                  { 
                                      $concat: 
                                      [ "$cm.imageURL" ]
                                  }
                              }               
                          }
                      ]
                  }, 
                   
                  createdDateTime: "$cm.createdDateTime", 
                  _id: 0
              }
          }
      ];


      // For User List
      CategoryMasters.aggregate(pipeline, async (err,  category) =>
      {    
            if(!err)
            { 
                //.slice((Page no - 1) * PageSize, ((Page no - 1) * PageSize) + PageSize);  1 -> 0 to 9,  2-> 10 to 19,  3 -> 20 to 29, ....
                var StartRow = (req.body.pageNo - 1) * req.body.pageSize;
                var EndRow = StartRow + req.body.pageSize ;
        
                console.log(category);

                let promise = await new Promise(function(resolve, reject) {


                    var data =  new LINQ(category)                
                    .Where(function(item) 
                    { 
                        var RowValue = " ";
                        RowValue += item.categoryName == null ? " " : item.categoryName + " ";
                        RowValue += item.imageURL == null ? " " : item.imageURL + " "; 
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
                                    case "categoryName": 
                                        return data.categoryName.trim().toLowerCase();
                                    case "imageURL": 
                                        return data.imageURL;   
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
                                    case "categoryName": 
                                        return data.categoryName.trim().toLowerCase();
                                    case "imageURL": 
                                        return data.imageURL;   
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

 

//For Add Edit in Category and Sub Category
router.post('/AddUpdateCategory', (req, res) => {

 
    if(req.body.categoryId == undefined || req.body.parentCategoryId == undefined || req.body.categorylangdetail == undefined || req.body.categorylangdetail.length < 2)
    {
        res.send(ResponseDTO.InvalidParameter()); 
    }
    else
    {
        if(req.body.categoryId.trim() == "")
        {
            //Add Category
            if(req.body.parentCategoryId.trim() == "")
            {
                //Has SubCategory Flag Manage
                if( req.body.hasSubCategory == undefined  || !(req.body.hasSubCategory == true || req.body.hasSubCategory == false))
                {
                    console.log("Invalid hasSubCategory value");
                    res.send(ResponseDTO.InvalidParameter()); 
                }
                else
                {
                    console.log("-> Code for Add Master Category"); 
                    //Code for Add Master Category 
                    var categoryMaster = new CategoryMasters({ 
                        categoryCode : null,
                        parent_Id : null,
                        rootCategoryId : null,
                        imageURL : null, 
                        isActive : true,
                        isDeleted : false, 
                        createdBy : ObjectId(req.headers.userid),
                        createdDateTime : new Date(),
                        updatedBy : null,
                        updatedDateTime : null,
                        hasSubCategory : req.body.hasSubCategory
                    });

                    categoryMaster.save((err, categoryMasterDoc) => { 
                            if (!err) 
                            { 
                                
                                // console.log(userMasterDoc);

                                //console.log(userMasterDoc._id);


                                var categorylangdetails = [];

                                req.body.categorylangdetail.forEach(function(item){

                                    var categoryLangDetail = new CategoryLangDetails({ 
                                        
                                        language_id : ObjectId(item.language_id),
                                        category_id : ObjectId(categoryMasterDoc._id),
                                        categoryName : item.categoryName, 
                                        categoryDescription : null, 
                                        isActive : true,
                                        isDeleted : false, 
                                        createdBy : ObjectId(req.headers.userid),
                                        createdDateTime : new Date(),
                                        updatedBy : null,
                                        updatedDateTime : null  
                                    });

                                    categorylangdetails.push(categoryLangDetail);

                                });

                                //console.log(categorylangdetails);

                                CategoryLangDetails.insertMany(categorylangdetails, (err, categorylangdetailsDocs) => {
                                    if (!err) {  

                                        console.log(categorylangdetailsDocs.length);
                                        res.send(ResponseDTO.DataRetrievedSuccessfully(constant.ErrorCode.CreateSuccessfully, constant.ErrorMsg.CreateSuccessfully, { categoryId : categoryMasterDoc._id } ) );
                                                                            
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
            }
            else
            {
 
                //Sub Category Add                 
                CategoryMasters.count({ _id : ObjectId(req.body.parentCategoryId), hasSubCategory : true, isActive : true, isDeleted : false }, (err, IsExistParentCategory) => {
                    console.log(IsExistParentCategory);

                    if(!err)
                    {
                        if(IsExistParentCategory > 0)
                        {
                            console.log("Code for Add Sub Category"); 
                            //Code for Add Sub Category 
                            var categoryMaster = new CategoryMasters({ 
                                categoryCode : null,
                                parent_Id : ObjectId(req.body.parentCategoryId),
                                rootCategoryId : ObjectId(req.body.parentCategoryId),
                                imageURL : null, 
                                isActive : true,
                                isDeleted : false, 
                                createdBy : ObjectId(req.headers.userid),
                                createdDateTime : new Date(),
                                updatedBy : null,
                                updatedDateTime : null,
                                hasSubCategory : false
                            });

                            categoryMaster.save((err, categoryMasterDoc) => { 
                                    if (!err) 
                                    { 
                                        
                                        // console.log(userMasterDoc);

                                        //console.log(userMasterDoc._id);


                                        var categorylangdetails = [];

                                        req.body.categorylangdetail.forEach(function(item){

                                            var categoryLangDetail = new CategoryLangDetails({ 
                                                
                                                language_id : ObjectId(item.language_id),
                                                category_id : ObjectId(categoryMasterDoc._id),
                                                categoryName : item.categoryName, 
                                                categoryDescription : null, 
                                                isActive : true,
                                                isDeleted : false, 
                                                createdBy : ObjectId(req.headers.userid),
                                                createdDateTime : new Date(),
                                                updatedBy : null,
                                                updatedDateTime : null   
                                            });

                                            categorylangdetails.push(categoryLangDetail);

                                        });
 
                                        CategoryLangDetails.insertMany(categorylangdetails, (err, categorylangdetailsDocs) => {
                                            if (!err) {  

                                                //console.log(categorylangdetailsDocs.length);
                                                res.send(ResponseDTO.DataRetrievedSuccessfully(constant.ErrorCode.CreateSuccessfully, constant.ErrorMsg.CreateSuccessfully, { categoryId : categoryMasterDoc._id } ) );
                                                                                    
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
                            //Not Found Parent Category 
                            //res.send(ResponseDTO.InvalidParameter()); 
                            console.log("Not Found Parent Category");
                            res.send(ResponseDTO.CommonResponse(constant.ErrorCode.NotAddSubCategory, constant.ErrorMsg.NotAddSubCategory, { } ) );
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
            //Edit Category Details
            CategoryMasters.find({ _id : ObjectId(req.body.categoryId), isActive : true, isDeleted : false }, async (err, categoryMastersDoc) => {
                console.log(categoryMastersDoc);
 
                if(!err)
                {
                    if(categoryMastersDoc.length == 1) //> 0
                    {
                        if(categoryMastersDoc[0].parent_Id == null || categoryMastersDoc[0].parent_Id == '')
                        {
                            //  Code For Edit Master Category
                            console.log("-> Code For Edit Master Category");
                            if( req.body.hasSubCategory == undefined || !(req.body.hasSubCategory == true || req.body.hasSubCategory == false))
                            {
                                console.log("Invalid hasSubCategory value");
                                res.send(ResponseDTO.InvalidParameter()); 
                            }
                            else
                            {
                               
                                if(req.body.hasSubCategory == categoryMastersDoc[0].hasSubCategory) // Not Change hasSubCategory
                                {
                                    console.log("Not Change hasSubCategory");
                                    // Not Change hasSubCategory 
                                    var NoOfUpdateRecords = 0;
                                    console.log("==> 1 <==   " + NoOfUpdateRecords);
                                    
                                    
                                    await req.body.categorylangdetail.forEach( async function(item){
        
        
                                        CategoryLangDetails.update(
                                            { language_id: ObjectId(item.language_id), category_id : ObjectId(req.body.categoryId), isActive : true, isDeleted : false }, 
                                            { $set: { categoryName : item.categoryName, updatedBy: ObjectId(req.headers.userId), updatedDateTime : new Date() } }, function(err, categoryLangDetailsDoc) {
                                        
                                                console.log(categoryLangDetailsDoc);
                                                // console.log(categoryLangDetailsDoc.n)
                                            if (!err)  
                                            {
                                                if(categoryLangDetailsDoc.n > 0)
                                                { 
                                                    NoOfUpdateRecords = NoOfUpdateRecords + 1;
                                                    console.log("==> 2 <==   " + NoOfUpdateRecords);
        
                                                    if(NoOfUpdateRecords == 2)
                                                    { 
                                                        console.log("Category Updated successfully."); 
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
                                else if(req.body.hasSubCategory == true) // First Remove Provider then changes to hasSubCategory
                                {
                                    console.log("First Remove Provider then changes to hasSubCategory");
                                    // First Remove Provider then changes to hasSubCategory
                                    ProviderDetails.count({ categoryId : ObjectId(req.body.categoryId), isActive : true, isDeleted : false}, function(err, ISExistProvider){
                                        if (!err)  
                                        {
                                            if(ISExistProvider > 0)
                                            { 
                                                res.send(ResponseDTO.ErrorMassage(constant.ErrorCode.NotChangeCategoryTypeRemoveProvider, constant.ErrorMsg.NotChangeCategoryTypeRemoveProvider, {} ));  
                                            }
                                            else
                                            {
                                                 
                                                //Update hasSubCategory and category language details
                                                CategoryMasters.update({ _id: ObjectId(req.body.categoryId), isActive : true, isDeleted : false }, { $set: { hasSubCategory : req.body.hasSubCategory, updatedBy: ObjectId(req.headers.userId), updatedDateTime : new Date() } },async function(err, categoryMastersDoc) 
                                                {
                                                    //
                                                    if (!err)  
                                                    {
                                                        if(categoryMastersDoc.n > 0)
                                                        { 
                                                            var NoOfUpdateRecords = 0;
                                                            console.log("==> 1 <==   " + NoOfUpdateRecords);
                                                            
                                                            
                                                            await req.body.categorylangdetail.forEach( async function(item){
                                
                                
                                                                CategoryLangDetails.update(
                                                                    { language_id: ObjectId(item.language_id), category_id : ObjectId(req.body.categoryId), isActive : true, isDeleted : false }, 
                                                                    { $set: { categoryName : item.categoryName, updatedBy: ObjectId(req.headers.userId), updatedDateTime : new Date() } }, function(err, categoryLangDetailsDoc) {
                                                                
                                                                        console.log(categoryLangDetailsDoc);
                                                                        // console.log(categoryLangDetailsDoc.n)
                                                                    if (!err)  
                                                                    {
                                                                        if(categoryLangDetailsDoc.n > 0)
                                                                        { 
                                                                            NoOfUpdateRecords = NoOfUpdateRecords + 1;
                                                                            console.log("==> 2 <==   " + NoOfUpdateRecords);
                                
                                                                            if(NoOfUpdateRecords == 2)
                                                                            { 
                                                                                console.log("Category Updated successfully."); 
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

                                            } 
                
                                        }
                                        else 
                                        { 
                                            // throw err
                                            res.send(ResponseDTO.TechnicalError());
                                        }

                                    });

                                }
                                else if(req.body.hasSubCategory == false) // First Remove SubCategory then changes to hasSubCategory
                                {
                                    console.log("First Remove SubCategory then changes to hasSubCategory");
                                    //First Remove SubCategory then changes to hasSubCategory 
                                    CategoryMasters.count({ parent_Id : ObjectId(req.body.categoryId), isActive : true, isDeleted : false}, function(err, ISExistSubCategory){
                                        if (!err)  
                                        {
                                            if(ISExistSubCategory > 0)
                                            { 
                                                res.send(ResponseDTO.ErrorMassage(constant.ErrorCode.NotChangeCategoryTypeRemoveSubCategory, constant.ErrorMsg.NotChangeCategoryTypeRemoveSubCategory, {} ));  
                                            }
                                            else
                                            {
                                                 
                                                //Update hasSubCategory and category language details
                                                CategoryMasters.update({ _id: ObjectId(req.body.categoryId), isActive : true, isDeleted : false }, { $set: { hasSubCategory : req.body.hasSubCategory, updatedBy: ObjectId(req.headers.userId), updatedDateTime : new Date() } }, async function(err, categoryMastersDoc) 
                                                {
                                                    //
                                                    if (!err)  
                                                    {
                                                        if(categoryMastersDoc.n > 0)
                                                        { 
                                                            var NoOfUpdateRecords = 0;
                                                            console.log("==> 1 <==   " + NoOfUpdateRecords);
                                                            
                                                            
                                                            await req.body.categorylangdetail.forEach( async function(item){
                                
                                
                                                                CategoryLangDetails.update(
                                                                    { language_id: ObjectId(item.language_id), category_id : ObjectId(req.body.categoryId), isActive : true, isDeleted : false }, 
                                                                    { $set: { categoryName : item.categoryName, updatedBy: ObjectId(req.headers.userId), updatedDateTime : new Date() } }, function(err, categoryLangDetailsDoc) {
                                                                
                                                                        console.log(categoryLangDetailsDoc);
                                                                        // console.log(categoryLangDetailsDoc.n)
                                                                    if (!err)  
                                                                    {
                                                                        if(categoryLangDetailsDoc.n > 0)
                                                                        { 
                                                                            NoOfUpdateRecords = NoOfUpdateRecords + 1;
                                                                            console.log("==> 2 <==   " + NoOfUpdateRecords);
                                
                                                                            if(NoOfUpdateRecords == 2)
                                                                            { 
                                                                                console.log("Category Updated successfully."); 
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
                                    res.send(ResponseDTO.TechnicalError());
                                }
                             
                            }

                        }
                        else
                        {   

                            console.log("-> Code For Edit Sub Master Category");
                            //  Code For Edit Sub Master Category  
                            var NoOfUpdateRecords = 0;
                            console.log("==> 1 <==   " + NoOfUpdateRecords);
                            
                            
                            await req.body.categorylangdetail.forEach( async function(item){


                                CategoryLangDetails.update(
                                    { language_id: ObjectId(item.language_id), category_id : ObjectId(req.body.categoryId), isActive : true, isDeleted : false }, 
                                    { $set: { categoryName : item.categoryName, updatedBy: ObjectId(req.headers.userId), updatedDateTime : new Date() } }, function(err, categoryLangDetailsDoc) {
                                
                                        console.log(categoryLangDetailsDoc);
                                        // console.log(categoryLangDetailsDoc.n)
                                    if (!err)  
                                    {
                                        if(categoryLangDetailsDoc.n > 0)
                                        { 
                                            NoOfUpdateRecords = NoOfUpdateRecords + 1;
                                            console.log("==> 2 <==   " + NoOfUpdateRecords);

                                            if(NoOfUpdateRecords == 2)
                                            { 
                                                console.log("Category Updated successfully."); 
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

  
//For View Category Details
router.post('/ViewCategory', (req, res) => {
     
    //console.log(req.body);
  
      if(req.body.categoryId == undefined || req.body.categoryId.trim() == "")
      {
          res.send(ResponseDTO.InvalidParameter()); 
      }
      else
      {   
        var pipeline = [ 
            {
                $project: {
                    "_id": 0,
                    "cm": "$$ROOT"
                }
            },  
            {
                $lookup:
                {
                    from: "categorylangdetails",  
                    let: { categoryId: "$cm._id" }, //languageId : req.headers.languageid, order_qty: "$ordered" 
                    pipeline: [
                        { 
                            $match:
                            { 
                                $expr:
                                { 
                                    $and:
                                    [ 
                                        { $eq: [ "$category_id",  "$$categoryId" ] },
                                        { $eq: [ "$isActive", true ] },
                                        { $eq: [ "$isDeleted", false ]  }, 
                                        //{ $eq: [ "$language_id", ObjectId(req.headers.languageid) ] }
                                    ]
                                }
                            }
                        }, 
                        { 
                            $project: 
                            { 
                                language_id : "$language_id",
                                categoryName : "$categoryName",
                                _id : 0 
                            } 
                        }
                    ],   
  
                    as: "categorylangdetails"
  
                }  
            },  
            // {
            //     $unwind:"$categorylangdetails"
            // },      
             {
                $match: { 
                    "cm._id" : ObjectId(req.body.categoryId),
                    "cm.isActive": true,
                    "cm.isDeleted": false,  
               }
            }, 
            {
                $project: {
                    categoryId: "$cm._id",
                    parentCategoryId : "$cm.parent_Id",
                    hasSubCategory : "$cm.hasSubCategory",
                    //categoryCode: "$cm.categoryCode", 
                    //categoryName : "$categorylangdetails.categoryName",
                    imageURL: //"$cm.imageURL", 
                    {
                        $concat: 
                        [ 
                            appSetting.SystemConfiguration.APIBaseUrl, appSetting.SystemConfiguration.CategoryDisplayImagePath,
                            {
                                $cond: 
                                { 
                                    if: 
                                    { 
                                        $or:[{
                                                $eq: [ "$cm.imageURL", null ] 
                                            },
                                            {
                                                $eq: [ "$cm.imageURL", "" ] 
                                            }] 
                                    }, 
                                    then: appSetting.SystemConfiguration.CategoryDefaultImage, 
                                    else: 
                                    { 
                                        $concat: 
                                        [ "$cm.imageURL" ]
                                    }
                                }               
                            }
                        ]
                    }, 
                    categorylangdetail : "$categorylangdetails",
                    createdDateTime: "$cm.createdDateTime", 
                    _id: 0
                }
            }
        ];
  
  
        // For User List
        CategoryMasters.aggregate(pipeline, async (err,  category) =>
        {    
            console.log(category);
            if(!err)
            {   
                res.send(ResponseDTO.GetProviderList(constant.ErrorCode.DataRetrievedSuccessfully, constant.ErrorMsg.DataRetrievedSuccessfully, category[0] ));
            }
            else
            {
                //throw err;
                res.send(ResponseDTO.TechnicalError());  
            }
        }); 
  
      }
   
  });
  
 
  
// For Delete Category Details 
router.post('/DeleteCategory', (req, res) => {

    if(req.body.categoryId == undefined || req.body.categoryId.trim() == "")
    {
        res.send(ResponseDTO.InvalidParameter()); 
    }
    else
    {  
      
        // Delete Category and Sub Category Details
        CategoryMasters.find({ _id: req.body.categoryId, isDeleted : false }, (err, categoryMasters)  => 
        {  
            if(!err)
            {
                if(categoryMasters.length)
                {
 
                    var UseCategoryQuery = {
                        "$and": 
                        [
                            {
                                "$or" : 
                                [
                                    {
                                        "categoryId" : ObjectId(req.body.categoryId)
                                    },
                                    {
                                        "subCategoryId" : ObjectId(req.body.categoryId)
                                    } 
                                ]
                            }, 
                            {
                                "isActive": true
                            },
                            {
                                "isDeleted": false
                            } 
                        ]
                    };

                    CategoryMasters.count({ parent_Id : ObjectId(req.body.categoryId), isDeleted : false }, (err, NoOfUseAsSubCategory)  => 
                    {   
                        console.log("Check CategoryMasters"); 
                        console.log("NoOfUseAsSubCategory : " + NoOfUseAsSubCategory); 
                        
                        if(!err)
                        {    
                            ProviderDetails.count(UseCategoryQuery, (err, NoOfUseAsProvider)  => 
                            {   
                                console.log("Check ProviderDetails"); 
                                console.log("NoOfUseAsSubCategory : " + NoOfUseAsProvider); 
                                if(!err)
                                {
                                    if(NoOfUseAsProvider > 0 )
                                    { 
                                        console.log("Not Delete Use Category as Provider"); 
                                        res.send(ResponseDTO.ErrorMassage( constant.ErrorCode.NotDeleteUseCategory, constant.ErrorMsg.NotDeleteUseCategory, {} )); 
                                    } 
                                    else if (NoOfUseAsSubCategory > 0)
                                    {
                                        console.log("Not Delete Use Category As Subcategory"); 
                                        res.send(ResponseDTO.ErrorMassage( constant.ErrorCode.NotDeleteUseCategoryWithSubcategory, constant.ErrorMsg.NotDeleteUseCategoryWithSubcategory, {} )); 
                                    }
                                    else
                                    {  
                                        //Delete Category Details
                                        CategoryMasters.updateOne({ _id: req.body.categoryId }, { $set: { isDeleted : true } }, function(err, categoryMaster) {
                                            if (!err) 
                                            {
                                                console.log("Delete Category Master"); 
                                                // Delete Category Details 
                                                CategoryLangDetails.updateMany({ category_id: req.body.categoryId, isActive : true, isDeleted : false }, { $set: { isDeleted : true } }, function(err, categoryLangDetails) {
                                                    if (!err)
                                                    { 
                                                        console.log("Delete Category Lang Details Details"); 
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