const mongoose = require('mongoose');
var ObjectId = require('mongoose').Types.ObjectId; 

Schema = mongoose.Schema;


 
var PaymentDetails = mongoose.model('PaymentDetails', { 
  // _id : { type: Schema.Types.ObjectId },
  user_Id : { type: Schema.Types.ObjectId, ref: 'usermasters',  }, 
  orderId : { type: String }, 
  trackingId : { type: String }, 
  bankRefNo : { type: String }, 
  orderStatus : { type: String }, 
  failureMessage : { type: String }, 
  paymentMode : { type: String }, 
  cardName : { type: String }, 
  statusCode : { type: Number }, 
  statusMessage : { type: String }, 
  price : { type: Number },   
  paymentGetwayType : { type: Number },  
  isActive : { type: Boolean },
  isDeleted : { type: Boolean }, 
  createdBy: { type: Schema.Types.ObjectId },
  createdDateTime : { type: Date },
  updatedBy:  { type: Schema.Types.ObjectId },
  updatedDateTime: { type: Date },
  planId : { type: Schema.Types.ObjectId }
}); 

 

var OTPDetail = mongoose.model('OTPDetail', { 
    //_id : {type: ObjectId },
    mobileNo : { type: String },
    emailAddress : { type: String },
    OTP : { type: String },
    validTill : { type: Date }, 
    isActive : { type: Boolean },
    isDeleted : { type: Boolean }, 
    createdBy: { type: Schema.Types.ObjectId },
    createdDateTime : { type: Date },
    updatedBy:  { type: Schema.Types.ObjectId },
    updatedDateTime : {type : Date }
});


 
var LoginToken = mongoose.model('LoginToken', {

    //_id : {type: ObjectId },
    appId : { type: Number },
    user_Id : { type: ObjectId },
    deviceId : { type: String },
    loginToken : { type: String },
    startDate : { type: Date },
    isActive : { type: Boolean },
    isDeleted : { type: Boolean }, 
    createdBy: { type: Schema.Types.ObjectId },
    createdDateTime : { type: Date },
    updatedBy:  { type: Schema.Types.ObjectId },
    updatedDateTime: { type: Date },
});


var DeviceTokenMasters = mongoose.model('DeviceTokenMasters', { 
 // _id : { type: Schema.Types.ObjectId },
  user_Id : { type: Schema.Types.ObjectId },
  appId : { type: Number },
  deviceId : { type: String },
  deviceToken : { type: String }, 
  isActive : { type: Boolean },
  isDeleted : { type: Boolean }, 
  createdBy: { type: Schema.Types.ObjectId },
  createdDateTime : { type: Date },
  updatedBy:  { type: Schema.Types.ObjectId },
  updatedDateTime: { type: Date },
});





 var CategoryLangDetails = mongoose.model('CategoryLangDetails', { 
  // _id : { type: Schema.Types.ObjectId }, 
   language_id : { type: Schema.Types.ObjectId, ref: 'languageMasters' },
   category_id : { type: Schema.Types.ObjectId, ref: 'categoryMasters' },
   categoryName : { type: String }, 
   categoryDescription : { type: String }, 
   isActive : { type: Boolean },
   isDeleted : { type: Boolean }, 
   createdBy: { type: Schema.Types.ObjectId },
   createdDateTime : { type: Date },
   updatedBy:  { type: Schema.Types.ObjectId },
   updatedDateTime: { type: Date },
 });


 var CategoryMasters = mongoose.model('CategoryMasters', { 
  // _id : { type: Schema.Types.ObjectId },
   categoryCode : { type: String },
   parent_Id : { type: Schema.Types.ObjectId, ref: 'categoryMasters',  },
   rootCategoryId : { type: Schema.Types.ObjectId, ref: 'categoryMasters' },
   imageURL : { type: String }, 
   isActive : { type: Boolean },
   isDeleted : { type: Boolean }, 
   createdBy: { type: Schema.Types.ObjectId },
   createdDateTime : { type: Date },
   updatedBy:  { type: Schema.Types.ObjectId },
   updatedDateTime: { type: Date },
   hasSubCategory : { type: Boolean }
   //categoryDetails : { type : [ mongoose.model.CategoryMasters ], ref: 'categoryLangDetails' }
  //  categoryDetails : [{
  //     language_id : { type: Schema.Types.ObjectId, ref: 'languageMasters' },
  //     category_id : { type: Schema.Types.ObjectId, ref: 'categoryMasters' },
  //     categoryName : { type: String }, 
  //     categoryDescription : { type: String }, 
  //     isActive : { type: Boolean },
  //     isDeleted : { type: Boolean }, 
  //     createdBy: { type: Schema.Types.ObjectId },
  //     createdDateTime : { type: Date },
  //     updatedBy:  { type: Schema.Types.ObjectId },
  //     updatedDateTime: { type: Date },
  //  }] 
 });

 
 var AppointmentDetails = mongoose.model('AppointmentDetails', { 
    // _id : { type: Schema.Types.ObjectId },
    provider_user_Id : { type: Schema.Types.ObjectId, ref: 'usermasters',  },
    consumer_user_Id : { type: Schema.Types.ObjectId, ref: 'usermasters',  }, 
    question : { type: String }, 
    answer : { type: String }, 
    rate : { type: Number },  
    isActive : { type: Boolean },
    isDeleted : { type: Boolean }, 
    createdBy: { type: Schema.Types.ObjectId },
    createdDateTime : { type: Date },
    updatedBy:  { type: Schema.Types.ObjectId },
    updatedDateTime: { type: Date }
 }); 


