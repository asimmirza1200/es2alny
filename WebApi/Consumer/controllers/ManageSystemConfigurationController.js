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
var { SystemConfigurations } = require('../models/entity');
//var { Employee } = require('../models/-employee');
var ResponseDTO = require('../../../DTO/Consumer/ResponseDTO');   
var contains = require("string-contains");
var dateFormat = require('dateformat');
// => localhost:3000/account/

   
  
//For Add Edit in SystemConfiguration 
router.post('/EditSystemConfiguration', (req, res) => {
 
    if(req.body.system_configuration_Id == undefined || req.body.system_configuration_Id.trim() == "" || req.body.minimum_withdrawal_amount_request  == undefined || req.body.minimum_withdrawal_amount_request < 0 || req.body.admin_email_address_for_notify == undefined || req.body.admin_email_address_for_notify.trim() == "" || req.body.whatsapp_mobile_no == undefined || req.body.whatsapp_mobile_no.trim() == "")
    {
        res.send(ResponseDTO.InvalidParameter()); 
    }
    else
    { 
        //Edit System Configuration Details 
        SystemConfigurations.updateOne({ _id : ObjectId(req.body.system_configuration_Id), isActive : true, isDeleted : false }, { $set: { minimum_withdrawal_amount_request : req.body.minimum_withdrawal_amount_request, admin_email_address_for_notify : req.body.admin_email_address_for_notify, whatsapp_mobile_no : req.body.whatsapp_mobile_no, updatedBy: ObjectId(req.headers.userid), updatedDateTime : new Date() } }, function(err, result) {
            console.log(result);
            if (!err)  
            {
                if(result.n > 0)
                {
                    console.log("System Configurations Details Update successfully."); 
                    //res.send(ResponseDTO.ErrorMassage( constant.ErrorCode.EmailAlreadyExists, constant.ErrorMsg.EmailAlreadyExists, {} )); 
                    res.send(ResponseDTO.ErrorMassage(constant.ErrorCode.UpdateSuccessfully, constant.ErrorMsg.UpdateSuccessfully, {} ));  
                }
                else
                {
                    console.log("System Configurations Details Not Updated."); 
                    res.send(ResponseDTO.ErrorMassage(constant.ErrorCode.NotUpdated, constant.ErrorMsg.NotUpdated, {} ));   
                }
            }
            else 
            { 
                res.send(ResponseDTO.TechnicalError());
            }
        }); 
              
    }


 
 
});

  
//For View SystemConfiguration Details
router.post('/GetSystemConfiguration', (req, res) => {
  
      
    SystemConfigurations.find({isActive : true, isDeleted : false}, async (err,  systemConfigurationsDoc) =>
    {    
        console.log(systemConfigurationsDoc);
        if(!err)
        {   
            if(systemConfigurationsDoc.length > 0)
            {
                console.log("Minimum withdrawal amount is not mach. (Minimum price req. in massage parameter)");
                res.send(ResponseDTO.CommonResponse(constant.ErrorCode.DataRetrievedSuccessfully, constant.ErrorMsg.DataRetrievedSuccessfully, 
                    { 
                        system_configuration_Id : systemConfigurationsDoc[0]._id, 
                        minimum_withdrawal_amount_request : systemConfigurationsDoc[0].minimum_withdrawal_amount_request,
                        admin_email_address_for_notify : systemConfigurationsDoc[0].admin_email_address_for_notify,
                        whatsapp_mobile_no : systemConfigurationsDoc[0].whatsapp_mobile_no
                    } ));
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
  
 
   
 


module.exports = router;