const { PaymentRequestXml } = require("./PaymentRequestXml");

var appSetting = require("../appsetting");
const express = require("express");
//const path = require('path');
var router = express.Router();
var ObjectId = require("mongoose").Types.ObjectId;

var constant = require("../../../CommonUtility/constant");
// constant.SUMMER.BEGINNING
var { Feedback } = require("../models/entity");
var { UserMaster, CreditPlans, PaymentDetails, UserPurchases, DeviceTokenMasters, TemplateLangDetails, KNETPaymentRequest } = require("../models/entity");
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
const replaceString = require('replace-string');
var dateFormat = require('dateformat'); 
//var cron = require('node-cron');
var LINQ = require('node-linq').LINQ;
// var express = require('express')
// var app = express()


if (!fs.existsSync(appSetting.SystemConfiguration.LogPath)) {
  fs.mkdirSync(appSetting.SystemConfiguration.LogPath);
}

// create a stdout console logger
const SimpleNodeLogger = require("simple-node-logger"),
  opts = {
    logFilePath: appSetting.SystemConfiguration.LogPath + appSetting.SystemConfiguration.FileName,
    timestampFormat: "YYYY-MM-DD HH:mm:ss.SSS"
  },
  log = SimpleNodeLogger.createSimpleLogger(opts);

 

// Payment Cancel URL
router.get("/cancel", function(req, res) {
  res.sendFile(appSetting.SystemConfiguration.ViewPath + "payment/cancel.html");
});

// Payment Success URL
router.get("/success", function(req, res) {
  res.sendFile(appSetting.SystemConfiguration.ViewPath + "payment/success.html");
});

//https://www.npmjs.com/package/node-cron
//Every minute call (* * * * * * => every second) ('*/2 * * * *' => running a task every two minutes)
// cron.schedule('*/10 * * * * *', () => {
//   console.log('running a task every minute');
//   console.log(new Date());

//   const now = new Date();
//   const currentDate = date.addMinutes(now, 5);
//   console.log(currentDate);
   

//       var pipeline =  
//       [   
//           // {
//           //   $project: {
//           //       "_id": 0,
//           //       "pr": "$$ROOT"
//           //   }
//           // },         
//           // {
//           //   $lookup: {
//           //       "localField": "tranTrackid",
//           //       "from": "paymentdetails",
//           //       "foreignField": "trackingId",
//           //       "as": "pd"
//           //   }, 
            
//           // }, 
//           {
//             $lookup:
//             {
//                 from: "paymentdetails", 
//                 let: { tranTrackid: "$tranTrackid" }, //, order_qty: "$ordered" 
//                 pipeline: [
//                     { 
//                         $match:
//                         { 
//                             //  lookupDetails_Id : $degree,
//                             $expr:
//                             { 
//                                 $and:
//                                 [ 
//                                     { $eq: [ "$trackingId",  "$$tranTrackid" ] },
//                                     { $eq: [ "$isActive", true ] },
//                                     { $eq: [ "$isDeleted", false ]  } 
//                                 ]
//                             }
//                         }
//                     },  
//                     { 
//                         $project: 
//                         { 
//                           statusCode : "$statusCode",
//                             //NoOfQue: "$noOfQue", 
//                             //totalConsumption: "$totalConsumption", 
//                             //avg : "$avg", 
//                             // count1 : "$count1",
//                             _id : 0 
//                         } 
//                     }
//                 ],   

//                 as: "pd"

//             }  
//         },            
//           // { 
//           //     $unwind: {
//           //         "path": "$pd",
//           //         "preserveNullAndEmptyArrays": true
//           //     }
//           // }, 
//           {
//             $match :
//             {
//               $expr:
//               { 
//                   $and:
//                   [ 
//                       { $eq: [ "$statusId",  0 ] },
//                       { $eq: [ "$isActive", true ] },
//                       { $eq: [ "$isDeleted", false ]  },   
//                       { $and : { $lte: [ "$createdDateTime", date.addMinutes(new Date(), -30) ] } }                                     
//                   ],
                                                      
//               }
               
//             }
//           },           
//           {
//               $project:
//               {   
//                   _id: 0,
//                   knetpaymentrequestId: "$_id",  
//                   userId : "userId",
//                   errorUrl  : "$errorUrl", 
//                   price  : "$price", 
//                   qty  : "$qty", 
//                   languageCode   : "$languageCode", 
//                   tranTrackid  : "$tranTrackid", 
//                   currencyCode   : "$currencyCode", 
//                  // statusId   : "$statusId", 
//                   isActive  : "$isActive", 
//                   isDeleted : "$isDeleted",
//                   createdBy : "$createdBy",
//                   createdDateTime : "$createdDateTime",
//                   pd_statusId : //"$pd" 
//                   {
//                     $cond: [ 
//                         {
//                             $eq: ["$pd", [] ]
//                         }, -1, 
//                         {
//                             $arrayElemAt:[ "$pd.statusCode", 0]
//                         }] 
//                   }, 
        
//               }
//           },  
//           {
//               $sort : { createdDateTime : -1 }
//           }  
//       ];


//       // For knet payment requests
//       KNETPaymentRequest.aggregate(pipeline, async (KNETPaymentRequestErr,  KNETPaymentReqDoc) =>
//       {    
//           if(!KNETPaymentRequestErr)
//           {  
//             console.log(KNETPaymentReqDoc.length);

//             if(KNETPaymentReqDoc.length > 0)
//             {
 
//               let promise = await new Promise(function(resolve, reject) {

//                   var processedData =  new LINQ(KNETPaymentReqDoc)                
//                   .Where(function(x) 
//                   {   
//                     return x.pd_statusId != -1 ;
//                   })
//                   .ToArray();


//                   processedData.forEach(element => {
                    
//                       //Update Status 0 To 2 in KNETPaymentRequest Table
//                       KNETPaymentRequest.update(
//                             { _id : ObjectId(element.knetpaymentrequestId), isActive : true, isDeleted : false }, 
//                             { $set: { statusId  : 2, updatedBy: ObjectId(element.userId), updatedDateTime : new Date() } }, function(paymentErr, paymentReq) {
                
//                             if (!paymentErr)  
//                             {
//                                 if(paymentReq.n > 0)
//                                 {  
//                                     console.log("KNET Payment Status Updated successfully.");  
//                                     //res.send(ResponseDTO.ErrorMassage(constant.ErrorCode.UpdateSuccessfully, constant.ErrorMsg.UpdateSuccessfully, {} ));   
//                                 }
//                                 else
//                                 {
//                                     //res.send(ResponseDTO.ErrorMassage(constant.ErrorCode.NotUpdated, constant.ErrorMsg.NotUpdated, {} ));   
//                                 } 

//                             }
//                             else 
//                             { 
//                                 // throw err paymentErr
//                                 //res.send(ResponseDTO.TechnicalError());
//                                 console.log("payment Err : ");
//                                 console.log(paymentErr);
//                                 log.info("payment Err : ");
//                                 log.info(paymentErr);
//                             }
//                         }); 

//                   });


//                   var refundData =  new LINQ(KNETPaymentReqDoc)                
//                   .Where(function(x) 
//                   {   
//                     return x.pd_statusId == -1 ;
//                   })
//                   .ToArray();


//                   refundData.forEach(element => {
                    
//                     //Call API 
//                     // KNETPaymentRequest.update(
//                     //       { _id : ObjectId(element.knetpaymentrequestId), isActive : true, isDeleted : false }, 
//                     //       { $set: { statusId  : 2, updatedBy: ObjectId(element.userId), updatedDateTime : new Date() } }, function(paymentErr, paymentReq) {
              
//                     //       if (!paymentErr)  
//                     //       {
//                     //           if(paymentReq.n > 0)
//                     //           {  
//                     //               console.log("KNET Payment Status Updated successfully.");  
//                     //               //res.send(ResponseDTO.ErrorMassage(constant.ErrorCode.UpdateSuccessfully, constant.ErrorMsg.UpdateSuccessfully, {} ));   
//                     //           }
//                     //           else
//                     //           {
//                     //               //res.send(ResponseDTO.ErrorMassage(constant.ErrorCode.NotUpdated, constant.ErrorMsg.NotUpdated, {} ));   
//                     //           } 

//                     //       }
//                     //       else 
//                     //       { 
//                     //           // throw err paymentErr
//                     //           //res.send(ResponseDTO.TechnicalError());
//                     //           console.log("payment Err : ");
//                     //           console.log(paymentErr);
//                     //           log.info("payment Err : ");
//                     //           log.info(paymentErr);
//                     //       }
//                     //   }); 

//                 });



//                   var result = {
//                       totalRecords : processedData 
//                   } 
 
//                   console.log(result);
//                   resolve(result);
                  

                  
//               });

//              // console.log("promise Data : ");
//              // console.log(promise);
              

