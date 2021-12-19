const { PaymentRequestXml } = require("./PaymentRequestXml");

var appSetting = require("../appsetting");
const express = require("express");
//const path = require('path');
var router = express.Router();
var ObjectId = require("mongoose").Types.ObjectId;

var constant = require("../../../CommonUtility/constant");
// constant.SUMMER.BEGINNING
var { Feedback } = require("../models/entity");
var { SupplierMasters, ProviderDetails, UserMaster, PaymentRequestMasters, WithdrawDetails, WithdrawItemDetails } = require("../models/entity");
var ResponseDTO = require("../../../DTO/Consumer/ResponseDTO");

const TokenGenerator = require("uuid-token-generator");
let date = require("date-and-time");
var request = require("request");
var xmldoc = require("xmldoc");
let { AgeFromDateString, AgeFromDate } = require("age-calculator");
const split = require("split-string");
var dateformat = require("dateformat");
date.locale("hi");
var HTTPClient = require("httpclient");
var { mongoose } = require("../db");
var fs = require("fs");
var Helper = require('./Helper.js');
const appsetting = require("../appsetting");
var LINQ = require('node-linq').LINQ;
 
 
if (!fs.existsSync(appSetting.SystemConfiguration.LogPathForProviderPayment)) {
  fs.mkdirSync(appSetting.SystemConfiguration.LogPathForProviderPayment);
}

// create a stdout console logger
const SimpleNodeLogger = require("simple-node-logger"),
  opts = {
    logFilePath: appSetting.SystemConfiguration.LogPathForProviderPayment + appSetting.SystemConfiguration.FileName,
    timestampFormat: "YYYY-MM-DD HH:mm:ss.SSS"
  },
log = SimpleNodeLogger.createSimpleLogger(opts);


//#region Auto Payment to Provider

router.post('/ProviderPaymentList', (req, res) => {
   
  if(req.body.startDate == undefined || req.body.endDate == undefined || req.body.startDate == null || req.body.endDate == null)
  {
        console.log("Missing fields startDate or endDate"); 
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
                    $lookup: {
                        "localField": "appointment_details_Id",
                        "from": "withdrawitemdetails",
                        "foreignField": "appointment_details_Id",
                        "as": "wid"
                    }
                  }, 
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
                                    { $ne: [ "$price",  null ] },
                                    { $ne: [ "$commissionPercentage",  null ] }, 
                                    {  
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

                                    },
                                    { $eq: [ "$wid._id", [] ] },
                                                                            
                                ],
                                                                     
                            }
                        }
                    }, 
                    {
                      $lookup: {
                          "localField": "appointment_details_Id",
                          "from": "appointmentdetails",
                          "foreignField": "_id",
                          "as": "ad"
                      }
                    }, 
                    {
                        $unwind: {
                            "path": "$ad",
                            "preserveNullAndEmptyArrays": true
                        }
                    },
                    // {
                    //   $lookup: {
                    //       "localField": "appointment_details_Id",
                    //       "from": "withdrawitemdetails",
                    //       "foreignField": "appointment_details_Id",
                    //       "as": "wid"
                    //   }
                    // }, 
                    // {
                    //     $unwind: {
                    //         "path": "$wid",
                    //         "preserveNullAndEmptyArrays": true
                    //     }
                    // },                    
                    // {
                    //     $group: 
                    //     {
                    //         _id: "$provider_user_Id",
                    //         //uniqueIds: {$addToSet: "$_id"},
                    //         totalConsumption : { $sum: "$price" },
                    //         totalProvidePrice : 
                    //         { 
                    //             $sum: 
                    //             { 
                    //                 $subtract : 
                    //                 [ 
                    //                     "$price", 
                    //                     {  
                    //                         $ceil:
                    //                         {
                    //                             $divide: 
                    //                             [
                    //                                 { 
                    //                                     $multiply: [ "$price", "$commissionPercentage" ] 
                    //                                 }, 100
                    //                             ]   
                    //                         }
                    //                     }   
                    //                 ]
                    //             }
                    //         }, 
                    //         totalCommission : 
                    //         { 
                    //             $sum: {
                    //                 $ceil:
                    //                 {
                    //                     $divide: [
                    //                         { 
                    //                             $multiply: [ "$price", "$commissionPercentage" ] 
                    //                         }, 100
                    //                     ] 
                    //                 }
                    //             } 
                    //         } 
                    //     }
                    // },
                    { 
                        $project: 
                        {  
                            // totalPrice: "$totalConsumption", 
                            // totalProvidePrice : "$totalProvidePrice",
                            // totalCommission: "$totalCommission",
                            userconsumptions_Id : "$_id",
                            consumer_user_Id : "$consumer_user_Id",
                            provider_user_Id  : "$provider_user_Id",
                            appointment_details_Id : "$appointment_details_Id",
                            //ad_appointment_details_Id : "$ad._id",
                            price : "$price",
                            commissionPercentage  : "$commissionPercentage",  
                            providePrice : 
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
                            }, 
                            commission : 
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
                            question : { $substr: [ "$ad.question", 0, 250 ] },
                            createdDateTime : "$createdDateTime",
                            //adID : { $ifNull: [ "$wid._id", "0" ] },  
                            //ad_createdDateTime : "$ad.createdDateTime",
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
              "um.isActive": true,
              "um.isDeleted": false,
              "pd.isActive": true,
              "pd.isDeleted": false,
              "um.userTypeId": ObjectId(constant.UserType.Provider),
              "um.userStatusId" : constant.UserStatus.ActiveUser  
               // $concat: ["um.firstName", "um.emailAddress", " "] : req.body.searchText
            }
        }, 
        {
           // $sort: [['um._id','asc']] //, ['field2','desc']
            $sort : { "um._id" : -1 }
        },  
        {
            $project: {
                withdrawdetailsId : "",
                userId: "$um._id",
                firstName: { $substr: [ "$um.firstName", 0, 250 ] },
                //lastName: "$um.lastName",
                //middleName: "$um.middleName",
                emailAddress: { $substr: [ "$um.emailAddress", 0, 254 ] },
                mobileNo: { $substr: [ "$um.mobileNo", 0, 11 ] },
                //DOB: "$um.DOB",
                //genderId: "$um.genderId", 
                //userTypeId : "$um.userTypeId",
                //createdDateTime: "$um.createdDateTime",
                userDetailsId: "$ud._id", 
                supplierCode : { $ifNull: [ "$pd.supplierCode", 0 ] },
                totalProviderPrice : "0",
                invoiceItemModel : [],
                userConsumptions : "$userConsumptions",
                // totalPrice : 
                // {
                //     $cond: [ 
                //         {
                //             $eq: ["$userConsumptions", [] ]
                //         }, 0, 
                //         {
                //             $arrayElemAt:[ "$userConsumptions.totalPrice", 0]
                //         }] 
                // }, 
                // totalProvidePrice : 
                // {
                //     $cond: [ 
                //         {
                //             $eq: ["$userConsumptions", [] ]
                //         }, 0, 
                //         {
                //             $arrayElemAt:[ "$userConsumptions.totalProvidePrice", 0]
                //         }] 
                // }, 
                // totalCommission : 
                // {
                //     $cond: [ 
                //         {
                //             $eq: ["$userConsumptions", [] ]
                //         }, 0, 
                //         {
                //             $arrayElemAt:[ "$userConsumptions.totalCommission", 0]
                //         }] 
                // },                                          
                _id: 0
            }
        }
    ];


    // For User List
    UserMaster.aggregate(pipeline, async (err, users) =>
    {    
        if(!err)
        { 
 
            let promise = await new Promise(function(resolve, reject) {

                var data = new LINQ(users)                
                .Where(function(item) 
                {   
                  item.totalProviderPrice = new LINQ(item.userConsumptions).Sum(x => x.providePrice);


                  //if(item.totalProviderPrice > 0) //&& item.supplierCode != 0  
                  //{
                     
                    new LINQ(item.userConsumptions).Where(function(subItem)
                    {
                      var invoiceItem = {
                        ItemName : subItem.question,
                        Quantity : 1,
                        UnitPrice : subItem.price
                      };
                      item.invoiceItemModel.push(invoiceItem);
                    });
 
            
                  return item.totalProviderPrice > 0 && item.supplierCode > 0  

                }).ToArray();
                

                var result = {
                    totalRecords : data.length,  
                    records : data 
                } 

    
                
                resolve(result.records);  

 
            });
  
            PaymentRequest(promise);

            res.send(ResponseDTO.DataRetrievedSuccessfully(constant.ErrorCode.DataRetrievedSuccessfully, constant.ErrorMsg.DataRetrievedSuccessfully, promise ));  

        }
        else
        {
            console.log(err);
            res.send(ResponseDTO.TechnicalError());  
        }
    });  

         
  }  

});


