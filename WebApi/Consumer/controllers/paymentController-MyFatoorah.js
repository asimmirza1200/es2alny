const { PaymentRequestXml } = require("./PaymentRequestXml");

var appSetting = require("../appsetting");
const express = require("express");
//const path = require('path');
var router = express.Router();
var ObjectId = require("mongoose").Types.ObjectId;

var constant = require("../../../CommonUtility/constant");
// constant.SUMMER.BEGINNING
var { Feedback } = require("../models/entity");
var { UserMaster, CreditPlans, PaymentDetails, UserPurchases, DeviceTokenMasters } = require("../models/entity");
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

  console.log("User Id       : " + userId);
  console.log("Plan Id       : " + planId);
  console.log("Price         : " + price);
  console.log("User Name     : " + userName);
  console.log("Email Address : " + emailAddress);
  console.log("Mobile No     : " + mobileNo);

 
  // log.info("payment Request Xml : " + JSON.stringify(paymentReqXml));
  //   res.send(ResponseDTO.InvalidParameter());
  // res.send(paymentReqXml);
  log.info("\n");
  log.info("========================== Start Token API Call =========================="); 
  log.info("URL   : " + appSetting.Payment.PaymentGatewayBaseURL + "/Token"); 
  log.info("Body  : " + "grant_type=password&username=" + appSetting.Payment.UserName + "&password=" + appSetting.Payment.Password); 
    request(
    {
      url: appSetting.Payment.PaymentGatewayBaseURL + "/Token",
      method: 'POST',
      headers: { "Content-Type": "application/json" },
      body: "grant_type=password&username=" + appSetting.Payment.UserName + "&password=" + appSetting.Payment.Password
    },
    function(TokenAPIerror, TokenAPIresponse, TokenAPIbody) {
      log.info("\n");
      if(!TokenAPIerror)
      {  
        log.info("\n");
        log.info("========================== Response Of Token API =========================="); 
        log.info("Error     : " + JSON.stringify(TokenAPIerror)); 
        log.info("\n");
        log.info("Response  : " + JSON.stringify(TokenAPIresponse)); 
        log.info("\n");
        log.info("Body      : " + TokenAPIbody);  

        var TokenAPIDetails = JSON.parse(JSON.parse(JSON.stringify(TokenAPIbody))); 
        //console.log(TokenAPIDetails);
        // log.info("Body With Parse Data   : " );  
        // log.info(TokenAPIDetails);  
        

        //  console.log(TokenAPIDetails.access_token);
        //  console.log(TokenAPIDetails.token_type);
        //  console.log(TokenAPIDetails.body);
      

        // console.log(JSON.stringify(response));
        // JSON.parse(JSON.stringify(response));
        // JSON.parse(JSON.stringify(response.statusCode));
        // //console.log("body : " + body);
        // console.log(JSON.stringify(response.statusCode));
        // console.log("access_token : " + response.access_token);
        // console.log("token_type : " + response.token_type); 

        if (!TokenAPIerror && TokenAPIDetails != undefined && TokenAPIDetails.access_token != undefined && TokenAPIDetails.token_type != undefined) {
            
            log.info("\n");
            log.info("========================== Start Create Invoice Iso API Call ==========================");
            log.info("Request URL   : " + appSetting.Payment.PaymentGatewayBaseURL + "/ApiInvoices/CreateInvoiceIso"); 
    
            var RequestBody = new Object ({
              "InvoiceValue": price,
              "CustomerName": userName,
              "CustomerBlock": "",
              "CustomerStreet": "",
              "CustomerHouseBuildingNo": "",
              "CustomerCivilId": "",
              "CustomerAddress": "",
              "CustomerReference": "",
              "DisplayCurrencyIsoAlpha": "KWD",
              "CountryCodeId": 965,
              "CustomerMobile": mobileNo,
              "CustomerEmail": emailAddress,
              "SendInvoiceOption": 4, 
                //  SendInvoiceOption : 
                // 1 - Generate Invoice and Send link by SMS to the customer's phone.
                // 2 - Generate Invoice and Send link by Email to the customer's email.
                // 3 - Generate Invoice and Send link by both SMS & Email.
                // 4 - Generate Invoice Link only.

              "InvoiceItemsCreate": 
              [
                {
                  "ProductId": null,
                  "ProductName": "ESALNY Plan Purchase",
                  "Quantity": 1,
                  "UnitPrice": price
                }
              ],
              "CallBackUrl": appSetting.SystemConfiguration.APIBaseUrl + "payment/Response/",
              "Language": languageid,
              "ExpireDate": "",
              "ApiCustomFileds": userId,
              "ErrorUrl": appSetting.SystemConfiguration.APIBaseUrl + "payment/Response/"
            });
   
            log.info("\n");
            // log.info("Request Body : " +  JSON.stringify(RequestBody));
            log.info("Request Body  : " + JSON.stringify(RequestBody));   
            log.info("\n"); 
            log.info("Headers Authorization  : " + TokenAPIDetails.token_type + " " + TokenAPIDetails.access_token); 
            // console.log("RequestBody : " +  JSON.stringify(RequestBody)); 
            // console.log("PaymentGatewayBaseURL : " + appSetting.Payment.PaymentGatewayBaseURL); 

            request.post({
              url: appSetting.Payment.PaymentGatewayBaseURL + "/ApiInvoices/CreateInvoiceIso",
              body: JSON.stringify(RequestBody),
              headers: {
                "Content-Type": "application/json",
                Authorization: TokenAPIDetails.token_type + " " + TokenAPIDetails.access_token
            }},
            function(PaymentRequesterror, PaymentRequestresponse, PaymentRequestbody) {
              log.info("\n");
              log.info("========================== Response Of Create Invoice Iso API ==========================");
 
              log.info("Error     : " + PaymentRequesterror); 
              log.info("\n");
              log.info("Response  : " + JSON.stringify(PaymentRequestresponse)); 
              log.info("\n");
              log.info("Body      : " + PaymentRequestbody);  
              log.info("\n");

              // console.log("==== Token Done ========"); 
              // console.log("error : " + PaymentRequesterror);
              // console.log("response : " + PaymentRequestresponse);
              // console.log("body : " + PaymentRequestbody);

              if(!PaymentRequesterror)
              { 
               
              //  console.log(JSON.parse(JSON.stringify(PaymentRequestresponse)));
                var PaymentRequestBodyResult = JSON.parse(PaymentRequestbody); 

                log.info("Body With Parse Data   : ");  
                log.info(PaymentRequestBodyResult);  
                //console.log(PaymentRequestBodyResult);


                if(PaymentRequestBodyResult != null && PaymentRequestBodyResult.IsSuccess == true)
                {
                  log.info("\n");
                  log.info("IsSuccess   : " + true);  
                  log.info("\n");
                  log.info("Payment Redirect Url   : " + PaymentRequestBodyResult.RedirectUrl);  
                  console.log(PaymentRequestBodyResult.RedirectUrl);
                  res.redirect(PaymentRequestBodyResult.RedirectUrl);
                  return; 
                }
                else
                {
                  log.info("\n");
                  log.info("IsSuccess   : " + false);   
                  res.redirect(appSetting.SystemConfiguration.APIBaseUrl + appSetting.Payment.CancelUrl);
                }
              }
              else
              {
                // technical error
                log.info("\n");
                log.info("========================== Error In Create Invoice Iso API ==========================");
                if(PaymentRequesterror != undefined) 
                { 
                  log.info("\n");
                  log.info("Error     : " + JSON.stringify(PaymentRequesterror)); 
                }
                if(PaymentRequestresponse != undefined)
                {
                  log.info("\n");
                  log.info("Response  : " + JSON.stringify(PaymentRequestresponse)); 
                }
                if(PaymentRequestbody != undefined)
                {
                  log.info("\n");
                  log.info("Body      : " + JSON.stringify(PaymentRequestbody));  
                } 

                res.redirect(appSetting.SystemConfiguration.APIBaseUrl + appSetting.Payment.CancelUrl);

                // request.get({ url: appSetting.SystemConfiguration.APIBaseUrl +  appSetting.Payment.CancelUrl }, function(error, response, body) {
                //   res.redirect(appSetting.SystemConfiguration.APIBaseUrl + appSetting.Payment.CancelUrl);
                // });
 
              } 

            });
        }
        else
        {
          //Invalid Token or cradantial
          log.info("111 \n ");
          log.info("========================== Error In Token API ==========================");
          if(TokenAPIerror != undefined) 
          {
            log.info("\n");
            log.info("Error     : " + JSON.stringify(TokenAPIerror)); 
          }
          if(TokenAPIresponse != undefined)
          {
            log.info("\n");
            log.info("Response  : " + JSON.stringify(TokenAPIresponse)); 
          }
          if(TokenAPIbody != undefined)
          {
            log.info("\n");
            log.info("Body      : " + JSON.stringify(TokenAPIbody));  
          } 

          res.redirect(appSetting.SystemConfiguration.APIBaseUrl + appSetting.Payment.CancelUrl);
    
        }
  
      }
      else
      {
        log.info("\n");
        log.info("========================== Error In Token API ==========================");
        if(TokenAPIerror != undefined) 
        {
          log.info("\n");
          log.info("Error     : " + JSON.stringify(TokenAPIerror)); 
        }
        if(TokenAPIresponse != undefined)
        {
          log.info("\n");
          log.info("Response  : " + JSON.stringify(TokenAPIresponse)); 
        }
        if(TokenAPIbody != undefined)
        {
          log.info("\n");
          log.info("Body      : " + JSON.stringify(TokenAPIbody));  
        } 

        res.redirect(appSetting.SystemConfiguration.APIBaseUrl + appSetting.Payment.CancelUrl); 

      }
  
    }
  ); 

 
}
 