//               //res.send(ResponseDTO.DataRetrievedSuccessfully(constant.ErrorCode.DataRetrievedSuccessfully, constant.ErrorMsg.DataRetrievedSuccessfully, promise ));  
//             }
//             else
//             {
//               //Not Found Any Pending Transaction
//                console.log("Not Found Any Pending Transaction");
//               // log.info("Not Found Any Pending Transaction");
//             }
//           }
//           else
//           {
//               //Log
//               console.log("KNET Payment Request Err : ");
//               console.log(KNETPaymentRequestErr);
//               log.info("KNET Payment Request Err : ");
//               log.info(KNETPaymentRequestErr);
              
//               //throw err;
//               //res.send(ResponseDTO.TechnicalError());  
//           }
//       });   


// });


// Get Payment Request From KNET (Store data before payment )
router.get("/PaymentRequestFromKNET", (req, res) => {
    //console.log("================>>>>>>"); 
    log.info("================>>>>>>");
    
    //console.log(req.query);
    
    log.info(req.query);
    log.info(req.query);
    //console.log(req.query);

    //res.send(ResponseDTO.DataRetrievedSuccessfully(constant.ErrorCode.CreateSuccessfully, constant.ErrorMsg.CreateSuccessfully, {} ) );                                                           
            //Add KNET Payment Request
            var KNETPaymentReq = new KNETPaymentRequest({  

              userId : ObjectId(req.query.ReqUdf1),
              errorUrl : req.query.ErrorUrl,
              price : req.query.price,
              qty : req.query.qty,
              languageCode : req.query.LanguageCode,
              userId :  ObjectId(req.query.ReqUdf1),
              planId :  ObjectId(req.query.ReqUdf2),
              languageId : req.query.ReqUdf3,
              userName : req.query.ReqUdf4,
              tranTrackid: req.query.TranTrackid,
              currencyCode : req.query.CurrencyCode,
              statusId : 0, // 0 = Non Notified Transaction , 1 = Refund, 2 = Processed Transaction 
              isActive : true,
              isDeleted : false, 
              createdBy : ObjectId(req.query.ReqUdf1),
              createdDateTime : new Date(),
              updatedBy : null,
              updatedDateTime : null   
            });

            KNETPaymentReq.save((err, KNETPaymentReqDoc) => { 
                if (!err) 
                {  
                    res.send(ResponseDTO.DataRetrievedSuccessfully(constant.ErrorCode.CreateSuccessfully, constant.ErrorMsg.CreateSuccessfully, {} ) );                                                           
                }
                else 
                { 
                    //console.log("3"); 
                    //throw err;
                    res.send(ResponseDTO.TechnicalError()); 
                }
            });   
      
    
            // //Edit KNET Payment Request
            // CreditPlans.count({ _id : ObjectId(req.body.planId), isActive : true, isDeleted : false }, async (err, IsExistPlan) => {
            //     console.log(IsExistPlan);

            //     if(!err)
            //     {
            //         if(IsExistPlan > 0)
            //         {
                        
            //             CreditPlans.update(
            //                 { _id : ObjectId(req.body.planId), isActive : true, isDeleted : false }, 
            //                 { $set: { price : req.body.price, note : req.body.note, updatedBy: ObjectId(req.headers.userId), updatedDateTime : new Date() } }, function(err, creditPlan) {
                        
            //                 if (!err)  
            //                 {
            //                     if(creditPlan.n > 0)
            //                     {  
            //                         console.log("Plan Updated successfully.");  
            //                         res.send(ResponseDTO.ErrorMassage(constant.ErrorCode.UpdateSuccessfully, constant.ErrorMsg.UpdateSuccessfully, {} ));   
            //                     }
            //                     else
            //                     {
            //                         res.send(ResponseDTO.ErrorMassage(constant.ErrorCode.NotUpdated, constant.ErrorMsg.NotUpdated, {} ));   
            //                     } 

            //                 }
            //                 else 
            //                 { 
            //                     // throw err
            //                     res.send(ResponseDTO.TechnicalError());
            //                 }
            //             }); 
  
            //         }
            //         else
            //         {
            //             //Not Found Parent Category 
            //             res.send(ResponseDTO.InvalidParameter()); 
            //         }
            //     }
            //     else
            //     {
            //         res.send(ResponseDTO.TechnicalError()); 
            //     }

 
  });
  

 


