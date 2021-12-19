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

function PaymentResonseXml(RefId) {
  var resreqstring = "<?xml version='1.0' encoding='utf-8'?>";
      resreqstring += "<soap:Envelope xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance' xmlns:xsd='http://www.w3.org/2001/XMLSchema' xmlns:soap='http://schemas.xmlsoap.org/soap/envelope/'>";
      resreqstring += "<soap:Body>";
      resreqstring += "<GetOrderStatusRequest xmlns='http://tempuri.org/'>";
      resreqstring += "<getOrderStatusRequestDC>";
      resreqstring += "<merchant_code>" + appSetting.Payment.PaymentGatewayAPIMerchantCode + "</merchant_code>";
      resreqstring += "<merchant_username>" + appSetting.Payment.PaymentGatewayAPIMerchantUsername + "</merchant_username>";
      resreqstring += "<merchant_password>" + appSetting.Payment.PaymentGatewayAPIMerchantPassword + "</merchant_password>";
      resreqstring += "<referenceID>" + RefId + "</referenceID>";
      resreqstring += "</getOrderStatusRequestDC>";
      resreqstring += "</GetOrderStatusRequest>";
      resreqstring += "</soap:Body>";
      resreqstring += "</soap:Envelope>";
  return resreqstring;
}

// Payment Cancel URL
router.get("/cancel", function(req, res) {
  res.sendFile(appSetting.SystemConfiguration.ViewPath + "payment/cancel.html");
});

// Payment Success URL
router.get("/success", function(req, res) {
  res.sendFile(appSetting.SystemConfiguration.ViewPath + "payment/success.html");
});