var UserMaster = mongoose.model("UserMaster", {
   // _id : { type: Schema.Types.ObjectId },
    firstName: { type: String },
    lastName: { type: String },
    middleName: { type: String },
    emailAddress: { type: String },
    mobileNo: { type: String },
    DOB: { type: Date },
    genderId: { type: Number },
    image: { type: String },
    userTypeId: { type: Schema.Types.ObjectId },
    isMobileNoVerified: { type: Boolean },
    userStatusId: { type: Number },
    isActive: { type: Boolean },
    isDeleted: { type: Boolean },
    createdBy: { type: Schema.Types.ObjectId },
    createdDateTime: { type: Date },
    updatedBy:  { type: Schema.Types.ObjectId },
    updatedDateTime: { type: Date },
    userDetails : { type: Schema.Types.ObjectId, ref: 'userDetails' },
    providerDetails : { type: Schema.Types.ObjectId, ref: 'ProviderDetails' },
    password : { type: String },
    countryId : { type: Schema.Types.ObjectId },
  });

  var UserDetails = mongoose.model("UserDetails", {
  //  _id : { type: Schema.Types.ObjectId },
    user_Id : { type: Schema.Types.ObjectId, ref: 'usermasters' },
    isActive: { type: Boolean },
    isDeleted: { type: Boolean },
    createdBy: { type: Schema.Types.ObjectId },
    createdDateTime: { type: Date },
    updatedBy:  { type: Schema.Types.ObjectId },
    updatedDateTime: { type: Date },
  });

  
  var ProviderDetails = mongoose.model("ProviderDetails", {
    //_id : { type: Schema.Types.ObjectId },
    user_Id :  { type: Schema.Types.ObjectId, ref: 'usermasters' },// { type: ObjectId },
    experience : { type: Number },
    categoryId : { type: Schema.Types.ObjectId, ref: 'categorymasters' },
    subCategoryId : { type: Schema.Types.ObjectId, ref: 'categorymasters' },
    degree : [{ type: Schema.Types.ObjectId }], 
    price : { type: Number },
    description : { type: String },
    commissionPercentage : { type: Number },
    isActive : { type: Boolean },
    isDeleted : { type: Boolean }, 
    createdBy: { type: Schema.Types.ObjectId },
    createdDateTime : { type: Date },
    updatedBy:  { type: Schema.Types.ObjectId },
    updatedDateTime : {type : Date },
    
    language : [{ type: Schema.Types.ObjectId }],
    supplierCode : { type: Number }
  });


  var ProviderLangDetails = mongoose.model("ProviderLangDetails", {
    _id : { type: Schema.Types.ObjectId },
    language_Id :  { type: Schema.Types.ObjectId, ref: 'languageMasters' },// { type: ObjectId },
    providerdetails_Id : { type: Schema.Types.ObjectId, ref: 'providerdetails' },// { type: ObjectId },
    description : { type: String },
    isActive : { type: Boolean },
    isDeleted : { type: Boolean }, 
    createdBy: { type: Schema.Types.ObjectId },
    createdDateTime : { type: Date },
    updatedBy:  { type: Schema.Types.ObjectId },
    updatedDateTime : {type : Date } 
  });


  var LookupDetails = mongoose.model("LookupDetails", {
    //_id : { type: Schema.Types.ObjectId },  
    lookupCode : { type: Number },  
    isActive : { type: Boolean },
    isDeleted : { type: Boolean }, 
    createdBy: { type: Schema.Types.ObjectId },
    createdDateTime : { type: Date },
    updatedBy:  { type: Schema.Types.ObjectId },
    updatedDateTime : {type : Date } 
  });

  var LookupLangDetails = mongoose.model("LookupLangDetails", {
    //_id : { type: Schema.Types.ObjectId }, 
    language_Id :  { type: Schema.Types.ObjectId, ref: 'languageMasters' },// { type: ObjectId },
    lookupDetails_Id : { type: Schema.Types.ObjectId, ref: 'lookupDetails' },
    lookupValue : { type: String },  
    isActive : { type: Boolean },
    isDeleted : { type: Boolean }, 
    createdBy: { type: Schema.Types.ObjectId },
    createdDateTime : { type: Date },
    updatedBy:  { type: Schema.Types.ObjectId },
    updatedDateTime : {type : Date } 
  });



  