function PaymentRequest(PaymentRequestList)
{
  //let allPaymentRequest = new Promise(async function(resolveAllPaymentRequest, rejectAllPaymentRequest) {

    var tempCount = 0;
     PaymentRequestList.forEach(async function(item){

      let providerDetails = await new Promise(async function(resolve, reject) {
 
          log.info("============================================= Provider User ID : " + item.userId + " =========================================");
          var withdrawDetails = await new WithdrawDetails({  
            user_Id : ObjectId(item.userId), 
            price : item.totalProviderPrice, 
            requestDateTime:  new Date(),
            isWithdraw: false,
            withdrawDateTime: null, 
            isActive : true,
            isDeleted : false, 
            createdBy : ObjectId(item.userId),
            createdDateTime : new Date(),
            updatedBy : null,
            updatedDateTime : null ,
            supplierCode : item.supplierCode,
            paymentId : ""
          });                 
      
          log.info("================================================= Start Withdraw Details =========================================");
          log.info("================================================= Withdraw Details : Start Request Document  =========================================");
          log.info(withdrawDetails);
          log.info("=================================================== Withdraw Details : End Request Document  =========================================");


          await withdrawDetails.save(async (withdrawDetailsErr, withdrawDetailsDoc) => 
          {
              if (!withdrawDetailsErr) 
              { 
                if(!withdrawDetailsDoc.length)
                {
                  // log.info("docPRM : ");
                  // log.info(withdrawDetailsDoc); 
                  // log.info("docPRM : ");
                  item.withdrawdetailsId = await withdrawDetailsDoc._id;
                  //console.log("Create Payment Request"); 
                  
                  log.info("================================================= Withdraw Details : Start Response Document =========================================");
                  log.info(withdrawDetailsDoc);
                  log.info("=================================================== Withdraw Details : End Response Document =========================================");
                  log.info("================================================= End Withdraw Details =========================================");
                  var withdrawItemDetails = [];
                  await item.userConsumptions.forEach(async subItem =>  {
                    var withdrawItemDetail = 
                    {  
                      withdrawdetails_Id : await withdrawDetailsDoc._id, 
                      appointment_details_Id : subItem.appointment_details_Id,
                      provider_user_Id : subItem.provider_user_Id,
                      consumer_user_Id : subItem.consumer_user_Id,
                      totalprice: subItem.price,
                      commissionPercentage: subItem.commissionPercentage,
                      providePrice: subItem.providePrice,
                      commissionPrice: subItem.commission,
                      userconsumptions_Id : subItem.userconsumptions_Id, 

                      isActive : true,
                      isDeleted : false, 
                      createdBy : ObjectId(item.userId),
                      createdDateTime : new Date(),
                      updatedBy : null,
                      updatedDateTime : null
                    }; 
                    withdrawItemDetails.push(withdrawItemDetail);

                  });   
                    

                  log.info("================================================= Start Withdraw Item Details =========================================");
                  log.info("================================================= Withdraw Item Details : Start Request Document =========================================");
                  log.info(withdrawItemDetails);
                  log.info("================================================= Withdraw Item Details : End Request Document =========================================");

                  await WithdrawItemDetails.insertMany(withdrawItemDetails, (withdrawItemDetailsErr, withdrawItemDetailsDoc) => 
                  {
               
                    if (!withdrawItemDetailsErr) 
                    { 
                      if(withdrawItemDetailsDoc.length > 0)
                      {  
                        log.info("================================================= Withdraw Item Details : Start Response Document =========================================");
                        log.info(withdrawItemDetailsDoc); 
                        log.info("================================================= Withdraw Item Details : End Response Document =========================================");                     
                        log.info("================================================= End Withdraw Item Details =========================================");
                  
                        resolve(item); 
                      }
                      else{
                        log.info("<<<<<<<<<<<<<<<<<<<<< withdrawItemDetailsDoc >>>>>>>>>>>>>>>>>> ");
                        log.info(withdrawItemDetailsDoc);
                        log.info("================================================= End Withdraw Item Details =========================================");
                        reject(withdrawItemDetailsDoc);
                        
                      }
                    }
                    else{
                      log.info("<<<<<<<<<<<<<<<<<<<<< withdrawDetailsErr >>>>>>>>>>>>>>>>>> ");
                      log.info(withdrawItemDetailsErr);
                      log.info("================================================= End Withdraw Item Details =========================================");
                      reject(withdrawItemDetailsErr);
                    }

                  }); 
                  
                 
                }
                else
                {
                  log.info("<<<<<<<<<<<<<<<<<<<< withdrawDetailsDoc >>>>>>>>>>>>>>>>>>> ");
                  log.info(withdrawDetailsDoc);
                  log.info("================================================= End Withdraw Details =========================================");
                  reject(withdrawDetailsDoc);
                }
              }
              else 
              { 
                log.info("<<<<<<<<<<<<<<<<<<<< withdrawDetailsErr >>>>>>>>>>>>>>>>>>");
                log.info(withdrawDetailsErr);
                log.info("================================================= End Withdraw Details =========================================");
                reject(withdrawDetailsErr);
                //res.send(ResponseDTO.TechnicalError())
              }
          });        


         
      });

      log.info("\n");
      log.info("================================================= Start Provider =========================================");
      log.info("============================================= Provider User ID : " + providerDetails.userId + " =========================================");
      log.info("Provider Details For Paymenet Request => ");
      log.info(providerDetails);
      log.info("================================================= End Provider =======================================\n \n \n");

      tempCount = tempCount + 1;

      if(tempCount == PaymentRequestList.length)
      {
        log.info("\n\n\n\n\n");
        log.info("=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-==-=-= START CALL FOR PAYMENT PROCESS =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-==-=-=");
        PendingPaymentProcess();
      }
    });
 

     
    //await resolveAllPaymentRequest('<==== OKAY ====>');

  //});

  //console.log(allPaymentRequest);

}