async function PaymentRequest(userId, planId, price, userName, emailAddress, mobileNo, languageid, req, res ) 
{
  //Write Payment Code
  if(emailAddress.trim() != "")
  {
    emailAddress = emailAddress.toLowerCase();
  }
  
  console.log("Email Address : " + emailAddress);

  console.log()
  log.info("\n\n\n");
  log.info("========================== New Payment Request ==========================");
 
  log.info("User Id       : " + userId);
  log.info("Plan Id       : " + planId);
  log.info("Price         : " + price);
  log.info("User Name     : " + userName);
  log.info("Email Address : " + emailAddress);
  log.info("Mobile No     : " + mobileNo);
  log.info("language id     : " + languageid);

  console.log("User Id       : " + userId);
  console.log("Plan Id       : " + planId);
  console.log("Price         : " + price);
  console.log("User Name     : " + userName);
  console.log("Email Address : " + emailAddress);
  console.log("Mobile No     : " + mobileNo);
  log.info("language id     : " + languageid);

 
  // log.info("payment Request Xml : " + JSON.stringify(paymentReqXml));
  //   res.send(ResponseDTO.InvalidParameter());
  // res.send(paymentReqXml);
  log.info("\n");
  //var request = require('request');
  // var options = {
  //   'method': 'GET',
  //   'url': 'http://testupdates.com/KNET/PHP/details.php',
  //   'headers': {},
  //   'formData': 
  //   {
  //     'product': 'Internet Card',
  //     'price': price,
  //     'qty': '1',
  //     'total': price,
  //     'name': userName,
  //     'address': '',
  //     'postal': '',
  //     'languageCode': (languageid == 2) ? 'USA' : 'AR',
  //     'userId': userId,
  //     'planId': planId
  //   }
  // };
  var languageCode = (languageid == 2) ? "USA" : "AR"; 
  userName = userName.replace(/[^a-zA-Z ]/g, "");
  
  var ReqUrl = appsetting.Payment_KNET.PaymentReqUrl + "?product=Internet Card&price="+price+"&qty=1&total="+price+"&name="+userName+"&address=&postal=&languageCode="+languageCode +"&userId="+userId+"&planId="+planId+"&languageId="+languageid;

  console.log("ReqUrl : " + ReqUrl);
  console.log("Done");

  log.info("ReqUrl : " + ReqUrl);
  log.info("Done");

  res.redirect(ReqUrl);
    // request(options, function (error, response) {
    // if (error) throw new Error(error);
    // console.log(response.body);
    // })
  
  return;
  



  // log.info("========================== Start Token API Call =========================="); 
  // log.info("URL   : " + appSetting.Payment.PaymentGatewayBaseURL + "/Token"); 
  // log.info("Body  : " + "grant_type=password&username=" + appSetting.Payment.UserName + "&password=" + appSetting.Payment.Password); 
  //   request(
  //   {
  //     url: appSetting.Payment.PaymentGatewayBaseURL + "/Token",
  //     method: 'POST',
  //     headers: { "Content-Type": "application/json" },
  //     body: "grant_type=password&username=" + appSetting.Payment.UserName + "&password=" + appSetting.Payment.Password
  //   },
  //   function(TokenAPIerror, TokenAPIresponse, TokenAPIbody) {
  //     log.info("\n");
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
  //       //console.log(TokenAPIDetails);
  //       // log.info("Body With Parse Data   : " );  
  //       // log.info(TokenAPIDetails);  
        

  //       //  console.log(TokenAPIDetails.access_token);
  //       //  console.log(TokenAPIDetails.token_type);
  //       //  console.log(TokenAPIDetails.body);
      

  //       // console.log(JSON.stringify(response));
  //       // JSON.parse(JSON.stringify(response));
  //       // JSON.parse(JSON.stringify(response.statusCode));
  //       // //console.log("body : " + body);
  //       // console.log(JSON.stringify(response.statusCode));
  //       // console.log("access_token : " + response.access_token);
  //       // console.log("token_type : " + response.token_type); 

  //       if (!TokenAPIerror && TokenAPIDetails != undefined && TokenAPIDetails.access_token != undefined && TokenAPIDetails.token_type != undefined) {
            
  //           log.info("\n");
  //           log.info("========================== Start Create Invoice Iso API Call ==========================");
  //           log.info("Request URL   : " + appSetting.Payment.PaymentGatewayBaseURL + "/ApiInvoices/CreateInvoiceIso"); 
    
  //           var RequestBody = new Object ({
  //             "InvoiceValue": price,
  //             "CustomerName": userName,
  //             "CustomerBlock": "",
  //             "CustomerStreet": "",
  //             "CustomerHouseBuildingNo": "",
  //             "CustomerCivilId": "",
  //             "CustomerAddress": "",
  //             "CustomerReference": "",
  //             "DisplayCurrencyIsoAlpha": "KWD",
  //             "CountryCodeId": 965,
  //             "CustomerMobile": mobileNo,
  //             "CustomerEmail": emailAddress,
  //             "SendInvoiceOption": 4, 
  //               //  SendInvoiceOption : 
  //               // 1 - Generate Invoice and Send link by SMS to the customer's phone.
  //               // 2 - Generate Invoice and Send link by Email to the customer's email.
  //               // 3 - Generate Invoice and Send link by both SMS & Email.
  //               // 4 - Generate Invoice Link only.

  //             "InvoiceItemsCreate": 
  //             [
  //               {
  //                 "ProductId": null,
  //                 "ProductName": "ESALNY Plan Purchase",
  //                 "Quantity": 1,
  //                 "UnitPrice": price
  //               }
  //             ],
  //             "CallBackUrl": appSetting.SystemConfiguration.APIBaseUrl + "payment/Response/",
  //             "Language": languageid,
  //             "ExpireDate": "",
  //             "ApiCustomFileds": userId,
  //             "ErrorUrl": appSetting.SystemConfiguration.APIBaseUrl + "payment/Response/"
  //           });
   
  //           log.info("\n");
  //           // log.info("Request Body : " +  JSON.stringify(RequestBody));
  //           log.info("Request Body  : " + JSON.stringify(RequestBody));   
  //           log.info("\n"); 
  //           log.info("Headers Authorization  : " + TokenAPIDetails.token_type + " " + TokenAPIDetails.access_token); 
  //           // console.log("RequestBody : " +  JSON.stringify(RequestBody)); 
  //           // console.log("PaymentGatewayBaseURL : " + appSetting.Payment.PaymentGatewayBaseURL); 

  //           request.post({
  //             url: appSetting.Payment.PaymentGatewayBaseURL + "/ApiInvoices/CreateInvoiceIso",
  //             body: JSON.stringify(RequestBody),
  //             headers: {
  //               "Content-Type": "application/json",
  //               Authorization: TokenAPIDetails.token_type + " " + TokenAPIDetails.access_token
  //           }},
  //           function(PaymentRequesterror, PaymentRequestresponse, PaymentRequestbody) {
  //             log.info("\n");
  //             log.info("========================== Response Of Create Invoice Iso API ==========================");
 
  //             log.info("Error     : " + PaymentRequesterror); 
  //             log.info("\n");
  //             log.info("Response  : " + JSON.stringify(PaymentRequestresponse)); 
  //             log.info("\n");
  //             log.info("Body      : " + PaymentRequestbody);  
  //             log.info("\n");

  //             // console.log("==== Token Done ========"); 
  //             // console.log("error : " + PaymentRequesterror);
  //             // console.log("response : " + PaymentRequestresponse);
  //             // console.log("body : " + PaymentRequestbody);

  //             if(!PaymentRequesterror)
  //             { 
               
  //             //  console.log(JSON.parse(JSON.stringify(PaymentRequestresponse)));
  //               var PaymentRequestBodyResult = JSON.parse(PaymentRequestbody); 

  //               log.info("Body With Parse Data   : ");  
  //               log.info(PaymentRequestBodyResult);  
  //               //console.log(PaymentRequestBodyResult);


  //               if(PaymentRequestBodyResult != null && PaymentRequestBodyResult.IsSuccess == true)
  //               {
  //                 log.info("\n");
  //                 log.info("IsSuccess   : " + true);  
  //                 log.info("\n");
  //                 log.info("Payment Redirect Url   : " + PaymentRequestBodyResult.RedirectUrl);  
  //                 console.log(PaymentRequestBodyResult.RedirectUrl);
  //                 res.redirect(PaymentRequestBodyResult.RedirectUrl);
  //                 return; 
  //               }
  //               else
  //               {
  //                 log.info("\n");
  //                 log.info("IsSuccess   : " + false);   
  //                 res.redirect(appSetting.SystemConfiguration.APIBaseUrl + appSetting.Payment.CancelUrl);
  //               }
  //             }
  //             else
  //             {
  //               // technical error
  //               log.info("\n");
  //               log.info("========================== Error In Create Invoice Iso API ==========================");
  //               if(PaymentRequesterror != undefined) 
  //               { 
  //                 log.info("\n");
  //                 log.info("Error     : " + JSON.stringify(PaymentRequesterror)); 
  //               }
  //               if(PaymentRequestresponse != undefined)
  //               {
  //                 log.info("\n");
  //                 log.info("Response  : " + JSON.stringify(PaymentRequestresponse)); 
  //               }
  //               if(PaymentRequestbody != undefined)
  //               {
  //                 log.info("\n");
  //                 log.info("Body      : " + JSON.stringify(PaymentRequestbody));  
  //               } 

  //               res.redirect(appSetting.SystemConfiguration.APIBaseUrl + appSetting.Payment.CancelUrl);

  //               // request.get({ url: appSetting.SystemConfiguration.APIBaseUrl +  appSetting.Payment.CancelUrl }, function(error, response, body) {
  //               //   res.redirect(appSetting.SystemConfiguration.APIBaseUrl + appSetting.Payment.CancelUrl);
  //               // });
 
  //             } 

  //           });
  //       }
  //       else
  //       {
  //         //Invalid Token or cradantial
  //         log.info("111 \n ");
  //         log.info("========================== Error In Token API ==========================");
  //         if(TokenAPIerror != undefined) 
  //         {
  //           log.info("\n");
  //           log.info("Error     : " + JSON.stringify(TokenAPIerror)); 
  //         }
  //         if(TokenAPIresponse != undefined)
  //         {
  //           log.info("\n");
  //           log.info("Response  : " + JSON.stringify(TokenAPIresponse)); 
  //         }
  //         if(TokenAPIbody != undefined)
  //         {
  //           log.info("\n");
  //           log.info("Body      : " + JSON.stringify(TokenAPIbody));  
  //         } 

  //         res.redirect(appSetting.SystemConfiguration.APIBaseUrl + appSetting.Payment.CancelUrl);
    
  //       }
  
  //     }
  //     else
  //     {
  //       log.info("\n");
  //       log.info("========================== Error In Token API ==========================");
  //       if(TokenAPIerror != undefined) 
  //       {
  //         log.info("\n");
  //         log.info("Error     : " + JSON.stringify(TokenAPIerror)); 
  //       }
  //       if(TokenAPIresponse != undefined)
  //       {
  //         log.info("\n");
  //         log.info("Response  : " + JSON.stringify(TokenAPIresponse)); 
  //       }
  //       if(TokenAPIbody != undefined)
  //       {
  //         log.info("\n");
  //         log.info("Body      : " + JSON.stringify(TokenAPIbody));  
  //       } 

  //       res.redirect(appSetting.SystemConfiguration.APIBaseUrl + appSetting.Payment.CancelUrl); 

  //     }
  
  //   }
  // ); 

 
}
 