var UserPurchases = mongoose.model('UserPurchases', { 
  // _id : { type: Schema.Types.ObjectId },
  user_Id : { type: Schema.Types.ObjectId, ref: 'usermasters',  }, 
  payment_Id : { type: Schema.Types.ObjectId, ref: 'paymentdetails',  }, 
  price : { type: Number }, 
  expiryDate : { type: Date }, 
  isActive : { type: Boolean },
  isDeleted : { type: Boolean }, 
  createdBy: { type: Schema.Types.ObjectId },
  createdDateTime : { type: Date },
  updatedBy:  { type: Schema.Types.ObjectId },
  updatedDateTime: { type: Date }
}); 




var UserConsumptions = mongoose.model('UserConsumptions', { 
  // _id : { type: Schema.Types.ObjectId },
  consumer_user_Id : { type: Schema.Types.ObjectId, ref: 'usermasters',  }, 
  provider_user_Id : { type: Schema.Types.ObjectId, ref: 'usermasters',  }, 
  appointment_details_Id : { type: Schema.Types.ObjectId, ref: 'appointmentdetails',  },  
  price : { type: Number }, 
  commissionPercentage : { type: Number  }, 
  isActive : { type: Boolean },
  isDeleted : { type: Boolean }, 
  createdBy: { type: Schema.Types.ObjectId },
  createdDateTime : { type: Date },
  updatedBy:  { type: Schema.Types.ObjectId },
  updatedDateTime: { type: Date }
}); 



var CreditPlans = mongoose.model('CreditPlans', { 
  // _id : { type: Schema.Types.ObjectId }, 
  price : { type: Number }, 
  note : { type: String  }, 
  isActive : { type: Boolean },
  isDeleted : { type: Boolean }, 
  createdBy: { type: Schema.Types.ObjectId },
  createdDateTime : { type: Date },
  updatedBy:  { type: Schema.Types.ObjectId },
  updatedDateTime: { type: Date }
}); 


var Feedback  = mongoose.model('Feedback', { 
  // _id : { type: Schema.Types.ObjectId }, 
  user_Id : { type: Schema.Types.ObjectId, ref: 'usermasters',  }, 
  emailAddress : { type: String }, 
  feedback : { type: String  }, 
  isActive : { type: Boolean },
  isDeleted : { type: Boolean }, 
  createdBy: { type: Schema.Types.ObjectId },
  createdDateTime : { type: Date },
  updatedBy:  { type: Schema.Types.ObjectId },
  updatedDateTime: { type: Date }
}); 


var LoginMaster  = mongoose.model('LoginMaster', { 
  //_id : { type: Schema.Types.ObjectId }, 
  name : { type: String }, 
  position : { type: String }, 
  image : { type: String }, 
  emailaddress : { type: String }, 
  password  : { type: String }, 
  usertype : { type: Schema.Types.ObjectId  },  
  isActive : { type: Boolean },
  isDeleted : { type: Boolean }, 
  createdBy: { type: Schema.Types.ObjectId },
  createdDateTime : { type: Date },
  updatedBy:  { type: Schema.Types.ObjectId },
  updatedDateTime: { type: Date }
}); 


//appointmentdocuments
var AppointmentDocuments = mongoose.model('AppointmentDocuments', { 
  // _id : { type: Schema.Types.ObjectId },
  appointmentdetails_Id : { type: Schema.Types.ObjectId, ref: 'appointmentdetails',  },
  to_user_Id : { type: Schema.Types.ObjectId, ref: 'usermasters',  }, 
  from_user_Id : { type: Schema.Types.ObjectId, ref: 'usermasters',  }, 
  document : { type: String },
  isActive : { type: Boolean },
  isDeleted : { type: Boolean }, 
  createdBy: { type: Schema.Types.ObjectId },
  createdDateTime : { type: Date },
  updatedBy:  { type: Schema.Types.ObjectId },
  updatedDateTime: { type: Date }
}); 