//function PendingPaymentProcess()
router.get("/PendingPaymentProcess", (req, res) => {

    var pipeline = [
      {
          $project: {
              "_id": 0,
              "wd": "$$ROOT"
          }
      },  
      {
        $lookup: {
            "localField": "wd.user_Id",
            "from": "usermasters",
            "foreignField": "_id",
            "as": "um"
        }
      }, 
      {
          $unwind: {
              "path": "$um",
              "preserveNullAndEmptyArrays": true
          }
      }, 
  

      //--For Sub Item   
      {
          $lookup:
          {
              from: "withdrawitemdetails",
              //localField: "_id",
              //foreignField: "provider_user_Id",

              let: { withdrawDetailId: "$wd._id" }, //, order_qty: "$ordered" 
              pipeline: [
                  // {
                  //   $lookup: {
                  //       "localField": "wd._id",
                  //       "from": "withdrawitemdetails",
                  //       "foreignField": "withdrawdetails_Id",
                  //       "as": "wid"
                  //   }
                  // }, 
        
                  { 
                      $match:
                      { 
                          //  lookupDetails_Id : $degree,
                          $expr:
                          { 
                              $and:
                              [ 
                                  { $eq: [ "$withdrawdetails_Id",  "$$withdrawDetailId" ] },
                                  { $eq: [ "$isActive", true ] },
                                  { $eq: [ "$isDeleted", false ] },
                                  //{ $eq: [ "$withdrawdetails_Id",  "$$withdrawDetailId" ] },                       
                              ],
                                                                  
                          }
                      }
                  },  
                  {
                    $lookup: {
                        "localField": "appointment_details_Id",
                        "from": "appointmentdetails",
                        "foreignField": "_id",
                        "as": "ad"
                    }
                  }, 
                  {
                      $unwind: {
                          "path": "$ad",
                          "preserveNullAndEmptyArrays": true
                      }
                  }, 
                  { 
                      $project: 
                      {   
                          //withdrawitemdetails_Id  : "$_id",
                          //withdrawdetails_Id : "$withdrawdetails_Id",
                          //appointment_details_Id  : "$appointment_details_Id",
                          //provider_user_Id  : "$provider_user_Id",
                          ItemName : { $substr: [ "$ad.question", 0, 250 ] },
                          Quantity : "1",
                          UnitPrice : "$providePrice",

                          // consumer_user_Id : "$consumer_user_Id",
                          // totalprice   : "$totalprice",  
                          // commissionPercentage : "$commissionPercentage",
                          // providePrice  : "$providePrice",
                          // commissionPrice : "$commissionPrice",
                          // userconsumptions_Id  : "$userconsumptions_Id",  
                          // ad { $substr: [ "$ad.question", 0, 250 ] },
                          // createdDateTime : "$createdDateTime",
                          // //adID : { $ifNull: [ "$wid._id", "0" ] },  
                          // //ad_createdDateTime : "$ad.createdDateTime",
                          _id : 0 
                      } 
                  }
              ],   

              as: "withdrawitemdetails"

          }  
      },   
      //--Sub Item End

      {
          $match: 
          {
              $expr:
              { 
                  $and:
                  [ 
                      { $eq: [ "$wd.isActive",  true ] },
                      { $eq: [ "$wd.isDeleted",  false ] },
                      { $eq: [ "$wd.isWithdraw",  false ] },
                      { $gte: [ { $ifNull: [ "$wd.supplierCode", 0 ] },  1 ] },
                      { $ne: [ { $ifNull: [ "$wd.price", 0 ] },  0 ] }
                  ]
              }
          }
              
            // "wd.isActive": true,
            // "wd.isDeleted": false,
            // "wd.isWithdraw": false, 

            //"um.isActive": true,
            //"um.isDeleted": false,
            //"wd.userTypeId": ObjectId(constant.UserType.Provider),
            //"wd.userStatusId" : constant.UserStatus.ActiveUser  
            // $concat: ["wd.firstName", "wd.emailAddress", " "] : req.body.searchText
          
          
          
      },  
      {
          $project: {
              withdrawdetailsId : "$wd._id",
              userId: "$um._id",
              firstName: { $substr: [ "$um.firstName", 0, 250 ] }, 
              emailAddress: { $substr: [ "$um.emailAddress", 0, 254 ] },
              mobileNo: { $substr: [ "$um.mobileNo", 0, 11 ] },   
              supplierCode : { $ifNull: [ "$wd.supplierCode", "0" ] },  
              isWithdraw : "$wd.isWithdraw",
              totalProviderPrice : "$wd.price",
              invoiceItemModel : //"$withdrawitemdetails", 
              {
                $cond: [ 
                      {
                          $eq: ["$withdrawitemdetails", [] ]
                      },  
                      [
                        {
                          ItemName : "Payment of past question(s).",
                          Quantity : "1",
                          UnitPrice : "$wd.price"
                        }
                      ], "$withdrawitemdetails"
                    ] 
              },                                       
              _id: 0
          }
      }
  ];


  // For Payment Request
  WithdrawDetails.aggregate(pipeline, async (err, pendingPaymentList) =>
  {    

      if(!err)
      {  
        log.info("\n\n");
        log.info("================================================= START Pending Payment List =========================================");
        log.info(pendingPaymentList);
        log.info("================================================== END Pending Payment List =========================================\n\n");
      

        await pendingPaymentList.forEach(async paymentDetails => {
      
          let pendingPaymentProcess = await new Promise(async function(resolve, reject) {
            log.info("\n");
            log.info("================================================= START Single Payment Details Of WithdrawDetail_ID :- "+ paymentDetails.withdrawdetailsId +" =========================================");
            log.info(paymentDetails);
            log.info("================================================== END Single Payment Details Of WithdrawDetail_ID :- "+ paymentDetails.withdrawdetailsId +" =========================================");
        
            var InitiatePaymentReq = {
              "InvoiceAmount": paymentDetails.totalProviderPrice,
              "CurrencyIso": "KWD"
            }


            log.info("================================================= START : InitiatePayment API Request Details =========================================");
            log.info("URL : " + appSetting.SupplierPayment.PaymentGatewayBaseURL + "/v2/InitiatePayment");
            log.info("Body : " + InitiatePaymentReq); 
            log.info("================================================== END : InitiatePayment API Request Details =========================================");
                    
                request( 
                  {
                    method: 'POST',
                    url: appSetting.SupplierPayment.PaymentGatewayBaseURL + "/v2/InitiatePayment", 
                    headers: {
                      Accept: 'application/json',
                      "Content-Type": "application/json",
                      //Authorization: TokenAPIDetails.token_type + " " + TokenAPIDetails.access_token
                      Authorization: appSetting.SupplierPayment.TokenType + " " + appSetting.SupplierPayment.AccessToken
                    },
                    body: InitiatePaymentReq,
                    json: true
                  },
                  function(InitiatePaymentError, InitiatePaymentResponse, InitiatePaymentResponseBody) 
                  {  

                    if(!InitiatePaymentError)
                    {
      
                      if(InitiatePaymentResponseBody != null && InitiatePaymentResponseBody != undefined &&  InitiatePaymentResponseBody.IsSuccess)
                      {
                        //  Success  
                        console.log();

                                        
                        resolve("Done");

                        res.send(ResponseDTO.ErrorMassage(constant.ErrorCode.SupplierCreatedSuccessfully, InitiatePaymentResponseBody.Message , {} ));  
                      }
                      else
                      {
                        //Fail
                        res.send(ResponseDTO.ErrorMassage(constant.ErrorCode.SupplierCreatedFail, InitiatePaymentResponseBody.Message, InitiatePaymentResponseBody.FieldsErrors ));  

                      }


                    }
                    else
                    {
                      // technical error
                      console.log("\n");
                      console.log("<<<<<<<<<<<<<<<<<<<<<<< ERROR IN InitiatePayment API >>>>>>>>>>>>>>>>>>>>>>>>>");
                      if(InitiatePaymentError != undefined) 
                      {
                        console.log("\n");
                        console.log("Error     : " + InitiatePaymentError); 
                        console.log("Error     : " + JSON.stringify(InitiatePaymentError)); 
                      }
                      if(InitiatePaymentResponse != undefined)
                      {
                        console.log("\n");
                        console.log("Response  : " + JSON.stringify(InitiatePaymentResponse)); 
                      }
                      if(InitiatePaymentResponseBody != undefined)
                      {
                        console.log("\n");
                        console.log("Body      : " + JSON.stringify(InitiatePaymentResponseBody));  
                      } 
                      //res.send(ResponseDTO.TechnicalError());
                      //res.redirect(appSetting.SystemConfiguration.APIBaseUrl + appSetting.Payment.CancelUrl);
      
                    }                  

                  }
                );
                
          }); 

          console.log(pendingPaymentProcess);

        });

        
        res.send(ResponseDTO.DataRetrievedSuccessfully(constant.ErrorCode.DataRetrievedSuccessfully, constant.ErrorMsg.DataRetrievedSuccessfully, pendingPaymentList ));  

      }
      else
      {
          log.info("<<<<<<<<<<<<<<<<<<<<<<< ERROR IN pendingPaymentList >>>>>>>>>>>>>>>>>>>>>>>>>");
          log.info(err);
          log.info("<<<<<<<<<<<<<<<<<<<<<<< ERROR IN pendingPaymentList >>>>>>>>>>>>>>>>>>>>>>>>>");
          //res.send(ResponseDTO.TechnicalError());  
      }
  });  

  
});