async function PaymentRequest(userId, planId, price, userName, emailAddress, mobileNo, req, res ) 
{
  //Write Payment Code
  log.info("\n\n\n");
  log.info("==========================New API Request==========================");
 
  log.info("userId : " + userId);
  log.info("planId : " + planId);
  log.info("price : " + price);
  log.info("userName : " + userName);
  log.info("emailAddress : " + emailAddress);
  log.info("mobileNo : " + mobileNo);


  //console.log(req.headers);
  log.info("originalUrl");
  //console.log(Object.assign(req.originalUrl , "-" ,JSON.stringify(req.body).toString() , "-",JSON.stringify(req.headers).toString()));
  log.info("Request Url : " + JSON.stringify(req.originalUrl));
  log.info("BodyRequest : " + JSON.stringify(req.body));
  log.info("Request Headers : " + JSON.stringify(req.headers));

  var paymentReqXml = PaymentRequestXml(userName, emailAddress, mobileNo, price, userId );
  
  log.info("payment Request Xml : " + JSON.stringify(paymentReqXml));
  //   res.send(ResponseDTO.InvalidParameter());
  // res.send(paymentReqXml);
  log.info("\n");
  log.info("==========================Request forwarded to Payment Gateway==========================");
  log.info("xml request will be sent"); 
  request.post(
    {
      url: appSetting.Payment.PaymentGatewayAPIURL,
      body: paymentReqXml,
      headers: {
        "Content-Type": "text/xml;charset=utf-8",
        appid: req.headers.appid,
        userid: req.headers.userid,
        logintoken: req.headers.logintoken,
        languageid: req.headers.languageid,
        deviceid: req.headers.deviceid
      }
    },
    function(error, response, body) {
      if (!error && response.statusCode == 200) {
        log.info("Status Code : " + response.statusCode);
        var document = new xmldoc.XmlDocument(body);
        log.info("document : " + document) 
        log.info("Bdoy Request for payment request in xml : " + response.body)  
        if (document.descendantWithPath("soap:Body.PaymentRequestResponse") != undefined) 
        {
          paymentRequest = document.descendantWithPath("soap:Body.PaymentRequestResponse");
          log.info("paymentRequest : " + paymentRequest) 
          if (paymentRequest.descendantWithPath("PaymentRequestResult") != undefined ) 
          {
            log.info("PaymentRequestResult element found ");
            if (paymentRequest.descendantWithPath("PaymentRequestResult.ResponseCode").val == 0) 
            {
              log.info("PaymentRequestResult.ResponseCode : 0");
              console.log(paymentRequest.descendantWithPath("PaymentRequestResult.paymentURL").val);
              log.info("Redirect to Payment Gateway...") 
              log.info("payment Url " + paymentRequest.descendantWithPath("PaymentRequestResult.paymentURL").val)
              res.redirect(paymentRequest.descendantWithPath("PaymentRequestResult.paymentURL").val);
            } 
            else 
            {
              log.info("Fault code found 1") 
              if (xmldocument.descendantWithPath("soap:Body.soap:Fault.faultcode").val != undefined) 
              {
                log.info("xmldocument : "+ xmldocument) 
                var faultcode = xmldocument.descendantWithPath("soap:Body.soap:Fault.faultcode").val;
                log.info("Faultcode : "+ faultcode) 
                var faultstring = xmldocument.descendantWithPath("soap:Body.soap:Fault.faultstring").val;
                log.info("faultstring : "+ faultstring) 
              }
              
              log.info("Redirect to Cancel page...") 
              request.get(
                {
                  url: appSetting.SystemConfiguration.APIBaseUrl + appSetting.Payment.CancelUrl,
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
                  res.redirect(appSetting.SystemConfiguration.APIBaseUrl + appSetting.Payment.CancelUrl);
                }
              );
              log.info("3");
            }
          }
        } 
        else 
        {
          log.info("Fault code found 2") 
          if (xmldocument.descendantWithPath("soap:Body.soap:Fault.faultcode").val != undefined) 
          {
            log.info("xmldocument : "+ xmldocument) 
            var faultcode = xmldocument.descendantWithPath("soap:Body.soap:Fault.faultcode").val;
            log.info("Faultcode : "+ faultcode) 
            var faultstring = xmldocument.descendantWithPath("soap:Body.soap:Fault.faultstring").val;
            log.info("faultstring : "+ faultstring) 
            // error messsge log pending
            log.info("4");
          }
          log.info("Redirect to Cancel page..") 
          request.get(
            {
              url: appSetting.SystemConfiguration.APIBaseUrl + appSetting.Payment.CancelUrl,
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
              res.redirect(appSetting.SystemConfiguration.APIBaseUrl + appSetting.Payment.CancelUrl);
            }
          );
        }
        log.info("here 2");
        //if(document.body)
        // res.send(document.descendantWithPath("PaymentRequestResponse"));
      } 
      else 
      {
        request.get(
          {
            url: appSetting.SystemConfiguration.APIBaseUrl + appSetting.Payment.CancelUrl,
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
            res.redirect(appSetting.SystemConfiguration.APIBaseUrl + appSetting.Payment.CancelUrl);
          }
        );
        log.info("5");
      }

      log.info("6");
    }
  );
  log.info("7");

  //Write Payment Code

  //res.send(ResponseDTO.ErrorMassage(constant.ErrorCode.PaymentRequestSuccessfully, constant.ErrorMsg.PaymentRequestSuccessfully, {} ));
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
    UserMaster.find({ _id: ObjectId(req.query.userId), isActive: true, isDeleted: false }, (err, userMasterDoc) => {
        if (!err) {
          //console.log(userMasterDoc);
          //Add Cancel URL and Success URL
          if (userMasterDoc.length == 1) {
            CreditPlans.find( { _id: ObjectId(req.query.planId), isActive: true, isDeleted: false }, (err, creditPlanDoc) => {
                if (!err) {
                  //console.log(creditPlanDoc);
                  //Add Cancel URL and Success URL
                  if (creditPlanDoc.length == 1) {
                    //creditPlanDoc
                    //userMasterDoc
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
                      PaymentRequest(req.query.userId, req.query.planId, creditPlanDoc[0].price, userName, emailAddress, userMasterDoc[0].mobileNo, req, res );
                    } else 
                    {
                      res.send(ResponseDTO.TechnicalError());
                    }
                    //res.send(ResponseDTO.ErrorMassage(constant.ErrorCode.DataRetrievedSuccessfully, constant.ErrorMsg.DataRetrievedSuccessfully, userMasterDoc ));
                  } else {
                    //Many Users or not found User
                    res.send(
                      ResponseDTO.ErrorMassage(
                        constant.ErrorCode.InvalidPlanId,
                        constant.ErrorMsg.InvalidPlanId,
                        {}
                      )
                    );
                  }
                } else {
                  res.send(ResponseDTO.TechnicalError());
                }
              }
            );
          } else {
            //Many Users or not found User
            res.send(
              ResponseDTO.ErrorMassage(
                constant.ErrorCode.InvalidUserId,
                constant.ErrorMsg.InvalidUserId,
                {}
              )
            );
          }
        } else {
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
  log.info("Parameter : " + JSON.stringify(req.query.id))
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

  log.info("\n");

 
  var paymentResXml = PaymentResonseXml(req.query.id);
  log.info("xml payment Response Request : " + paymentResXml)
 

  
  log.info("Request Url : " + JSON.stringify(appSetting.Payment.PaymentGatewayAPIURL)+ "\n")
  log.info("Payment Res Xml : " + JSON.stringify(paymentResXml)+ "\n")
  log.info("Request Headers : " + JSON.stringify(req.headers)+ "\n")

  request.post(
    {
      url: appSetting.Payment.PaymentGatewayAPIURL,
      body: paymentResXml,
      headers: {
        "Content-Type": "text/xml;charset=utf-8",
        appid: req.headers.appid,
        userid: req.headers.userid,
        logintoken: req.headers.logintoken,
        languageid: req.headers.languageid,
        deviceid: req.headers.deviceid
      }
    },
    function(error, response, body) 
    {
      if (!error && response.statusCode == 200) 
      {
        
        console.log(body)
        var xmldocument = new xmldoc.XmlDocument(body);
        log.info("StatusCode : " +  response.statusCode);
        log.info("xmldocument : " +  xmldocument);
        if (xmldocument.descendantWithPath("soap:Body.GetOrderStatusRequestResponse") != undefined) 
        {
          GetOrderStatusRequest = xmldocument.descendantWithPath("soap:Body.GetOrderStatusRequestResponse");
          if (GetOrderStatusRequest.descendantWithPath("GetOrderStatusRequestResult") != undefined) 
          {
            console.log(GetOrderStatusRequest.descendantWithPath("GetOrderStatusRequestResult.ResponseCode").val);
            log.info("Response Code : " + GetOrderStatusRequest.descendantWithPath("GetOrderStatusRequestResult.ResponseCode").val);

            if (GetOrderStatusRequest.descendantWithPath("GetOrderStatusRequestResult.ResponseCode").val == 0) 
            {
              var ResponseCode = GetOrderStatusRequest.descendantWithPath("GetOrderStatusRequestResult.ResponseCode").val;
              var ResponseMessage = GetOrderStatusRequest.descendantWithPath("GetOrderStatusRequestResult.ResponseMessage").val;
              log.info("Response Message : " + ResponseMessage );
              paymentDetails.trackingId = GetOrderStatusRequest.descendantWithPath("GetOrderStatusRequestResult.TransID").val;
              paymentDetails.orderId = GetOrderStatusRequest.descendantWithPath("GetOrderStatusRequestResult.OrderID").val;
              paymentDetails.user_Id = GetOrderStatusRequest.valueWithPath("GetOrderStatusRequestResult.udf1");
              log.info("User Id : " +  GetOrderStatusRequest.valueWithPath("GetOrderStatusRequestResult.udf1"));
              //paymentDetails.planId = GetOrderStatusRequest.descendantWithPath("GetOrderStatusRequestResult.udf2").val;
              paymentDetails.paymentMode = GetOrderStatusRequest.descendantWithPath("GetOrderStatusRequestResult.Paymode").val;
              log.info("paymentMode : " + paymentDetails.paymentMode);
              //  paymentDetails.price = GetOrderStatusRequest.descendantWithPath("GetOrderStatusRequestResult.net_amount").val;  /// gross_amount confusion
              paymentDetails.bankRefNo = GetOrderStatusRequest.descendantWithPath("GetOrderStatusRequestResult.RefID").val;
              paymentDetails.paymentMode = GetOrderStatusRequest.descendantWithPath("GetOrderStatusRequestResult.Paymode").val;
              paymentDetails.paymentReferenceNo = GetOrderStatusRequest.descendantWithPath("GetOrderStatusRequestResult.PayTxnID").val;
              paymentDetails.price = GetOrderStatusRequest.descendantWithPath("GetOrderStatusRequestResult.gross_amount").val;

              //console.log("\n");
              //console.log("check");
              //  console.log(GetOrderStatusRequest.valueWithPath("GetOrderStatusRequestResult.result"));
              var result = GetOrderStatusRequest.valueWithPath("GetOrderStatusRequestResult.result")
              paymentDetails.statusMessage = (GetOrderStatusRequest.valueWithPath("GetOrderStatusRequestResult.result").toUpperCase() == "CAPTURED") ? "SUCCESS" : result;
              paymentDetails.statusCode = (ResponseCode != "0") ? 0 : 1;
              paymentDetails.orderStatus = (GetOrderStatusRequest.valueWithPath("GetOrderStatusRequestResult.result").toUpperCase() == "CAPTURED") ? "SUCCESS" : result;
              paymentDetails.failureMessage = (ResponseCode != "0") ? ResponseMessage : null;
              //paymentDetails.user_Id = GetOrderStatusRequest.descendantWithPath("GetOrderStatusRequestResult.udf1").val;
              //paymentDetails.planId = GetOrderStatusRequest.descendantWithPath("GetOrderStatusRequestResult.udf2").val; 	
              paymentDetails.cardName = "";

              console.log(paymentDetails); 

              log.info("Payment Details : " + JSON.stringify(paymentDetails));

              StorePaymentDetails(paymentDetails, req, res);

              // request.get(  {
              //     url:appSetting.SystemConfiguration.APIBaseUrl +  appSetting.Payment.SuccessUrl,           
              //     headers: { 'Content-Type': 'text/html', 'appid' : req.headers.appid, 'userid' : req.headers.userid ,'logintoken' : req.headers.logintoken,'languageid': req.headers.languageid,
              //     "deviceid" : req.headers.deviceid}
              // },function (error, response, body) {                          
              //     res.redirect( appSetting.SystemConfiguration.APIBaseUrl +  appSetting.Payment.SuccessUrl);               
              //     }); 
            }
            else 
            {
              if (xmldocument.descendantWithPath("soap:Body.GetOrderStatusRequestResponse") != undefined) 
              {
                // console.log( xmldocument.descendantWithPath("soap:Body.GetOrderStatusRequestResponse"));
                GetOrderStatusRequest = xmldocument.descendantWithPath("soap:Body.GetOrderStatusRequestResponse");
                if (GetOrderStatusRequest.descendantWithPath("GetOrderStatusRequestResult") != undefined) 
                {
                  var ResponseCode = GetOrderStatusRequest.descendantWithPath("GetOrderStatusRequestResult.ResponseCode").val;
                  var ResponseMessage = GetOrderStatusRequest.descendantWithPath("GetOrderStatusRequestResult.ResponseMessage").val;
                  paymentDetails.price = GetOrderStatusRequest.descendantWithPath("GetOrderStatusRequestResult.gross_amount").val;
                  console.log( GetOrderStatusRequest.descendantWithPath("GetOrderStatusRequestResult.gross_amount").val);
                  paymentDetails.FailureMessage = (ResponseCode != "0") ? ResponseMessage : null;
                  paymentDetails.StatusCode = (ResponseCode != "0") ? 0 : 1;
                  paymentDetails.StatusMessage = ResponseMessage;
                  log.info("FailureMessage : " +      paymentDetails.FailureMessage   );
                  paymentDetails.user_Id = GetOrderStatusRequest.descendantWithPath("GetOrderStatusRequestResult.udf1").val;
                  log.info("User Id : " +  GetOrderStatusRequest.valueWithPath("GetOrderStatusRequestResult.udf1"));
                  //paymentDetails.planId = GetOrderStatusRequest.descendantWithPath("GetOrderStatusRequestResult.udf2").val;
                  
                  console.log(paymentDetails);               
                  // res.sendfile(appSetting.SystemConfiguration.ViewPath + 'payment/cancel.html');

                  log.info("Payment Details : " + JSON.stringify(paymentDetails));

                  StorePaymentDetails(paymentDetails, req, res);

                  // request.get(  {
                  //     url:appSetting.SystemConfiguration.APIBaseUrl +  appSetting.Payment.CancelUrl,           
                  //     headers: { 'Content-Type': 'text/html' , 'appid' : req.headers.appid, 'userid' : req.headers.userid ,'logintoken' : req.headers.logintoken,'languageid': req.headers.languageid,
                  //                 "deviceid" : req.headers.deviceid}
                  // },function (error, response, body) {                         
                  //     res.redirect( appSetting.SystemConfiguration.APIBaseUrl +  appSetting.Payment.CancelUrl);             
                  // });
                }
              }
            }
            console.log(paymentDetails);
            log.info("Payment Details : " + JSON.stringify(paymentDetails));
          }

        }
        else 
        {
          res.redirect( appSetting.SystemConfiguration.APIBaseUrl +  appSetting.Payment.CancelUrl);     
        }
      //  res.redirect(appSetting.SystemConfiguration.ViewPath + 'payment/cancel.html');
      }
      else
      {
        log.info("error : " + JSON.stringify(error));
        log.info("response : " + JSON.stringify(response));
        log.info("body : " + JSON.stringify(body));
      }
    }
  );
});

module.exports = router;