var WithdrawDetails = mongoose.model('WithdrawDetails', { 
  // _id : { type: Schema.Types.ObjectId }, 
  user_Id : { type: Schema.Types.ObjectId, ref: 'usermasters',  }, 
  price : { type: Number },  
  requestDateTime: { type: Date },
  isWithdraw: { type: Boolean },
  withdrawDateTime: { type: Date }, 
  isActive : { type: Boolean },
  isDeleted : { type: Boolean }, 
  createdBy: { type: Schema.Types.ObjectId },
  createdDateTime : { type: Date },
  updatedBy:  { type: Schema.Types.ObjectId },
  updatedDateTime: { type: Date },

  paymentId : { type: String },
  supplierCode : { type: Number } 
}); 



var TemplateMasters = mongoose.model('TemplateMasters', { 
  // _id : { type: Schema.Types.ObjectId },  
  templateCode : { type: Number },  
  templateName: { type: String }, 
  isActive : { type: Boolean },
  isDeleted : { type: Boolean }, 
  createdBy: { type: Schema.Types.ObjectId },
  createdDateTime : { type: Date },
  updatedBy:  { type: Schema.Types.ObjectId },
  updatedDateTime: { type: Date }
}); 



var TemplateLangDetails = mongoose.model('TemplateLangDetails', { 
  // _id : { type: Schema.Types.ObjectId }, 
  language_Id : { type: Schema.Types.ObjectId }, 
  templatemasters_Id : { type: Schema.Types.ObjectId, ref: 'templatemasters',  }, 
  templateCode : { type: Number },  
  emailSubject: { type: String },
  emailBody: { type: String }, 
  isActive : { type: Boolean },
  isDeleted : { type: Boolean }, 
  createdBy: { type: Schema.Types.ObjectId },
  createdDateTime : { type: Date },
  updatedBy:  { type: Schema.Types.ObjectId },
  updatedDateTime: { type: Date }
}); 



var SystemConfigurations = mongoose.model('SystemConfigurations', { 
  // _id : { type: Schema.Types.ObjectId },  
  minimum_withdrawal_amount_request : { type: Number },   
  isActive : { type: Boolean },
  isDeleted : { type: Boolean }, 
  createdBy: { type: Schema.Types.ObjectId },
  createdDateTime : { type: Date },
  updatedBy:  { type: Schema.Types.ObjectId },
  updatedDateTime: { type: Date },
  admin_email_address_for_notify : { type: String },
  whatsapp_mobile_no : {type : String}
}); 



var ProfileVisitors = mongoose.model('ProfileVisitors', { 
  // _id : { type: Schema.Types.ObjectId },  
  user_Id : { type: Schema.Types.ObjectId },  
  visitor_user_Id : { type: Schema.Types.ObjectId },  
  isActive : { type: Boolean },
  isDeleted : { type: Boolean }, 
  createdBy: { type: Schema.Types.ObjectId },
  createdDateTime : { type: Date },
  updatedBy:  { type: Schema.Types.ObjectId },
  updatedDateTime: { type: Date }
}); 


var CountryMasters = mongoose.model("CountryMasters", {
  //_id : { type: Schema.Types.ObjectId },  
  countryCode : { type: String },  
  isActive : { type: Boolean },
  isDeleted : { type: Boolean }, 
  createdBy: { type: Schema.Types.ObjectId },
  createdDateTime : { type: Date },
  updatedBy:  { type: Schema.Types.ObjectId },
  updatedDateTime : {type : Date } 
});


var CountryLangMasters = mongoose.model("CountryLangMasters", {
  //_id : { type: Schema.Types.ObjectId },
  countrymaster_id : { type: Schema.Types.ObjectId },
  language_id : { type: Schema.Types.ObjectId }, 
  countryName : { type: String },  
  isActive : { type: Boolean },
  isDeleted : { type: Boolean }, 
  createdBy: { type: Schema.Types.ObjectId },
  createdDateTime : { type: Date },
  updatedBy:  { type: Schema.Types.ObjectId },
  updatedDateTime : {type : Date } 
});


var AgeGroupMasters = mongoose.model("AgeGroupMasters", {
  //_id : { type: Schema.Types.ObjectId },
  ageGroupName : { type: String },
  fromAge : { type: Number },
  toAge : { type: Number },  
  isActive : { type: Boolean },
  isDeleted : { type: Boolean }, 
  createdBy: { type: Schema.Types.ObjectId },
  createdDateTime : { type: Date },
  updatedBy:  { type: Schema.Types.ObjectId },
  updatedDateTime : {type : Date } 
});