//#region Manage Supplier

router.get("/GetBanks", (req, res) => { 
  
  request( 
    {
      method: 'GET',
      url: appSetting.SupplierPayment.PaymentGatewayBaseURL + "/v2/GetBanks", 
      headers: {
        Accept: 'application/json',
        "Content-Type": "application/json",
        //Authorization: TokenAPIDetails.token_type + " " + TokenAPIDetails.access_token
        Authorization: appSetting.SupplierPayment.TokenType + " " + appSetting.SupplierPayment.AccessToken
      }, 
      json: true
    },
    function(MultiVendorError, MultiVendorResponse, MultiVendorResponseBody) 
    {
    
      console.log(MultiVendorResponseBody);

      if(!MultiVendorError)
      { 
        
        console.log("===");
        console.log(MultiVendorResponseBody);   
        res.send(ResponseDTO.ErrorMassage(constant.ErrorCode.BankRetrievedSuccessfully, constant.ErrorMsg.BankRetrievedSuccessfully, MultiVendorResponseBody ));  
        
      }
      else
      {
        // technical error
        console.log("\n");
        console.log("========================== Error In Supplier API ==========================");
        if(MultiVendorError != undefined) 
        {
          console.log("\n");
          console.log("Error     : " + MultiVendorError); 
          console.log("Error     : " + JSON.stringify(MultiVendorError)); 
        }
        if(MultiVendorResponse != undefined)
        {
          console.log("\n");
          console.log("Response  : " + JSON.stringify(MultiVendorResponse)); 
        }
        if(MultiVendorResponseBody != undefined)
        {
          console.log("\n");
          console.log("Body      : " + JSON.stringify(MultiVendorResponseBody));  
        } 
        res.send(ResponseDTO.TechnicalError()); 
      }                  

    }
  ); 

});


