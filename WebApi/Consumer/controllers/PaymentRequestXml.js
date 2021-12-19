var dateFormat = require('dateformat');
var appSetting = require('../appsetting');
// const express = require('express');
// var router = express.Router();
// var appSetting = require('../appsetting');  
// var constant = require('../../../CommonUtility/constant');  
// var { UserMaster } = require('../models/entity');
// var ResponseDTO = require('../../../DTO/Consumer/ResponseDTO');   
function PaymentRequestXml(userName, emailAddress, mobileNo, price, userId) {

  if(emailAddress.trim() != "")
  {
    emailAddress = emailAddress.toLowerCase();
  }
  
  console.log("Email Address : " + emailAddress);

  var reqstring = "<?xml version='1.0' encoding='UTF-8'?>";
  reqstring += "<soap:Envelope xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance' xmlns:xsd='http://www.w3.org/2001/XMLSchema' xmlns:soap='http://schemas.xmlsoap.org/soap/envelope/'>";
  reqstring += "<soap:Body><PaymentRequest xmlns='http://tempuri.org/'>";
  reqstring += "<req>";
  reqstring += "<CustomerDC>";
  reqstring += "<Name>" + userName + "</Name>";
  reqstring += "<Email>" + emailAddress + "</Email>";
  reqstring += "<Mobile>" + mobileNo + "</Mobile>";
  reqstring += "</CustomerDC>";
  reqstring += "<MerchantDC>";
   reqstring += "<merchant_code>" + appSetting.Payment.PaymentGatewayAPIMerchantCode + "</merchant_code>";
  reqstring += "<merchant_username>" + appSetting.Payment.PaymentGatewayAPIMerchantUsername + "</merchant_username>";
  reqstring += "<merchant_password>" + appSetting.Payment.PaymentGatewayAPIMerchantPassword + "</merchant_password>";
  reqstring += "<merchant_ReferenceID>" + dateFormat(new Date(), "ddMMyyyyhhmmssl") + "</merchant_ReferenceID>";
  reqstring += "<ReturnURL>" + appSetting.SystemConfiguration.APIBaseUrl + appSetting.Payment.PaymentGatewayResponseURL + "</ReturnURL>";
  reqstring += "<merchant_error_url>" + appSetting.SystemConfiguration.APIBaseUrl + appSetting.Payment.CancelUrl + "</merchant_error_url>";
  reqstring += "<udf1>" + userId + "</udf1>";
 // reqstring += "<udf2>" + planId + "</udf2>";
  reqstring += "</MerchantDC>";
  reqstring += "<lstProductDC>";
  reqstring += "<ProductDC><product_name>ES2ALNY Plan Purchase</product_name>";
  reqstring += "<unitPrice>" + price + "</unitPrice>";
  reqstring += "<qty>1</qty></ProductDC>";
  reqstring += " </lstProductDC>";
  reqstring += "<totalDC>";
  reqstring += "<subtotal>" + price + "</subtotal>";
  reqstring += "</totalDC>";
  reqstring += "<paymentModeDC>";
  reqstring += "<paymentMode></paymentMode>";
  reqstring += "</paymentModeDC>";
  reqstring += "<paymentCurrencyDC>";
  reqstring += "<paymentCurrrency>KWD</paymentCurrrency>";
  reqstring += "</paymentCurrencyDC>";
  reqstring += "</req>";
  reqstring += "</PaymentRequest>";
  reqstring += "</soap:Body>";
  reqstring += "</soap:Envelope>";
  return reqstring;
}
exports.PaymentRequestXml = PaymentRequestXml;