// Get Purchase Plan List
router.get("/PurchasePlan", (req, res) => {

  console.log(req.query);
  console.log(req.query.userId);
  console.log(req.query.planId);
  
  
  // if (!ObjectId.isValid(req.query.userId + "")) {
  //   return Promise.reject(new TypeError(`Invalid id: ${req.query.userId+""}`));
  // }
  
  
    if (req.query.userId == undefined || req.query.planId == undefined) {
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
                        console.log(req.headers.languageid);
                        console.log(constant.Language.English);
                        console.log(req.headers.languageid == constant.Language.English);
                        var languageid = 1;
                        if(req.headers.languageid == constant.Language.English)
                        {
                          languageid = 2;
                        }
                        else if(req.headers.languageid == constant.Language.Arabic)
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
  function StorePaymentDetails(PD, req, res) {
    var paymentDetails = new PaymentDetails({
      // _id : ObjectId(),
      user_Id: ObjectId(PD.user_Id),
      orderId: PD.orderId,
      trackingId: PD.trackingId,
      bankRefNo: PD.bankRefNo,
      orderStatus: PD.orderStatus,
      failureMessage: PD.failureMessage,
      paymentMode: PD.paymentMode,
      cardName: PD.cardName,
      statusCode: PD.statusCode, //1 - Success, 0 - Fail
      statusMessage: PD.statusMessage,
      price: PD.price,
      paymentGetwayType: constant.PaymentType.MyFatoorah,
      isActive: true,
      isDeleted: false,
      createdBy: ObjectId(PD.user_Id),
      createdDateTime: new Date(),
      updatedBy: null,
      updatedDateTime: null,
      //planId: ""
    });
  
  
    log.info("===================== Store Payment Details In Database =====================");
  
    log.info("Payment Details : " + JSON.stringify(paymentDetails));
  
   
    paymentDetails.save((err, paymentDetailsDoc) => {
      if (!err) {
        if (!paymentDetailsDoc.length) {
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
  
          if(paymentDetails.statusCode == 1)
          {
              userPurchases.save((err, userPurchasesDoc) => {
              if (!err) {
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
                  DeviceTokenMasters.aggregate(pipeline, async (err,  UserTokens) =>
                  {    
                      if(!err)
                      { 
                          console.log(UserTokens); 
                          Helper.SendPushNotification(UserTokens); 
                          
                          request.get(
                            {
                              url:
                                  appSetting.SystemConfiguration.APIBaseUrl +
                                  appSetting.Payment.SuccessUrl,
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
                              res.redirect(appSetting.SystemConfiguration.APIBaseUrl + appSetting.Payment.SuccessUrl);
                            }
                        );
  
                      }
                      else
                      {
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
  
  router.get("/Response", (req, res) => {
    log.info("========================== API Response ============================")
    log.info("query : " + JSON.stringify(req.query))
    log.info("Request Url : " + JSON.stringify(req.originalUrl)) 
    var PaymentId = req.query.Id;
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
      paymentGetwayType: constant.PaymentType.MyFatoorah, 
      planId: ""
    });
   
    request.post(
      {
        url: appSetting.Payment.PaymentGatewayBaseURL + "/Token",
        body: "grant_type=password&username=" + appSetting.Payment.UserName + "&password=" + appSetting.Payment.Password
      },
      function(TokenAPIerror, TokenAPIresponse, TokenAPIbody) {
        if(!TokenAPIerror)
        {

          log.info("\n");
          log.info("========================== Response Of Token API =========================="); 
          log.info("Error     : " + JSON.stringify(TokenAPIerror)); 
          log.info("\n");
          log.info("Response  : " + JSON.stringify(TokenAPIresponse)); 
          log.info("\n");
          log.info("Body      : " + TokenAPIbody);  

          //console.log(JSON.parse(JSON.parse(JSON.stringify(TokenAPIbody))));
  
          //console.log(body);
          var TokenAPIDetails = JSON.parse(JSON.parse(JSON.stringify(TokenAPIbody))); 
          //console.log(TokenAPIDetails);
  
          //console.log(TokenAPIDetails.access_token);
          //console.log(TokenAPIDetails.token_type);
  
          if (!TokenAPIerror && TokenAPIDetails != undefined && TokenAPIDetails.access_token != undefined && TokenAPIDetails.token_type != undefined) 
          {
            log.info("\n");
            log.info("========================== Start Transaction API Call ==========================");
            log.info("Request URL   : " + appSetting.Payment.PaymentGatewayBaseURL + "/ApiInvoices/Transaction/" + PaymentId); 
            log.info("Header Authorization   : " + TokenAPIDetails.token_type + " " + TokenAPIDetails.access_token); 

              request.get(
                {
                  url: appSetting.Payment.PaymentGatewayBaseURL + "/ApiInvoices/Transaction/" + PaymentId, 
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: TokenAPIDetails.token_type + " " + TokenAPIDetails.access_token
                  }
                },
                function(PaymentResponseError, PaymentResponse, PaymentResponseBody) 
                {
                  log.info("\n");
                  log.info("========================== Response Of Transaction API ==========================");
                  log.info("Error     : " + PaymentResponseError); 
                  log.info("\n");
                  log.info("Response  : " + JSON.stringify(PaymentResponse)); 
                  log.info("\n");
                  log.info("Body      : " + PaymentResponseBody);  

                  // console.log("==== Token Done ========");  
                  // console.log("URL : " + appSetting.Payment.PaymentGatewayBaseURL + "/ApiInvoices/Transaction/" + PaymentId); 
                  // console.log("error : " + PaymentResponseError);
                  // console.log("response : " + PaymentResponse);
                  // console.log("body : " + PaymentResponseBody);
    
                  if(!PaymentResponseError)
                  {
    
                 
                    //  console.log(JSON.parse(JSON.stringify(PaymentResponse)));
                    var PaymentResponseBodyResult = JSON.parse(PaymentResponseBody); 
                    //console.log(JSON.parse(PaymentResponseBody));
                    log.info("\n");
                    log.info("Body With Parse Data   : ");  
                    log.info(PaymentResponseBodyResult);  

                    if(PaymentResponseBodyResult != null && PaymentResponseBodyResult.TransactionStatus == 2)
                    {
                        //Success Payment
 
                        paymentDetails.user_Id = PaymentResponseBodyResult.ApiCustomFileds,
                        paymentDetails.orderId = PaymentResponseBodyResult.OrderId,
                        paymentDetails.price = PaymentResponseBodyResult.InvoiceValue, 
                        paymentDetails.trackingId = PaymentResponseBodyResult.TransactionId,  
                        paymentDetails.bankRefNo = PaymentResponseBodyResult.ReferenceId,
                        paymentDetails.paymentMode = PaymentResponseBodyResult.PaymentGateway,
                        paymentDetails.failureMessage = "Transaction Status Code : " + PaymentResponseBodyResult.TransactionStatus + ", Message : " + PaymentResponseBodyResult.Error,
                        paymentDetails.paymentGetwayType = constant.PaymentType.MyFatoorah, 
                        paymentDetails.statusCode = 1,  //1 - Success, 0 - Fail base on TransactionStatus == 2 means Success
                        //TransactionStatus Code
                        //NEW
                        // 1 Unpaid
                        // 2 Paid
                        // 3 Payment Failure

                        //May be OLD
                        // 0	Transaction Approved	XXX.000
                        // 1	Transaction could not processed	XXX.010
                        // 2	Transaction declined - contact issuing bank	XXX.005
                        // 3	No reply from the Processing Host	XXX.068
                        // 4	Card has expired	XXX.033
                        // 5	Insufficient credit	XXX.051

                        paymentDetails.orderStatus = "SUCCESS", 
                        paymentDetails.cardName = "",  
                        paymentDetails.statusMessage = PaymentResponseBodyResult.Error,
                        
                        log.info("\n");
                        log.info("Payment Details   : " + JSON.stringify(paymentDetails));  
                        //console.log(JSON.stringify(paymentDetails));
                        log.info("======================= Start StorePaymentDetails() Function =======================");  
                        log.info("\n");
                        StorePaymentDetails(paymentDetails, req, res); 
                        log.info("\n");
                        log.info("======================= Stop StorePaymentDetails() Function =======================");  
                        return; 
                    }
                    else
                    {

                      //Fail Payment

                      paymentDetails.user_Id = PaymentResponseBodyResult.ApiCustomFileds,
                      paymentDetails.orderId = PaymentResponseBodyResult.OrderId,
                      paymentDetails.price = PaymentResponseBodyResult.InvoiceValue, 
                      paymentDetails.trackingId = PaymentResponseBodyResult.TransactionId,  
                      paymentDetails.bankRefNo = PaymentResponseBodyResult.ReferenceId,
                      paymentDetails.paymentMode = PaymentResponseBodyResult.PaymentGateway,
                      paymentDetails.failureMessage = "Transaction Status Code : " + PaymentResponseBodyResult.TransactionStatus + ", Message : " + PaymentResponseBodyResult.Error,
                      paymentDetails.paymentGetwayType = constant.PaymentType.MyFatoorah, 
                      paymentDetails.statusCode = 0,  //1 - Success, 0 - Fail base on TransactionStatus == 2 means Success
                      paymentDetails.orderStatus = "FAIL", 
                      paymentDetails.cardName = "",  
                      paymentDetails.statusMessage = PaymentResponseBodyResult.Error,

                      log.info("\n");
                      //console.log(JSON.stringify(paymentDetails));
                      log.info("Payment Details   : " + JSON.stringify(paymentDetails));  
                      log.info("\n");
                      //console.log(JSON.stringify(paymentDetails));
                      log.info("======================= Start StorePaymentDetails() Function =======================");  
                      log.info("\n");
                      StorePaymentDetails(paymentDetails, req, res); 
                      log.info("\n");
                      log.info("======================= Stop StorePaymentDetails() Function =======================");  

                      return; 

                    }
                  }
                  else
                  {
                    // technical error
                    log.info("\n");
                    log.info("========================== Error In Transaction API ==========================");
                    if(PaymentResponseError != undefined) 
                    {
                      log.info("\n");
                      log.info("Error     : " + JSON.stringify(PaymentResponseError)); 
                    }
                    if(PaymentResponse != undefined)
                    {
                      log.info("\n");
                      log.info("Response  : " + JSON.stringify(PaymentResponse)); 
                    }
                    if(PaymentResponseBody != undefined)
                    {
                      log.info("\n");
                      log.info("Body      : " + JSON.stringify(PaymentResponseBody));  
                    } 
    
                    res.redirect(appSetting.SystemConfiguration.APIBaseUrl + appSetting.Payment.CancelUrl);
    
                  }                  
  
                }
              );
          }
          else
          {
            log.info("\n");
            log.info("========================== Call Back URL : Error In Token API ==========================");
            if(TokenAPIerror != undefined) 
            {
              log.info("\n");
              log.info("Error     : " + JSON.stringify(TokenAPIerror)); 
            }
            if(TokenAPIresponse != undefined)
            {
              log.info("\n");
              log.info("Response  : " + JSON.stringify(TokenAPIresponse)); 
            }
            if(TokenAPIbody != undefined)
            {
              log.info("\n");
              log.info("Body      : " + JSON.stringify(TokenAPIbody));  
            } 
    
            res.redirect(appSetting.SystemConfiguration.APIBaseUrl + appSetting.Payment.CancelUrl); 
          }
        }
        else
        {
          log.info("\n");
          log.info("========================== Call Back URL : Error In Token API ==========================");
          if(TokenAPIerror != undefined) 
          {
            log.info("\n");
            log.info("Error     : " + JSON.stringify(TokenAPIerror)); 
          }
          if(TokenAPIresponse != undefined)
          {
            log.info("\n");
            log.info("Response  : " + JSON.stringify(TokenAPIresponse)); 
          }
          if(TokenAPIbody != undefined)
          {
            log.info("\n");
            log.info("Body      : " + JSON.stringify(TokenAPIbody));  
          } 
  
          res.redirect(appSetting.SystemConfiguration.APIBaseUrl + appSetting.Payment.CancelUrl); 
        }
      });
  });
module.exports = router;