router.post("/CreateSupplier", (req, res) => {
  // log.info("========================== API Response ============================")
  // log.info("query : " + JSON.stringify(req.query))
  // log.info("Request Url : " + JSON.stringify(req.originalUrl)) 
  // var PaymentId = req.query.Id;
  // log.info("Parameter : " + PaymentId)
  // log.info("Request Headers : " + JSON.stringify(req.headers))


  req.body.IsDepositHold = false;
  req.body.DepositTerms = "OnDemand";
  req.body.IsActive = true;
 

  if(req.body.UserId == undefined || req.body.UserId.trim() == "" || 
      req.body.SupplierCode  == undefined || req.body.SupplierCode != 0 ||
      req.body.SupplierName  == undefined || req.body.SupplierName.trim() == "" ||
      req.body.Mobile  == undefined || req.body.Mobile.trim() == "" ||
      req.body.Email  == undefined || req.body.Email.trim() == "" ||
      req.body.CommissionValue  == undefined || req.body.CommissionValue < 0 ||
      req.body.CommissionPercentage  == undefined || req.body.CommissionPercentage < 0 ||
      req.body.DepositTerms == undefined ||
      req.body.IsDepositHold  == undefined ||
      req.body.BankId  == undefined || 
      req.body.BankAccountHolderName == undefined ||
      req.body.BankAccount == undefined ||
      req.body.Iban == undefined ||
      req.body.IsActive == undefined 
  )
  {
      res.send(ResponseDTO.InvalidParameter()); 
  }
  else{


  
    var SupplierReq = {
      // _id : ObjectId(),  
      "SupplierCode" : req.body.SupplierCode,
      "SupplierName" : req.body.SupplierName.toString().trim(),
      "Mobile" : req.body.Mobile.toString().trim(),
      "Email" : req.body.Email.toString().trim(),
      "CommissionValue" : req.body.CommissionValue,
      "CommissionPercentage" : req.body.CommissionPercentage,  
      "DepositTerms" : req.body.DepositTerms.toString().trim(),
      "IsDepositHold" : req.body.IsDepositHold,
      "BankId" : req.body.BankId,
      "BankAccountHolderName"  : req.body.BankAccountHolderName.toString().trim(),
      "BankAccount" : req.body.BankAccount.toString().trim(),
      "Iban" : req.body.Iban.toString().trim(),
      "IsActive" : req.body.IsActive, 
    };



 
  // request.post(
  //   {
  //     url: appSetting.Payment.PaymentGatewayBaseURL + "/Token",
  //     body: "grant_type=password&username=" + appSetting.Payment.UserName + "&password=" + appSetting.Payment.Password
  //   },
  //   function(TokenAPIerror, TokenAPIresponse, TokenAPIbody) {
  //     if(!TokenAPIerror)
  //     {

  //       log.info("\n");
  //       log.info("========================== Response Of Token API =========================="); 
  //       log.info("Error     : " + JSON.stringify(TokenAPIerror)); 
  //       log.info("\n");
  //       log.info("Response  : " + JSON.stringify(TokenAPIresponse)); 
  //       log.info("\n");
  //       log.info("Body      : " + TokenAPIbody);  
 
  //       var TokenAPIDetails = JSON.parse(JSON.parse(JSON.stringify(TokenAPIbody))); 

  //       if (!TokenAPIerror && TokenAPIDetails != undefined && TokenAPIDetails.access_token != undefined && TokenAPIDetails.token_type != undefined) 
  //       {
  //         log.info("\n");
  //         log.info("========================== Start Transaction API Call ==========================");
  //         log.info("Request URL   : " + appSetting.Payment.PaymentGatewayBaseURL + "/ApiInvoices/Transaction/" + PaymentId); 
  //         log.info("Header Authorization   : " + TokenAPIDetails.token_type + " " + TokenAPIDetails.access_token); 

       
            console.log(appSetting.SupplierPayment.TokenType + " " + appSetting.SupplierPayment.AccessToken);
            console.log(appSetting.SupplierPayment.PaymentGatewayBaseURL + "/v2/CreateSupplier");

            request( 
              {
                method: 'POST',
                url: appSetting.SupplierPayment.PaymentGatewayBaseURL + "/v2/CreateSupplier", 
                headers: {
                  Accept: 'application/json',
                  "Content-Type": "application/json",
                  //Authorization: TokenAPIDetails.token_type + " " + TokenAPIDetails.access_token
                  Authorization: appSetting.SupplierPayment.TokenType + " " + appSetting.SupplierPayment.AccessToken
                },
                body: SupplierReq,
                json: true
              },
              function(MultiVendorError, MultiVendorResponse, MultiVendorResponseBody) 
              {
            
  
                // if (MultiVendorError) 
                // {
                //   console.log ("Error : " + MultiVendorError)
                //   throw new Error(MultiVendorError);
                // }
                console.log(MultiVendorResponseBody);

                if(!MultiVendorError)
                {
  
                  if(MultiVendorResponseBody != null && MultiVendorResponseBody != undefined &&  MultiVendorResponseBody.IsSuccess)
                  {
                    //  Success  
                    console.log();

                    req.body.SupplierCode = MultiVendorResponseBody.Data.SupplierCode;
                    StoreMultiVendorDetails(req, res);

                    res.send(ResponseDTO.ErrorMassage(constant.ErrorCode.SupplierCreatedSuccessfully, MultiVendorResponseBody.Message , {} ));  
                  }
                  else
                  {
                    //Fail
                    res.send(ResponseDTO.ErrorMassage(constant.ErrorCode.SupplierCreatedFail, MultiVendorResponseBody.Message, MultiVendorResponseBody.FieldsErrors ));  

                  }


                }
                else
                {
                  // technical error
                  console.log("\n");
                  console.log("========================== Error In Supplier API ==========================");
                  if(MultiVendorError != undefined) 
                  {
                    console.log("\n");
                    console.log("Error     : " + MultiVendorError); 
                    console.log("Error     : " + JSON.stringify(MultiVendorError)); 
                  }
                  if(MultiVendorResponse != undefined)
                  {
                    console.log("\n");
                    console.log("Response  : " + JSON.stringify(MultiVendorResponse)); 
                  }
                  if(MultiVendorResponseBody != undefined)
                  {
                    console.log("\n");
                    console.log("Body      : " + JSON.stringify(MultiVendorResponseBody));  
                  } 
                  res.send(ResponseDTO.TechnicalError());
                  //res.redirect(appSetting.SystemConfiguration.APIBaseUrl + appSetting.Payment.CancelUrl);
  
                }                  

              }
            );
//         }
//         else
//         {
//           console.log("\n");
//           console.log("========================== Call Back URL : Error In Token API ==========================");
//           if(TokenAPIerror != undefined) 
//           {
//             console.log("\n");
//             console.log("Error     : " + JSON.stringify(TokenAPIerror)); 
//           }
//           if(TokenAPIresponse != undefined)
//           {
//             console.log("\n");
//             console.log("Response  : " + JSON.stringify(TokenAPIresponse)); 
//           }
//           if(TokenAPIbody != undefined)
//           {
//             console.log("\n");
//             console.log("Body      : " + JSON.stringify(TokenAPIbody));  
//           } 
  
//           res.redirect(appSetting.SystemConfiguration.APIBaseUrl + appSetting.Payment.CancelUrl); 
//         }
//       }
//       else
//       {
//         console.log("\n");
//         console.log("========================== Call Back URL : Error In Token API ==========================");
//         if(TokenAPIerror != undefined) 
//         {
//           console.log("\n");
//           console.log("Error     : " + JSON.stringify(TokenAPIerror)); 
//         }
//         if(TokenAPIresponse != undefined)
//         {
//           console.log("\n");
//           console.log("Response  : " + JSON.stringify(TokenAPIresponse)); 
//         }
//         if(TokenAPIbody != undefined)
//         {
//           console.log("\n");
//           console.log("Body      : " + JSON.stringify(TokenAPIbody));  
//         } 

//         res.redirect(appSetting.SystemConfiguration.APIBaseUrl + appSetting.Payment.CancelUrl); 
//       }
//     });
// });
  }

});