function PaymentEmail(EmailDetails, paymentDetails)
{


  var query = {
    language_Id : ObjectId(EmailDetails.languageid),
    templateCode : EmailDetails.templateCode, 
    isActive:  true, 
    isDeleted:  false 
  };


  TemplateLangDetails.find(query, async (err, templateLangDetails) => 
  {

      console.log("======> " + templateLangDetails.length); 
      if (!err) 
      { 
          //console.log(doc);   
          console.log("Template Lang Details : ");
          console.log(templateLangDetails);
          
          console.log("Payment Details : ");
          console.log(paymentDetails);

          if(templateLangDetails.length > 0 && templateLangDetails[0].emailSubject.length > 0 && templateLangDetails[0].emailBody.length > 0)
          { 

              console.log("START send email...");
  
              var emailBody = replaceString(templateLangDetails[0].emailBody, "@User@", EmailDetails.firstName );
              emailBody = replaceString(emailBody, "@PaymentId@", paymentDetails.orderId );
              emailBody = replaceString(emailBody, "@TransactionId@", paymentDetails.trackingId );
              
              //if(EmailDetails.templateCode == constant.TemplateCode.SuccessPaymentEmail)
              //{
                  emailBody = replaceString(emailBody, "@BankRefNo@", (paymentDetails.bankRefNo == null ? "" : paymentDetails.bankRefNo ));
              //}

              emailBody = replaceString(emailBody, "@Amount@", paymentDetails.price + " KD" );
              emailBody = replaceString(emailBody, "@ResultCode@", paymentDetails.statusMessage  + "" );
              emailBody = replaceString(emailBody, "@TransactionDate@", dateFormat(paymentDetails.createdDateTime.Date, appSetting.SystemConfiguration.AdminGridDateFormat)   + "" );
              

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

}

// Get Purchase Plan List
router.get("/PurchasePlan", (req, res) => {

  console.log(req.query);
  console.log(req.query.userId);
  console.log(req.query.planId);
  console.log(req.query.languageid);
  
  // if (!ObjectId.isValid(req.query.userId + "")) {
  //   return Promise.reject(new TypeError(`Invalid id: ${req.query.userId+""}`));
  // }
  
  
    if (req.query.userId == undefined || req.query.planId == undefined ) { //req.query.languageid == undefined
      res.send(ResponseDTO.InvalidParameter());
    } else {
      console.log("1");
      UserMaster.find({ _id: ObjectId(req.query.userId), isActive: true, isDeleted: false }, (err, userMasterDoc) => {
          if (!err) {
            console.log("2");
            //console.log(userMasterDoc);
            //Add Cancel URL and Success URL
            if (userMasterDoc.length == 1) {
              CreditPlans.find( { _id: ObjectId(req.query.planId), isActive: true, isDeleted: false }, (err, creditPlanDoc) => {
                  if (!err) {
                    console.log("3");
                    //console.log(creditPlanDoc);
                    //Add Cancel URL and Success URL
                    if (creditPlanDoc.length == 1) {
                      //creditPlanDoc
                      //userMasterDoc
                      console.log("4");
                      var userName =
                        userMasterDoc[0].firstName.trim() == ""
                          ? userMasterDoc[0]._id
                          : userMasterDoc[0].firstName.trim();
                      var emailAddress =
                        userMasterDoc[0].emailAddress.trim() == ""
                          ? userMasterDoc[0]._id + "@gmail.com"
                          : userMasterDoc[0].emailAddress.trim();
  
                      if (creditPlanDoc[0].price > 0) 
                      {
                        console.log("5");
                        console.log("Call PaymentRequest Function");
                        console.log(req.query.languageid);
                        console.log(constant.Language.English);
                        console.log(req.query.languageid == constant.Language.English);
                        var languageid = 1;
                        if(req.query.languageid == constant.Language.English)
                        {
                          languageid = 2;
                        }
                        else if(req.query.languageid == constant.Language.Arabic)
                        {
                          languageid = 1;
                        } 
                        else
                        {
                          languageid = 1;
                        }
                        PaymentRequest(req.query.userId, req.query.planId, creditPlanDoc[0].price, userName, emailAddress, userMasterDoc[0].mobileNo, languageid, req, res );
                      } else 
                      {
                        console.log("6");
                        res.send(ResponseDTO.TechnicalError());
                      }
                      //res.send(ResponseDTO.ErrorMassage(constant.ErrorCode.DataRetrievedSuccessfully, constant.ErrorMsg.DataRetrievedSuccessfully, userMasterDoc ));
                    } else {
                      console.log("7");
                      //Many Users or not found User
                      res.send(ResponseDTO.ErrorMassage(constant.ErrorCode.InvalidPlanId, constant.ErrorMsg.InvalidPlanId, {}));
                    }
                    console.log("8");
                  } else {
                    console.log("9");
                    res.send(ResponseDTO.TechnicalError());
                  }
                }
              );
            } else {
              console.log("10");
              //Many Users or not found User
              res.send(ResponseDTO.ErrorMassage(constant.ErrorCode.InvalidUserId, constant.ErrorMsg.InvalidUserId, {}));
            }
          } else {
            console.log("11");
            res.send(ResponseDTO.TechnicalError());
          }
        }
      );
    }
  });
  
  
  //For Store Payment Details
  function StorePaymentDetails(PD, languageid, userName, req, res, paymentGetwayType) {
    paymentGetway = null;
    if(paymentGetwayType == 1) {
      paymentGetway = constant.PaymentType.KNET;          
    } else if(paymentGetwayType == 2) {
      paymentGetway = constant.PaymentType.VISACHECKOUT;          
    }

    var paymentDetails = new PaymentDetails({
      // _id : ObjectId(),
      user_Id: ObjectId(PD.user_Id),
      orderId: (PD.orderId == undefined) ? null : PD.orderId,
      trackingId: (PD.trackingId == undefined) ? null : PD.trackingId,
      bankRefNo: (PD.bankRefNo == undefined) ? null : PD.bankRefNo,
      orderStatus: PD.orderStatus,
      failureMessage: (PD.failureMessage == undefined) ? null : PD.failureMessage,
      paymentMode: PD.paymentMode == undefined ? "KNET" : PD.paymentMode,
      cardName: PD.cardName,
      statusCode: PD.statusCode, //1 - Success, 0 - Fail
      statusMessage: PD.statusMessage,
      price: PD.price == undefined ? null : PD.price,
      paymentGetwayType: paymentGetway,
      isActive: true,
      isDeleted: false,
      createdBy: ObjectId(PD.user_Id),
      createdDateTime: new Date(),
      updatedBy: null,
      updatedDateTime: null,
      planId: ObjectId(PD.planId),
    });
  
    var langId;
    if(languageid == 2)
    {
      langId = constant.Language.English;
    }
    else if(languageid == 1)
    {
      langId = constant.Language.Arabic;
    } 
    else
    {
      langId = constant.Language.Arabic;
    }

    // var userName;
    // if(user_Name == undefined || user_Name == "undefined" || user_Name.trim() == "" || user_Name == null)
    // {
    //   userName = "";
    // }
    // else
    // {
    //   userName= user_Name;
    // }

  
    log.info("===================== Store Payment Details In Database =====================");
  
    log.info("Payment Details : " + JSON.stringify(paymentDetails));
  


    PaymentDetails.find({ user_Id: ObjectId(PD.user_Id), orderId : paymentDetails.orderId, trackingId : paymentDetails.trackingId, statusCode : paymentDetails.statusCode, paymentGetwayType : paymentDetails.paymentGetwayType, planId : paymentDetails.planId,  isActive : true , isDeleted : false }, async (PaymentDetailVerifyerr,  PaymentDetailVerifyDocs) => {
      if(!PaymentDetailVerifyerr)
      { 
        log.info('!PaymentDetailVerifyerr');
        if(PaymentDetailVerifyDocs.length)
        {
          log.info('PaymentDetailVerifyDocs.length');
          //Duplication Record 
          UserMaster.find({ _id: ObjectId(PD.user_Id) }, async (UserMasterDetailerr,  UserMasterDetailDocs) => {
            if(!UserMasterDetailerr)
            {  
              log.info('!UserMasterDetailerr');

              var Url = (languageid == 2) ? "receiptEn.php" : "receiptAr.php";
              var queryData = "?PaymentId=" + paymentDetails.orderId + "&TransactionId=" + paymentDetails.trackingId + "&ResultCode=" + paymentDetails.statusMessage + "&TransactionDate=" + dateFormat(paymentDetails.createdDateTime, appSetting.SystemConfiguration.AdminGridDateFormat) + "&UserName=" + UserMasterDetailDocs[0].firstName.replace(/[^a-zA-Z ]/g, "") + "&Price=" + paymentDetails.price + "&TotalPrice=" + paymentDetails.price + "&URL=" + appSetting.SystemConfiguration.APIBaseUrl + appSetting.Payment.SuccessUrl + "&Email=" + UserMasterDetailDocs[0].emailAddress;
            
              log.info("Receipt URL : " + appsetting.Payment_KNET.PaymentReceiptUrl + Url + queryData);
              var queryData = "?PaymentId=" + paymentDetails.orderId + "&TransactionId=" + paymentDetails.trackingId + "&ResultCode=" + paymentDetails.statusMessage + "&TransactionDate=" + dateFormat(paymentDetails.createdDateTime, appSetting.SystemConfiguration.AdminGridDateFormat) + "&UserName=" + UserMasterDetailDocs[0].firstName.replace(/[^a-zA-Z ]/g, "") + "&Price=" + paymentDetails.price + "&TotalPrice=" + paymentDetails.price + "&URL=" + appSetting.SystemConfiguration.APIBaseUrl + appSetting.Payment.SuccessUrl + "&Email=" + UserMasterDetailDocs[0].emailAddress;

              res.redirect(appsetting.Payment_KNET.PaymentReceiptUrl + Url + queryData);


            }
            else
            {
              log.info('UserMasterDetailerr');
              var EmailDetails = {
                languageid : langId,
                templateCode : constant.TemplateCode.FailedPaymentEmail,
                to : UserDetailDocs[0].emailAddress,
                from : appSetting.Email.FromEmail, 
                firstName : UserDetailDocs[0].firstName 
              }  
              
              PaymentEmail(EmailDetails, paymentDetails);   


                var Url = (languageid == 2) ? "receiptEn.php" : "receiptAr.php";

                log.info("1. Receipt URL : " + appsetting.Payment_KNET.PaymentReceiptUrl + Url);

                res.redirect(appsetting.Payment_KNET.PaymentReceiptUrl + Url);
                             
            }

          });


        }
        else
        {
          log.info('!PaymentDetailVerifyDocs.length');
          //No Duplication 
          paymentDetails.save((err, paymentDetailsDoc) => {
            if (!err) {
              if (!paymentDetailsDoc.length) {
       
                if(paymentDetails.statusCode == 1)
                {
       
                    var userPurchases = new UserPurchases({
                      user_Id: ObjectId(PD.user_Id),
                      payment_Id: ObjectId(paymentDetailsDoc._id),
                      price: PD.price,
                      expiryDate: null,
                      isActive: true,
                      isDeleted: false,
                      createdBy: ObjectId(PD.user_Id),
                      createdDateTime: new Date(),
                      updatedBy: null,
                      updatedDateTime: null
                    });
      
                    
                    userPurchases.save((userPurchaseserr, userPurchasesDoc) => {
                    if (!userPurchaseserr) {
                        if (!userPurchasesDoc.length) {
         
      
                          
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
                                    "dtm.user_Id" : ObjectId(PD.user_Id)
                               }
                            },  
                            {
                                $project: {
                                    userId: "$dtm.user_Id", 
                                    deviceId : "$dtm.deviceId",
                                    deviceToken : "$dtm.deviceToken", 
                                    appId: "$dtm.appId", 
                                    title: "Amount Credited",
                                    message : { $concat : [ PD.price+"", " ", constant.CurrencySymbol.Kuwait, " added successfully in your wallet."] }, 
                                    sound : "default",
                                    _id: 0
                                }
                            }
                        ];
                
                 
                        // For User List
                        DeviceTokenMasters.aggregate(pipeline, async (UserTokenserr,  UserTokens) =>
                        {    
                            if(!UserTokenserr)
                            { 
                                console.log(UserTokens); 
                                Helper.SendPushNotification(UserTokens); 
                                
                                //For Email
                                UserMaster.find({ _id: ObjectId(PD.user_Id) }, async (UserDetailerr,  UserDetailDocs) => {
                                  if(!UserDetailerr)
                                  { 
                                        var EmailDetails = {
                                          languageid : langId,
                                          templateCode : constant.TemplateCode.SuccessPaymentEmail,
                                          to : UserDetailDocs[0].emailAddress,
                                          from : appSetting.Email.FromEmail, 
                                          firstName : UserDetailDocs[0].firstName 
                                        }  
                                        PaymentEmail(EmailDetails, paymentDetails);   
      
      
                                        var Url = (languageid == 2) ? "receiptEn.php" : "receiptAr.php";
                                        var queryData = "?PaymentId=" + paymentDetails.orderId + "&TransactionId=" + paymentDetails.trackingId + "&ResultCode=" + paymentDetails.statusMessage + "&TransactionDate=" + dateFormat(paymentDetails.createdDateTime, appSetting.SystemConfiguration.AdminGridDateFormat) + "&UserName=" + UserDetailDocs[0].firstName.replace(/[^a-zA-Z ]/g, "") + "&Price=" + paymentDetails.price + "&TotalPrice=" + paymentDetails.price + "&URL=" + appSetting.SystemConfiguration.APIBaseUrl + appSetting.Payment.SuccessUrl + "&Email=" + UserDetailDocs[0].emailAddress;
                                        // var optionsReceipt = {
                                        //   'method': 'POST',
                                        //   'url':  appsetting.Payment_KNET.PaymentReceiptUrl + Url,
                                        //   'headers': {
                                        //     "Content-Type": "text/html",
                                        //   },
                                        //   formData: {
                                        //     'PaymentId': paymentDetails.orderId,
                                        //     'TransactionId': paymentDetails.trackingId, 
                                        //     'ResultCode': paymentDetails.statusMessage,
                                        //     'TransactionDate': dateFormat(paymentDetails.createdDateTime, appSetting.SystemConfiguration.AdminGridDateFormat) + "",
                                        //     'UserName': UserDetailDocs[0].firstName,
                                          
                                        //     'Price': paymentDetails.price,
                                        //     'TotalPrice': paymentDetails.price,
                                        //     'URL': appSetting.SystemConfiguration.APIBaseUrl + appSetting.Payment.SuccessUrl,
                                        //     'Email': UserDetailDocs[0].emailAddress
                                        //   }
                                        // };
      
                                        //log.info("optionsAndFormDataReceipt : " + JSON.stringify(optionsReceipt));
                               
                                        //res.send(optionsReceipt);
                                       
                                        log.info("Receipt URL : " + appsetting.Payment_KNET.PaymentReceiptUrl + Url + queryData);
                                        var queryData = "?PaymentId=" + paymentDetails.orderId + "&TransactionId=" + paymentDetails.trackingId + "&ResultCode=" + paymentDetails.statusMessage + "&TransactionDate=" + dateFormat(paymentDetails.createdDateTime, appSetting.SystemConfiguration.AdminGridDateFormat) + "&UserName=" + UserDetailDocs[0].firstName.replace(/[^a-zA-Z ]/g, "") + "&Price=" + paymentDetails.price + "&TotalPrice=" + paymentDetails.price + "&URL=" + appSetting.SystemConfiguration.APIBaseUrl + appSetting.Payment.SuccessUrl + "&Email=" + UserDetailDocs[0].emailAddress;
      
                                        res.redirect(appsetting.Payment_KNET.PaymentReceiptUrl + Url + queryData);
      
      
                                      //  request.post(appsetting.Payment_KNET.PaymentReceiptUrl + Url, optionsReceipt, function (error, response) {
                                      //     if (error) 
                                      //     {
                                      //       //throw new Error(error); 
                                      //       log.info("Receipt error : " + error);
                                      //       log.info("Receipt error : " + JSON.stringify(error));
                                            
                                      //     }
                                      //     else
                                      //     {
                                            
                                      //       log.info("Receipt response : " + JSON.stringify(response));
                                      //       res.send(response.body);
                                      //       //log.info("Payment Details : " + JSON.stringify(response.body));
                                      //     }
                                      //   });
      
      
                                  }
                                  else
                                  {
      
                                    var EmailDetails = {
                                      languageid : langId,
                                      templateCode : constant.TemplateCode.FailedPaymentEmail,
                                      to : UserDetailDocs[0].emailAddress,
                                      from : appSetting.Email.FromEmail, 
                                      firstName : UserDetailDocs[0].firstName 
                                    }  
                                    
                                    PaymentEmail(EmailDetails, paymentDetails);   
      
      
                                      var Url = (languageid == 2) ? "receiptEn.php" : "receiptAr.php";
      
                                      log.info("1. Receipt URL : " + appsetting.Payment_KNET.PaymentReceiptUrl + Url);
      
                                      res.redirect(appsetting.Payment_KNET.PaymentReceiptUrl + Url);
       
                                    // request.get(
                                    //   {
                                    //     url:
                                    //         appSetting.SystemConfiguration.APIBaseUrl +
                                    //         appSetting.Payment.CancelUrl,
                                    //     headers: 
                                    //     {
                                    //         "Content-Type": "text/html",
                                    //         appid: req.headers.appid,
                                    //         userid: req.headers.userid,
                                    //         logintoken: req.headers.logintoken,
                                    //         languageid: req.headers.languageid,
                                    //         deviceid: req.headers.deviceid
                                    //     }
                                    //   },
                                    //   function(error, response, body) {
                                    //     res.redirect(appSetting.SystemConfiguration.APIBaseUrl + appSetting.Payment.CancelUrl);
                                    //   }
                                    //);                               
                                  }
      
                                });
       
                                // request.get(
                                //   {
                                //     url:
                                //         appSetting.SystemConfiguration.APIBaseUrl +
                                //         appSetting.Payment.SuccessUrl,
                                //     headers: {
                                //         "Content-Type": "text/html",
                                //         appid: req.headers.appid,
                                //         userid: req.headers.userid,
                                //         logintoken: req.headers.logintoken,
                                //         languageid: req.headers.languageid,
                                //         deviceid: req.headers.deviceid
                                //     }
                                //   },
                                //   function(error, response, body) {
                                //     res.redirect(appSetting.SystemConfiguration.APIBaseUrl + appSetting.Payment.SuccessUrl);
                                //   }
                                // ); 
        
                            }
                            else
                            {
      
                                //For Email
                                // UserMaster.find({ _id: ObjectId(PD.user_Id) }, async (UserDetailerr,  UserDetailDocs) => {
                                //   if(!UserDetailerr)
                                //   { 
                                //         var EmailDetails = {
                                //           languageid : langId,
                                //           templateCode : constant.TemplateCode.SuccessPaymentEmail,
                                //           to : UserDetailDocs[0].emailAddress,
                                //           from : appSetting.Email.FromEmail, 
                                //           firstName : UserDetailDocs[0].firstName 
                                //         }  
                                //         PaymentEmail(EmailDetails, paymentDetails);   
      
      
                                //         var Url = (languageid == 2) ? "receiptEn.php" : "receiptAr.php";
                                //         var queryData = "?PaymentId=" + paymentDetails.orderId + "&TransactionId=" + paymentDetails.trackingId + "&ResultCode=" + paymentDetails.statusMessage + "&TransactionDate=" + dateFormat(paymentDetails.createdDateTime, appSetting.SystemConfiguration.AdminGridDateFormat) + "&UserName=" + UserDetailDocs[0].firstName.replace(/[^a-zA-Z ]/g, "") + "&Price=" + paymentDetails.price + "&TotalPrice=" + paymentDetails.price + "&URL=" + appSetting.SystemConfiguration.APIBaseUrl + appSetting.Payment.SuccessUrl + "&Email=" + UserDetailDocs[0].emailAddress;
                                        
                                       
                                //         log.info("Receipt URL : " + appsetting.Payment_KNET.PaymentReceiptUrl + Url + queryData);
                                //         var queryData = "?PaymentId=" + paymentDetails.orderId + "&TransactionId=" + paymentDetails.trackingId + "&ResultCode=" + paymentDetails.statusMessage + "&TransactionDate=" + dateFormat(paymentDetails.createdDateTime, appSetting.SystemConfiguration.AdminGridDateFormat) + "&UserName=" + UserDetailDocs[0].firstName.replace(/[^a-zA-Z ]/g, "") + "&Price=" + paymentDetails.price + "&TotalPrice=" + paymentDetails.price + "&URL=" + appSetting.SystemConfiguration.APIBaseUrl + appSetting.Payment.SuccessUrl + "&Email=" + UserDetailDocs[0].emailAddress;
      
                                //         res.redirect(appsetting.Payment_KNET.PaymentReceiptUrl + Url + queryData);
      
       
                                //   }
                                //   else
                                //   {
      
                                //     var EmailDetails = {
                                //       languageid : langId,
                                //       templateCode : constant.TemplateCode.FailedPaymentEmail,
                                //       to : UserDetailDocs[0].emailAddress,
                                //       from : appSetting.Email.FromEmail, 
                                //       firstName : UserDetailDocs[0].firstName 
                                //     }  
                                    
                                //     PaymentEmail(EmailDetails, paymentDetails);   
      
      
                                //       var Url = (languageid == 2) ? "receiptEn.php" : "receiptAr.php";
      
                                //       log.info("1. Receipt URL : " + appsetting.Payment_KNET.PaymentReceiptUrl + Url);
      
                                //       res.redirect(appsetting.Payment_KNET.PaymentReceiptUrl + Url);
       
                                //     // request.get(
                                //     //   {
                                //     //     url:
                                //     //         appSetting.SystemConfiguration.APIBaseUrl +
                                //     //         appSetting.Payment.CancelUrl,
                                //     //     headers: 
                                //     //     {
                                //     //         "Content-Type": "text/html",
                                //     //         appid: req.headers.appid,
                                //     //         userid: req.headers.userid,
                                //     //         logintoken: req.headers.logintoken,
                                //     //         languageid: req.headers.languageid,
                                //     //         deviceid: req.headers.deviceid
                                //     //     }
                                //     //   },
                                //     //   function(error, response, body) {
                                //     //     res.redirect(appSetting.SystemConfiguration.APIBaseUrl + appSetting.Payment.CancelUrl);
                                //     //   }
                                //     //);                               
                                //   }
      
                                // });
                             
      
                              request.get(
                                {
                                  url:
                                      appSetting.SystemConfiguration.APIBaseUrl +
                                      appSetting.Payment.CancelUrl,
                                  headers: 
                                  {
                                      "Content-Type": "text/html",
                                      appid: req.headers.appid,
                                      userid: req.headers.userid,
                                      logintoken: req.headers.logintoken,
                                      languageid: req.headers.languageid,
                                      deviceid: req.headers.deviceid
                                  }
                                },
                                function(error, response, body) {
                                  res.redirect(appSetting.SystemConfiguration.APIBaseUrl + appSetting.Payment.CancelUrl);
                                }
                              ); 
                            }
                        }); 
                 
                        //res.send(ResponseDTO.GetConsumerDetails(constant.ErrorCode.RegistrationSuccessfully, constant.ErrorMsg.RegistrationSuccessfully , userMasterDoc, userDetailsDoc, loginToken, walletDetails.CurrentBalance) );
                        } 
                        else 
                        {
                        //throw err;
                        //res.send(ResponseDTO.TechnicalError());
                        
                        request.get(
                            {
                            url:
                                appSetting.SystemConfiguration.APIBaseUrl +
                                appSetting.Payment.CancelUrl,
                            headers: {
                                "Content-Type": "text/html",
                                appid: req.headers.appid,
                                userid: req.headers.userid,
                                logintoken: req.headers.logintoken,
                                languageid: req.headers.languageid,
                                deviceid: req.headers.deviceid
                            }
                            },
                            function(error, response, body) {
                            res.redirect(
                                appSetting.SystemConfiguration.APIBaseUrl +
                                appSetting.Payment.CancelUrl
                            );
                            }
                        );
                        }
                    } else {
                        //throw err;
                        //res.send(ResponseDTO.TechnicalError());
                        request.get(
                        {
                            url:
                            appSetting.SystemConfiguration.APIBaseUrl +
                            appSetting.Payment.CancelUrl,
                            headers: {
                            "Content-Type": "text/html",
                            appid: req.headers.appid,
                            userid: req.headers.userid,
                            logintoken: req.headers.logintoken,
                            languageid: req.headers.languageid,
                            deviceid: req.headers.deviceid
                            }
                        },
                        function(error, response, body) {
                            res.redirect(
                            appSetting.SystemConfiguration.APIBaseUrl +
                                appSetting.Payment.CancelUrl
                            );
                        }
                        );
                    }
                    });
                }
                else
                {
      
      
                                //For Email
                                UserMaster.find({ _id: ObjectId(PD.user_Id) }, async (UserDetailerr,  UserDetailDocs) => {
                                  if(!UserDetailerr)
                                  { 
                                        var EmailDetails = {
                                          languageid : langId,
                                          templateCode : constant.TemplateCode.FailedPaymentEmail,
                                          to : UserDetailDocs[0].emailAddress,
                                          from : appSetting.Email.FromEmail, 
                                          firstName : UserDetailDocs[0].firstName 
                                        }  
                                        PaymentEmail(EmailDetails, paymentDetails);   
      
      
                                        var Url = (languageid == 2) ? "receiptEn.php" : "receiptAr.php";
                                        var queryData = "?PaymentId=" + paymentDetails.orderId + "&TransactionId=" + paymentDetails.trackingId + "&ResultCode=" + paymentDetails.statusMessage + "&TransactionDate=" + dateFormat(paymentDetails.createdDateTime, appSetting.SystemConfiguration.AdminGridDateFormat) + "&UserName=" + UserDetailDocs[0].firstName.replace(/[^a-zA-Z ]/g, "") + "&Price=" + paymentDetails.price + "&TotalPrice=" + paymentDetails.price + "&URL=" + appSetting.SystemConfiguration.APIBaseUrl + appSetting.Payment.SuccessUrl + "&Email=" + UserDetailDocs[0].emailAddress;
                                        
                                       
                                        log.info("Receipt URL : " + appsetting.Payment_KNET.PaymentReceiptUrl + Url + queryData);
                                        var queryData = "?PaymentId=" + paymentDetails.orderId + "&TransactionId=" + paymentDetails.trackingId + "&ResultCode=" + paymentDetails.statusMessage + "&TransactionDate=" + dateFormat(paymentDetails.createdDateTime, appSetting.SystemConfiguration.AdminGridDateFormat) + "&UserName=" + UserDetailDocs[0].firstName.replace(/[^a-zA-Z ]/g, "") + "&Price=" + paymentDetails.price + "&TotalPrice=" + paymentDetails.price + "&URL=" + appSetting.SystemConfiguration.APIBaseUrl + appSetting.Payment.SuccessUrl + "&Email=" + UserDetailDocs[0].emailAddress;
      
                                        res.redirect(appsetting.Payment_KNET.PaymentReceiptUrl + Url + queryData);
      
       
                                  }
                                  else
                                  {
      
                                    var EmailDetails = {
                                      languageid : langId,
                                      templateCode : constant.TemplateCode.FailedPaymentEmail,
                                      to : UserDetailDocs[0].emailAddress,
                                      from : appSetting.Email.FromEmail, 
                                      firstName : UserDetailDocs[0].firstName 
                                    }  
                                    
                                    PaymentEmail(EmailDetails, paymentDetails);   
      
      
                                      var Url = (languageid == 2) ? "receiptEn.php" : "receiptAr.php";
      
                                      log.info("1. Receipt URL : " + appsetting.Payment_KNET.PaymentReceiptUrl + Url);
      
                                      res.redirect(appsetting.Payment_KNET.PaymentReceiptUrl + Url);
                                     
                                  }
      
                                });
                             
      
                    // request.get(
                    //     {
                    //     url:
                    //         appSetting.SystemConfiguration.APIBaseUrl +
                    //         appSetting.Payment.CancelUrl,
                    //         headers: {
                    //             "Content-Type": "text/html",
                    //             appid: req.headers.appid,
                    //             userid: req.headers.userid,
                    //             logintoken: req.headers.logintoken,
                    //             languageid: req.headers.languageid,
                    //             deviceid: req.headers.deviceid
                    //         }
                    //     },
                    //     function(error, response, body) {
                    //     res.redirect(
                    //         appSetting.SystemConfiguration.APIBaseUrl +
                    //         appSetting.Payment.CancelUrl
                    //     );
                    //     }
                    // );            
                }
        
        
              } else {
                //throw err;
                //res.send(ResponseDTO.TechnicalError());
                request.get(
                  {
                    url:
                      appSetting.SystemConfiguration.APIBaseUrl +
                      appSetting.Payment.CancelUrl,
                    headers: {
                      "Content-Type": "text/html",
                      appid: req.headers.appid,
                      userid: req.headers.userid,
                      logintoken: req.headers.logintoken,
                      languageid: req.headers.languageid,
                      deviceid: req.headers.deviceid
                    }
                  },
                  function(error, response, body) {
                    res.redirect(
                      appSetting.SystemConfiguration.APIBaseUrl +
                        appSetting.Payment.CancelUrl
                    );
                  }
                );
              }
            } else {
              //throw err;
              //res.send(ResponseDTO.TechnicalError());
              request.get(
                {
                  url:
                    appSetting.SystemConfiguration.APIBaseUrl +
                    appSetting.Payment.CancelUrl,
                  headers: {
                    "Content-Type": "text/html",
                    appid: req.headers.appid,
                    userid: req.headers.userid,
                    logintoken: req.headers.logintoken,
                    languageid: req.headers.languageid,
                    deviceid: req.headers.deviceid
                  }
                },
                function(error, response, body) {
                  res.redirect(
                    appSetting.SystemConfiguration.APIBaseUrl +
                      appSetting.Payment.CancelUrl
                  );
                }
              );
            }
          });


        }
      }
      else
      {
        log.info('PaymentDetailVerifyerr');

        request.get(
          {
            url:
              appSetting.SystemConfiguration.APIBaseUrl +
              appSetting.Payment.CancelUrl,
            headers: {
              "Content-Type": "text/html",
              appid: req.headers.appid,
              userid: req.headers.userid,
              logintoken: req.headers.logintoken,
              languageid: req.headers.languageid,
              deviceid: req.headers.deviceid
            }
          },
          function(error, response, body) {
            res.redirect(
              appSetting.SystemConfiguration.APIBaseUrl +
                appSetting.Payment.CancelUrl
            );
          }
        );        

      }
    });
   




  }
  
  router.get("/Response", (req, res) => {
    log.info("========================== API Response ============================")
    log.info("query : " + JSON.stringify(req.query))
    log.info("Request Url : " + JSON.stringify(req.originalUrl)) 
    var PaymentId = req.query.paymentid;
    log.info("Parameter : " + PaymentId)
    log.info("Request Headers : " + JSON.stringify(req.headers))



    var paymentDetails = new PaymentDetails({
      // _id : ObjectId(),
      user_Id: null,
      orderId: null,
      trackingId: null,
      bankRefNo: null,
      orderStatus: null,
      failureMessage: null,
      paymentMode: null,
      cardName: null,
      statusCode: null, //1 - Success, 0 - Fail
      statusMessage: null,
      price: null,
      paymentGetwayType: null, //constant.PaymentType.KNET 
      planId: null
    });




    if(req != null && req.query != null && req.query.result == "CAPTURED")
    {
        //Success Payment

        if(req.query.udf5 == 1) {
          paymentDetails.paymentGetwayType = constant.PaymentType.KNET;          
        } else if(req.query.udf5 == 2) {
          paymentDetails.paymentGetwayType = constant.PaymentType.VISACHECKOUT;          
        } 

        paymentDetails.user_Id = req.query.udf1,
        paymentDetails.planId = req.query.udf2,
        paymentDetails.statusCode = 1,  //1 - Success, 0 - Fail base on TransactionStatus == 2 means Success
        paymentDetails.statusMessage = "Transaction " + req.query.result, //(req.query.result == undefined) ? "" :  
        paymentDetails.orderId = (req.query.paymentid == undefined) ? null : req.query.paymentid, 
        paymentDetails.price = req.query.amt == undefined ? null : req.query.amt,  
        paymentDetails.trackingId = (req.query.trackid == undefined) ? null : req.query.trackid,  
        paymentDetails.bankRefNo = (req.query.ref == undefined) ? null : req.query.ref, 
        paymentDetails.paymentMode = "KNET", 
        paymentDetails.failureMessage = "Result : " + req.query.result + ", avr : " + req.query.avr + ", postdate : " + req.query.postdate + ", auth : " + req.query.auth + ", tranid : " + req.query.tranid + ", authRespCode : "+ req.query.authRespCode,
        paymentDetails.orderStatus = "SUCCESS", 
        paymentDetails.cardName = "",  
       
        
        log.info("\n");
        log.info("Payment Details   : " + JSON.stringify(paymentDetails));  
        //console.log(JSON.stringify(paymentDetails));
        log.info("======================= Start StorePaymentDetails() Function =======================");  
        log.info("\n");
        StorePaymentDetails(paymentDetails, req.query.udf3, req.query.udf4, req, res, req.query.udf5); 
        log.info("\n");
        log.info("======================= Stop StorePaymentDetails() Function =======================");  
        return; 
    }
    else
    {

      //Fail Payment

      var ErrorNo = '';
      var ErrorMassage = '';      

      if(req.query.Error != undefined && req.query.Error.trim() != "")
      {
        ErrorNo = ", Error No : " + req.query.Error;
      } 
 
      if(req.query.ErrorText != undefined && req.query.ErrorText.trim() != "" )
      {
          ErrorMassage = ", Error Massage : " + req.query.ErrorText;
      } 

      if(req.query.udf5 == 1) {
        paymentDetails.paymentGetwayType = constant.PaymentType.KNET;          
      } else if(req.query.udf5 == 2) {
        paymentDetails.paymentGetwayType = constant.PaymentType.VISACHECKOUT;          
      }

      paymentDetails.user_Id = req.query.udf1,
      paymentDetails.planId = req.query.udf2,
      paymentDetails.trackingId = req.query.trackid == undefined ? null : req.query.trackid,   
      paymentDetails.orderId = req.query.paymentid == undefined ? null : req.query.paymentid, 
      paymentDetails.price = req.query.amt == undefined ? null : req.query.amt,   
      paymentDetails.bankRefNo = req.query.ref == undefined ? null : req.query.ref, 
      paymentDetails.paymentMode = "KNET", 
      paymentDetails.failureMessage = "Result : " + req.query.result + ", avr : " + req.query.avr + ", postdate : " + req.query.postdate + ", auth : " + req.query.auth + ErrorNo + ErrorMassage,
      paymentDetails.statusCode = 0,  //1 - Success, 0 - Fail base on TransactionStatus == 2 means Success
      paymentDetails.orderStatus = "FAIL", 
      paymentDetails.cardName = "",  
      paymentDetails.statusMessage = "Transaction " + req.query.result, 
      

      log.info("\n -- ELSE --");
      //console.log(JSON.stringify(paymentDetails));
      log.info("Payment Details   : " + JSON.stringify(paymentDetails));  
      log.info("\n");
      //console.log(JSON.stringify(paymentDetails));
      log.info("======================= Start StorePaymentDetails() Function =======================");  
      log.info("\n");
      StorePaymentDetails(paymentDetails, req.query.udf3, req.query.udf4, req, res, req.query.udf5); 
      log.info("\n");
      log.info("======================= Stop StorePaymentDetails() Function =======================");  

      return; 

    }


   
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

    //       //console.log(JSON.parse(JSON.parse(JSON.stringify(TokenAPIbody))));
  
    //       //console.log(body);
    //       var TokenAPIDetails = JSON.parse(JSON.parse(JSON.stringify(TokenAPIbody))); 
    //       //console.log(TokenAPIDetails);
  
    //       //console.log(TokenAPIDetails.access_token);
    //       //console.log(TokenAPIDetails.token_type);
  
    //       if (!TokenAPIerror && TokenAPIDetails != undefined && TokenAPIDetails.access_token != undefined && TokenAPIDetails.token_type != undefined) 
    //       {
    //         log.info("\n");
    //         log.info("========================== Start Transaction API Call ==========================");
    //         log.info("Request URL   : " + appSetting.Payment.PaymentGatewayBaseURL + "/ApiInvoices/Transaction/" + PaymentId); 
    //         log.info("Header Authorization   : " + TokenAPIDetails.token_type + " " + TokenAPIDetails.access_token); 

    //           request.get(
    //             {
    //               url: appSetting.Payment.PaymentGatewayBaseURL + "/ApiInvoices/Transaction/" + PaymentId, 
    //               headers: {
    //                 "Content-Type": "application/json",
    //                 Authorization: TokenAPIDetails.token_type + " " + TokenAPIDetails.access_token
    //               }
    //             },
    //             function(PaymentResponseError, PaymentResponse, PaymentResponseBody) 
    //             {
    //               log.info("\n");
    //               log.info("========================== Response Of Transaction API ==========================");
    //               log.info("Error     : " + PaymentResponseError); 
    //               log.info("\n");
    //               log.info("Response  : " + JSON.stringify(PaymentResponse)); 
    //               log.info("\n");
    //               log.info("Body      : " + PaymentResponseBody);  

    //               // console.log("==== Token Done ========");  
    //               // console.log("URL : " + appSetting.Payment.PaymentGatewayBaseURL + "/ApiInvoices/Transaction/" + PaymentId); 
    //               // console.log("error : " + PaymentResponseError);
    //               // console.log("response : " + PaymentResponse);
    //               // console.log("body : " + PaymentResponseBody);
    
    //               if(!PaymentResponseError)
    //               {
    
                 
    //                 //  console.log(JSON.parse(JSON.stringify(PaymentResponse)));
    //                 var PaymentResponseBodyResult = JSON.parse(PaymentResponseBody); 
    //                 //console.log(JSON.parse(PaymentResponseBody));
    //                 log.info("\n");
    //                 log.info("Body With Parse Data   : ");  
    //                 log.info(PaymentResponseBodyResult);  

    //                 if(PaymentResponseBodyResult != null && PaymentResponseBodyResult.TransactionStatus == 2)
    //                 {
    //                     //Success Payment
 
    //                     paymentDetails.user_Id = PaymentResponseBodyResult.ApiCustomFileds,
    //                     paymentDetails.orderId = PaymentResponseBodyResult.OrderId,
    //                     paymentDetails.price = PaymentResponseBodyResult.InvoiceValue, 
    //                     paymentDetails.trackingId = PaymentResponseBodyResult.TransactionId,  
    //                     paymentDetails.bankRefNo = PaymentResponseBodyResult.ReferenceId,
    //                     paymentDetails.paymentMode = PaymentResponseBodyResult.PaymentGateway,
    //                     paymentDetails.failureMessage = "Transaction Status Code : " + PaymentResponseBodyResult.TransactionStatus + ", Message : " + PaymentResponseBodyResult.Error,
    //                     paymentDetails.paymentGetwayType = constant.PaymentType.MyFatoorah, 
    //                     paymentDetails.statusCode = 1,  //1 - Success, 0 - Fail base on TransactionStatus == 2 means Success
    //                     //TransactionStatus Code
    //                     //NEW
    //                     // 1 Unpaid
    //                     // 2 Paid
    //                     // 3 Payment Failure

    //                     //May be OLD
    //                     // 0	Transaction Approved	XXX.000
    //                     // 1	Transaction could not processed	XXX.010
    //                     // 2	Transaction declined - contact issuing bank	XXX.005
    //                     // 3	No reply from the Processing Host	XXX.068
    //                     // 4	Card has expired	XXX.033
    //                     // 5	Insufficient credit	XXX.051

    //                     paymentDetails.orderStatus = "SUCCESS", 
    //                     paymentDetails.cardName = "",  
    //                     paymentDetails.statusMessage = PaymentResponseBodyResult.Error,
                        
    //                     log.info("\n");
    //                     log.info("Payment Details   : " + JSON.stringify(paymentDetails));  
    //                     //console.log(JSON.stringify(paymentDetails));
    //                     log.info("======================= Start StorePaymentDetails() Function =======================");  
    //                     log.info("\n");
    //                     StorePaymentDetails(paymentDetails, req, res); 
    //                     log.info("\n");
    //                     log.info("======================= Stop StorePaymentDetails() Function =======================");  
    //                     return; 
    //                 }
    //                 else
    //                 {

    //                   //Fail Payment

    //                   paymentDetails.user_Id = PaymentResponseBodyResult.ApiCustomFileds,
    //                   paymentDetails.orderId = PaymentResponseBodyResult.OrderId,
    //                   paymentDetails.price = PaymentResponseBodyResult.InvoiceValue, 
    //                   paymentDetails.trackingId = PaymentResponseBodyResult.TransactionId,  
    //                   paymentDetails.bankRefNo = PaymentResponseBodyResult.ReferenceId,
    //                   paymentDetails.paymentMode = PaymentResponseBodyResult.PaymentGateway,
    //                   paymentDetails.failureMessage = "Transaction Status Code : " + PaymentResponseBodyResult.TransactionStatus + ", Message : " + PaymentResponseBodyResult.Error,
    //                   paymentDetails.paymentGetwayType = constant.PaymentType.MyFatoorah, 
    //                   paymentDetails.statusCode = 0,  //1 - Success, 0 - Fail base on TransactionStatus == 2 means Success
    //                   paymentDetails.orderStatus = "FAIL", 
    //                   paymentDetails.cardName = "",  
    //                   paymentDetails.statusMessage = PaymentResponseBodyResult.Error,

    //                   log.info("\n");
    //                   //console.log(JSON.stringify(paymentDetails));
    //                   log.info("Payment Details   : " + JSON.stringify(paymentDetails));  
    //                   log.info("\n");
    //                   //console.log(JSON.stringify(paymentDetails));
    //                   log.info("======================= Start StorePaymentDetails() Function =======================");  
    //                   log.info("\n");
    //                   StorePaymentDetails(paymentDetails, req, res); 
    //                   log.info("\n");
    //                   log.info("======================= Stop StorePaymentDetails() Function =======================");  

    //                   return; 

    //                 }
    //               }
    //               else
    //               {
    //                 // technical error
    //                 log.info("\n");
    //                 log.info("========================== Error In Transaction API ==========================");
    //                 if(PaymentResponseError != undefined) 
    //                 {
    //                   log.info("\n");
    //                   log.info("Error     : " + JSON.stringify(PaymentResponseError)); 
    //                 }
    //                 if(PaymentResponse != undefined)
    //                 {
    //                   log.info("\n");
    //                   log.info("Response  : " + JSON.stringify(PaymentResponse)); 
    //                 }
    //                 if(PaymentResponseBody != undefined)
    //                 {
    //                   log.info("\n");
    //                   log.info("Body      : " + JSON.stringify(PaymentResponseBody));  
    //                 } 
    
    //                 res.redirect(appSetting.SystemConfiguration.APIBaseUrl + appSetting.Payment.CancelUrl);
    
    //               }                  
  
    //             }
    //           );
    //       }
    //       else
    //       {
    //         log.info("\n");
    //         log.info("========================== Call Back URL : Error In Token API ==========================");
    //         if(TokenAPIerror != undefined) 
    //         {
    //           log.info("\n");
    //           log.info("Error     : " + JSON.stringify(TokenAPIerror)); 
    //         }
    //         if(TokenAPIresponse != undefined)
    //         {
    //           log.info("\n");
    //           log.info("Response  : " + JSON.stringify(TokenAPIresponse)); 
    //         }
    //         if(TokenAPIbody != undefined)
    //         {
    //           log.info("\n");
    //           log.info("Body      : " + JSON.stringify(TokenAPIbody));  
    //         } 
    
    //         res.redirect(appSetting.SystemConfiguration.APIBaseUrl + appSetting.Payment.CancelUrl); 
    //       }
    //     }
    //     else
    //     {
    //       log.info("\n");
    //       log.info("========================== Call Back URL : Error In Token API ==========================");
    //       if(TokenAPIerror != undefined) 
    //       {
    //         log.info("\n");
    //         log.info("Error     : " + JSON.stringify(TokenAPIerror)); 
    //       }
    //       if(TokenAPIresponse != undefined)
    //       {
    //         log.info("\n");
    //         log.info("Response  : " + JSON.stringify(TokenAPIresponse)); 
    //       }
    //       if(TokenAPIbody != undefined)
    //       {
    //         log.info("\n");
    //         log.info("Body      : " + JSON.stringify(TokenAPIbody));  
    //       } 
  
    //       res.redirect(appSetting.SystemConfiguration.APIBaseUrl + appSetting.Payment.CancelUrl); 
    //     }
    //   });
  });


module.exports = router;