var SupplierMasters = mongoose.model("SupplierMasters", {
  //_id : { type: Schema.Types.ObjectId },
  user_Id : { type: Schema.Types.ObjectId },  
  supplierCode : { type: Number },
  supplierName : { type: String },
  mobile : { type: String },   
  email : { type: String },
  commissionValue : { type: Number },
  commissionPercentage : { type: Number },  
  depositTerms : { type: String },
  isDepositHold : { type: Boolean },
  bankId : { type: Number },  
  bankAccountHolderName  : { type: String },
  bankAccount : { type: String },
  iban : { type: String },     
  isActive : { type: Boolean },
  isDeleted : { type: Boolean }, 
  createdBy : { type: Schema.Types.ObjectId },
  createdDateTime : { type: Date },
  updatedBy :  { type: Schema.Types.ObjectId },
  updatedDateTime : {type : Date } 
});



var PaymentRequestMasters = mongoose.model("PaymentRequestMasters", {
  //_id : { type: Schema.Types.ObjectId },
  userId : { type: String }, 
  supplierCode : { type: Number },
  totalProviderPrice : { type: String },
  invoiceItemModel : { type: Array },
  isActive : { type: Boolean },
  isDeleted : { type: Boolean }, 
  createdBy : { type: Schema.Types.ObjectId },
  createdDateTime : { type: Date },
  updatedBy :  { type: Schema.Types.ObjectId },
  updatedDateTime : {type : Date } 
});


var WithdrawItemDetails = mongoose.model('WithdrawItemDetails', { 
  // _id : { type: Schema.Types.ObjectId }, 
  withdrawdetails_Id : { type: Schema.Types.ObjectId, ref: 'withdrawdetails' }, 
  appointment_details_Id : { type: Schema.Types.ObjectId },
  provider_user_Id : { type: Schema.Types.ObjectId },
  consumer_user_Id : { type: Schema.Types.ObjectId },
  totalprice: { type: Number },
  commissionPercentage: { type: Number },
  providePrice: { type: Number },
  commissionPrice: { type: Number },
  userconsumptions_Id : { type: Schema.Types.ObjectId },

  isActive : { type: Boolean },
  isDeleted : { type: Boolean }, 
  createdBy: { type: Schema.Types.ObjectId },
  createdDateTime : { type: Date },
  updatedBy:  { type: Schema.Types.ObjectId },
  updatedDateTime: { type: Date }
}); 



var KNETPaymentRequest = mongoose.model("KNETPaymentRequest", {
  //_id : { type: Schema.Types.ObjectId },
  userId : { type: Schema.Types.ObjectId }, 
  errorUrl : { type: String },
  price : { type: Number },
  qty : { type: Number },
  //tranAmount : { type: Number },
  languageCode : { type: String },
  reqUdf1 : { type: Schema.Types.ObjectId }, 
  reqUdf2 : { type: Schema.Types.ObjectId }, 
  reqUdf3 : { type: Number },
  reqUdf4 : { type: String },
  tranTrackid: { type: String },
  currencyCode : { type: String }, 
  
  statusId : { type: Number }, // 0 = Non Notified Transaction , 1 = Refund, 2 = Processed Transaction  
  isActive : { type: Boolean },
  isDeleted : { type: Boolean }, 
  createdBy : { type: Schema.Types.ObjectId },
  createdDateTime : { type: Date },
  updatedBy :  { type: Schema.Types.ObjectId },
  updatedDateTime : {type : Date } 
});




// module.exports = { LoginToken, UserMaster };

module.exports = { OTPDetail, LoginToken, DeviceTokenMasters, 
  UserMaster, UserDetails, ProviderDetails, 
  ProviderLangDetails, LookupLangDetails,
  CategoryMasters, CategoryLangDetails, AppointmentDetails, AppointmentDocuments,
  PaymentDetails, UserPurchases, UserConsumptions, CreditPlans, Feedback, LookupDetails,

  //For Admin Panel
  LoginMaster, WithdrawDetails,


  TemplateMasters, TemplateLangDetails,

  SystemConfigurations, ProfileVisitors,

  CountryMasters, CountryLangMasters,

  //For Report
  AgeGroupMasters,

  //For Supplier Payment Details
  SupplierMasters,

  //For Paymnet to Provider
  PaymentRequestMasters,
  WithdrawItemDetails,

  //KNET Payment Request
  KNETPaymentRequest

};