router.post("/GetSupplier", (req, res) => {
  
  if( req.body.SupplierCode == undefined || req.body.SupplierCode <= 0 )
  {
      res.send(ResponseDTO.InvalidParameter()); 
  }
  else
  { 

    request( 
      {
        method: 'GET',
        url: appSetting.SupplierPayment.PaymentGatewayBaseURL + "/v2/GetSuppliers", 
        headers: {
          Accept: 'application/json',
          "Content-Type": "application/json",
          //Authorization: TokenAPIDetails.token_type + " " + TokenAPIDetails.access_token
          Authorization: appSetting.SupplierPayment.TokenType + " " + appSetting.SupplierPayment.AccessToken
        }, 
        json: true
      },
      function(MultiVendorError, MultiVendorResponse, MultiVendorResponseBody) 
      {
    
          
        console.log(MultiVendorResponseBody);

        if(!MultiVendorError)
        {

          var supplerData = new LINQ(MultiVendorResponseBody).Where(function(item) {
            return item.SupplierCode == req.body.SupplierCode
          }).ToArray();
          
          console.log("===");
          console.log(MultiVendorResponseBody);

          if(supplerData.length == 1)
          {
            //  Success  
            res.send(ResponseDTO.ErrorMassage(constant.ErrorCode.SupplierDataRetrievedSuccessfully, constant.ErrorMsg.SupplierDataRetrievedSuccessfully , supplerData[0] ));  
          }
          else
          {
            //  Fail
            res.send(ResponseDTO.ErrorMassage(constant.ErrorCode.SupplierDataNotFound, constant.ErrorMsg.SupplierDataNotFound, {} ));  
          } 
        }
        else
        {
          // technical error
          console.log("\n");
          console.log("========================== Error In Supplier API ==========================");
          if(MultiVendorError != undefined) 
          {
            console.log("\n");
            console.log("Error     : " + MultiVendorError); 
            console.log("Error     : " + JSON.stringify(MultiVendorError)); 
          }
          if(MultiVendorResponse != undefined)
          {
            console.log("\n");
            console.log("Response  : " + JSON.stringify(MultiVendorResponse)); 
          }
          if(MultiVendorResponseBody != undefined)
          {
            console.log("\n");
            console.log("Body      : " + JSON.stringify(MultiVendorResponseBody));  
          } 
          res.send(ResponseDTO.TechnicalError());
          //res.redirect(appSetting.SystemConfiguration.APIBaseUrl + appSetting.Payment.CancelUrl);

        }                  

      }
    ); 
  }

});


