var appSetting = require('../appsetting');   
const express = require('express');
const path = require('path');
var router = express.Router(); 
var ObjectId = require('mongoose').Types.ObjectId; 
 
var constant = require('../../../CommonUtility/constant');  
  
// constant.SUMMER.BEGINNING 
var { Feedback } = require('../models/entity');
var { LookupDetails, LookupLangDetails } = require('../models/entity');
var ResponseDTO = require('../../../DTO/Consumer/ResponseDTO');   

   
 

// Static Page 
router.get('/About',function(req,res){
  res.sendFile( appSetting.SystemConfiguration.ViewPath + 'staticpage/About.html');
});
    
router.get('/TermeAndCondition',function(req,res){
  res.sendFile( appSetting.SystemConfiguration.ViewPath + 'staticpage/TermeAndCondition.html');
});
    
router.get('/PrivacyPolicy',function(req,res){
  res.sendFile( appSetting.SystemConfiguration.ViewPath + 'staticpage/PrivacyPolicy.html');
});



  module.exports = router;