router.post("/EditSupplier", (req, res) => {
  // log.info("========================== API Response ============================")
  // log.info("query : " + JSON.stringify(req.query))
  // log.info("Request Url : " + JSON.stringify(req.originalUrl)) 
  // var PaymentId = req.query.Id;
  // log.info("Parameter : " + PaymentId)
  // log.info("Request Headers : " + JSON.stringify(req.headers))


  req.body.IsDepositHold = false;
  req.body.DepositTerms = "OnDemand";
  req.body.IsActive = true;
  

  if(req.body.UserId == undefined || req.body.UserId.trim() == "" || 
      req.body.SupplierCode  == undefined || req.body.SupplierCode <= 0 ||
      req.body.SupplierName  == undefined || req.body.SupplierName.trim() == "" ||
      req.body.Mobile  == undefined || req.body.Mobile.trim() == "" ||
      req.body.Email  == undefined || req.body.Email.trim() == "" ||
      req.body.CommissionValue  == undefined || req.body.CommissionValue < 0 ||
      req.body.CommissionPercentage  == undefined || req.body.CommissionPercentage < 0 ||
      req.body.DepositTerms == undefined ||
      req.body.IsDepositHold  == undefined ||
      req.body.BankId  == undefined || 
      req.body.BankAccountHolderName == undefined ||
      req.body.BankAccount == undefined ||
      req.body.Iban == undefined ||
      req.body.IsActive == undefined 
  )
  {
      res.send(ResponseDTO.InvalidParameter()); 
  }
  else{


  
    var SupplierReq = {
      // _id : ObjectId(),  
      "SupplierCode" : req.body.SupplierCode,
      "SupplierName" : req.body.SupplierName.toString().trim(),
      "Mobile" : req.body.Mobile.toString().trim(),
      "Email" : req.body.Email.toString().trim(),
      "CommissionValue" : req.body.CommissionValue,
      "CommissionPercentage" : req.body.CommissionPercentage,  
      "DepositTerms" : req.body.DepositTerms.toString().trim(),
      "IsDepositHold" : req.body.IsDepositHold,
      "BankId" : req.body.BankId,
      "BankAccountHolderName"  : req.body.BankAccountHolderName.toString().trim(),
      "BankAccount" : req.body.BankAccount.toString().trim(),
      "Iban" : req.body.Iban.toString().trim(),
      "IsActive" : req.body.IsActive, 
    };



  
  // request.post(
  //   {
  //     url: appSetting.Payment.PaymentGatewayBaseURL + "/Token",
  //     body: "grant_type=password&username=" + appSetting.Payment.UserName + "&password=" + appSetting.Payment.Password
  //   },
  //   function(TokenAPIerror, TokenAPIresponse, TokenAPIbody) {
  //     if(!TokenAPIerror)
  //     {

  //       log.info("\n");
  //       log.info("========================== Response Of Token API =========================="); 
  //       log.info("Error     : " + JSON.stringify(TokenAPIerror)); 
  //       log.info("\n");
  //       log.info("Response  : " + JSON.stringify(TokenAPIresponse)); 
  //       log.info("\n");
  //       log.info("Body      : " + TokenAPIbody);  
  
  //       var TokenAPIDetails = JSON.parse(JSON.parse(JSON.stringify(TokenAPIbody))); 

  //       if (!TokenAPIerror && TokenAPIDetails != undefined && TokenAPIDetails.access_token != undefined && TokenAPIDetails.token_type != undefined) 
  //       {
  //         log.info("\n");
  //         log.info("========================== Start Transaction API Call ==========================");
  //         log.info("Request URL   : " + appSetting.Payment.PaymentGatewayBaseURL + "/ApiInvoices/Transaction/" + PaymentId); 
  //         log.info("Header Authorization   : " + TokenAPIDetails.token_type + " " + TokenAPIDetails.access_token); 

        
            console.log(appSetting.SupplierPayment.TokenType + " " + appSetting.SupplierPayment.AccessToken);
            console.log(appSetting.SupplierPayment.PaymentGatewayBaseURL + "/v2/EditSupplier");

            request( 
              {
                method: 'POST',
                url: appSetting.SupplierPayment.PaymentGatewayBaseURL + "/v2/EditSupplier", 
                headers: {
                  Accept: 'application/json',
                  "Content-Type": "application/json",
                  //Authorization: TokenAPIDetails.token_type + " " + TokenAPIDetails.access_token
                  Authorization: appSetting.SupplierPayment.TokenType + " " + appSetting.SupplierPayment.AccessToken
                },
                body: SupplierReq,
                json: true
              },
              function(MultiVendorError, MultiVendorResponse, MultiVendorResponseBody) 
              {
            
  
                // if (MultiVendorError) 
                // {
                //   console.log ("Error : " + MultiVendorError)
                //   throw new Error(MultiVendorError);
                // }
                console.log(MultiVendorResponseBody);

                if(!MultiVendorError)
                {
  
                  if(MultiVendorResponseBody != null && MultiVendorResponseBody != undefined &&  MultiVendorResponseBody.IsSuccess)
                  {
                    //  Success  
                    
                    req.body.SupplierCode = MultiVendorResponseBody.Data.SupplierCode;
                    StoreMultiVendorDetails(req, res);

                    res.send(ResponseDTO.ErrorMassage(constant.ErrorCode.SupplierUpdatedSuccessfully, MultiVendorResponseBody.Message , {} ));  
                  }
                  else
                  {
                    //Fail
                    res.send(ResponseDTO.ErrorMassage(constant.ErrorCode.SupplierUpdatedFail, MultiVendorResponseBody.Message, MultiVendorResponseBody.FieldsErrors ));  

                  }


                }
                else
                {
                  // technical error
                  console.log("\n");
                  console.log("========================== Error In Supplier API ==========================");
                  if(MultiVendorError != undefined) 
                  {
                    console.log("\n");
                    console.log("Error     : " + MultiVendorError); 
                    console.log("Error     : " + JSON.stringify(MultiVendorError)); 
                  }
                  if(MultiVendorResponse != undefined)
                  {
                    console.log("\n");
                    console.log("Response  : " + JSON.stringify(MultiVendorResponse)); 
                  }
                  if(MultiVendorResponseBody != undefined)
                  {
                    console.log("\n");
                    console.log("Body      : " + JSON.stringify(MultiVendorResponseBody));  
                  } 
                  res.send(ResponseDTO.TechnicalError());
                  //res.redirect(appSetting.SystemConfiguration.APIBaseUrl + appSetting.Payment.CancelUrl);
  
                }                  

              }
            );
//         }
//         else
//         {
//           console.log("\n");
//           console.log("========================== Call Back URL : Error In Token API ==========================");
//           if(TokenAPIerror != undefined) 
//           {
//             console.log("\n");
//             console.log("Error     : " + JSON.stringify(TokenAPIerror)); 
//           }
//           if(TokenAPIresponse != undefined)
//           {
//             console.log("\n");
//             console.log("Response  : " + JSON.stringify(TokenAPIresponse)); 
//           }
//           if(TokenAPIbody != undefined)
//           {
//             console.log("\n");
//             console.log("Body      : " + JSON.stringify(TokenAPIbody));  
//           } 
  
//           res.redirect(appSetting.SystemConfiguration.APIBaseUrl + appSetting.Payment.CancelUrl); 
//         }
//       }
//       else
//       {
//         console.log("\n");
//         console.log("========================== Call Back URL : Error In Token API ==========================");
//         if(TokenAPIerror != undefined) 
//         {
//           console.log("\n");
//           console.log("Error     : " + JSON.stringify(TokenAPIerror)); 
//         }
//         if(TokenAPIresponse != undefined)
//         {
//           console.log("\n");
//           console.log("Response  : " + JSON.stringify(TokenAPIresponse)); 
//         }
//         if(TokenAPIbody != undefined)
//         {
//           console.log("\n");
//           console.log("Body      : " + JSON.stringify(TokenAPIbody));  
//         } 

//         res.redirect(appSetting.SystemConfiguration.APIBaseUrl + appSetting.Payment.CancelUrl); 
//       }
//     });
// });
  }

});


//For Store Multi Vendor Details
function StoreMultiVendorDetails(req, res) {

  console.log("Final Store");
  console.log(req.body);
  //console.log("userId : "+ userId +"  appId : "+ appId +" deviceId : "+ deviceId +"   deviceToken : "+ deviceToken);
  SupplierMasters.find({user_Id : ObjectId(req.body.UserId)},(err, supplierMasters) => 
  {  
      if(!err)
      {
          //Update Suplier Code in Provider Details
          ProviderDetails.updateOne({user_Id : ObjectId(req.body.UserId), isActive: true, isDeleted : false }, { $set: {  supplierCode : req.body.SupplierCode } }, function(errPD, resPD) 
          {
              if (errPD)  
              {
                  console.log(errPD); //throw err;
              }
              else
              {
                  console.log("Update Supplier Code in ProviderDetails");  
              }
          }); 

          //Add Update Supplier
          if(supplierMasters.length)
          {
              //Update Supplier
              SupplierMasters.updateOne({user_Id : ObjectId(req.body.UserId) }, 
              { $set: 
                { 
                    
                  supplierCode : req.body.SupplierCode,
                  supplierName : req.body.SupplierName,
                  mobile : req.body.Mobile,
                  email : req.body.Email,
                  commissionValue : req.body.CommissionValue,
                  commissionPercentage : req.body.CommissionPercentage,  
                  depositTerms : req.body.DepositTerms,
                  isDepositHold : req.body.IsDepositHold,
                  bankId : req.body.BankId,
                  bankAccountHolderName  : req.body.BankAccountHolderName,
                  bankAccount : req.body.BankAccount,
                  iban : req.body.Iban,
                  isActive : req.body.IsActive,
                  isDeleted : false,
                  updatedBy :  ObjectId(req.body.userId),
                  updatedDateTime : new Date() 

                } }, function(errSM, resSM) {
                  if (errSM)  
                  {
                      console.log(errSM); //throw err;
                  }
                  else
                  {
                      console.log("Update Suplier"); 
                  }
              }); 
          }
          else
          {
              //Insert Supplier
              var supplierReqData = new SupplierMasters({
                // _id : ObjectId(),
                user_Id : ObjectId(req.body.UserId),  
                supplierCode : req.body.SupplierCode,
                supplierName : req.body.SupplierName,
                mobile : req.body.Mobile,
                email : req.body.Email,
                commissionValue : req.body.CommissionValue,
                commissionPercentage : req.body.CommissionPercentage,  
                depositTerms : req.body.DepositTerms,
                isDepositHold : req.body.IsDepositHold,
                bankId : req.body.BankId,
                bankAccountHolderName  : req.body.BankAccountHolderName,
                bankAccount : req.body.BankAccount,
                iban : req.body.Iban,
                isActive : req.body.IsActive,
                isDeleted : false,
                createdBy : ObjectId(req.body.userId),
                createdDateTime : new Date(),
                updatedBy :  null,
                updatedDateTime : null
              });                

              supplierReqData.save((errSM, docSM) => {
                  if (!errSM) { 
                      console.log("Create Suplier");  
                  }
                  else { 
                      console.log(errSM);
                      //res.send(ResponseDTO.TechnicalError())
                    }
              });      
          }
      }

  });  

}

//#endregion Manage Supplier



            
  

module.exports = router;
