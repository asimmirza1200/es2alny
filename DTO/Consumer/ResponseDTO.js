var constant = require("../../CommonUtility/constant");

module.exports = {
  
// statusInfo = {
//   statusCode : String,
//   message : String
// },

InvalidHeader() { 
  return { 
    statusInfo : {
      statusCode : constant.ErrorCode.InvalidHeader,
      message : constant.ErrorMsg.InvalidHeader
    },
    data : {} 
  };
},


InvalidParameter() { 
  return { 
    statusInfo : {
      statusCode : constant.ErrorCode.InvalidParameter,
      message : constant.ErrorMsg.InvalidParameter
    },
    data : {} 
  };
},


TechnicalError() { 
  return { 
    statusInfo : {
      statusCode : constant.ErrorCode.TechnicalError,
      message : constant.ErrorMsg.TechnicalError
    },
    data : {} 
  };
},

DataRetrievedSuccessfully(statusCode, message, data) { 
  return { 
    statusInfo : {
      statusCode : statusCode,
      message : message
    },
    data : data 
  };
},


ErrorMassage(statusCode, message, data) { 
  return { 
    statusInfo : {
      statusCode : statusCode,
      message : message
    },
    data : data 
  };
},




SendOTP(statusCode, message, data) { 
  return { 
    statusInfo : {
      statusCode : statusCode,
      message : message
    },
    data : {}
    // {
    //   firstName: doc[0].firstName,
    //   lastName: doc[0].lastName
    // }
  };
},


VerifyOTP(statusCode, message, data) { 
  return { 
    statusInfo : {
      statusCode : statusCode,
      message : message
    },
    data : {data}
    // {
    //   firstName: doc[0].firstName,
    //   lastName: doc[0].lastName
    // }
  };
},



GetCategoryWithProviderDetails(statusCode, message, categoryDetails, providerDetails) { 
  return { 
    statusInfo : {
      statusCode : statusCode,
      message : message
    },
    data : {
      categoryDetails : categoryDetails,
      providerDetails : providerDetails 
    }
    // {
    //   firstName: doc[0].firstName,
    //   lastName: doc[0].lastName
    // }
  };
},


GetProviderList(statusCode, message, providerList) { 
  return { 
    statusInfo : {
      statusCode : statusCode,
      message : message
    },
    data : providerList
  };
},



GetAdminDetails(statusCode, message, loginMaster, loginToken) { 
  return { 
    statusInfo : {
      statusCode : statusCode,
      message : message
    },
    data : {
      userId : loginMaster._id,
      name: loginMaster.name,
      position : loginMaster.position,
      image : loginMaster.image ,
      emailaddress : loginMaster.emailaddress,
      loginToken : loginToken
    } 
  };
},


GetConsumerDetails(statusCode, message, userMaster, userDetails, loginToken, walletBalance) { 
  return { 
    statusInfo : {
      statusCode : statusCode,
      message : message
    },
    data : {
      userId : userMaster._id,
      firstName: userMaster.firstName,
      lastName: userMaster.lastName,
      middleName: userMaster.middleName,
      emailAddress: userMaster.emailAddress,
      mobileNo: userMaster.mobileNo,
      DOB: userMaster.DOB,
      currentDateTime : new Date(),
      genderId: userMaster.genderId,
      image: userMaster.image,    
      userTypeId: userMaster.userTypeId,
      //isMobileNoVerified: userMaster.isMobileNoVerified,
      //userStatusId: userMaster.userStatusId,
      loginToken : loginToken,
      walletBalance : walletBalance,
      currencySymbol : constant.CurrencySymbol.Kuwait,
      createdDateTime : userMaster.createdDateTime,
      userStatusId : userMaster.userStatusId,
      consumerDetails : {
        consumerDetailsId : userDetails._id,
        // isActive: userDetails.isActive,
        // isDeleted: userDetails.isDeleted,
        // createdBy: userDetails.createdBy,
        // createdDateTime: userDetails.createdDateTime,
        // updatedBy: userDetails.updatedBy,
        // updatedDateTime: userDetails.updatedDateTime,
      },
      //providerDetails : {}
    } 
  };
},


GetProviderDetails(statusCode, message, userMaster, providerDetails, providerLangDetails, degree, loginToken) { 
  return { 
    statusInfo : {
      statusCode : statusCode,
      message : message
    },
    data : {
      userId : userMaster._id,
      firstName: userMaster.firstName,
      lastName: userMaster.lastName,
      middleName: userMaster.middleName,
      emailAddress: userMaster.emailAddress,
      mobileNo: userMaster.mobileNo,
      DOB: userMaster.DOB,
      genderId: userMaster.genderId,
      image:  userMaster.image,
      userTypeId: userMaster.userTypeId,
      loginToken : loginToken,
      //isMobileNoVerified: userMaster.isMobileNoVerified,
      //userStatusId: userMaster.userStatusId,
      createdDateTime : userMaster.createdDateTime,
      //consumerDetails : {},
      providerDetails : { 
        providerDetailsId : providerDetails._id,
        categoryId : providerDetails.categoryId,
        subCategoryId : providerDetails.subCategoryId,
        experience : providerDetails.experience,
        price : providerDetails.price,
        currencySymbol : constant.CurrencySymbol.Kuwait,
        description : providerLangDetails.description,
        degree : degree,
        // isActive: providerDetails.isActive,
        // isDeleted: providerDetails.isDeleted,
        // createdBy: providerDetails.createdBy,
        // createdDateTime: providerDetails.createdDateTime,
        // updatedBy: providerDetails.updatedBy,
        // updatedDateTime: providerDetails.updatedDateTime,
      }
    } 
  };
},




GetCategoryAndSubCategoryDetails(statusCode, message, categoryDetail, providerDetails) { 
  return { 
    statusInfo : {
      statusCode : statusCode,
      message : message
    },
    data : {
      categoryDetails : categoryDetail,
      providerDetails : providerDetails
    } 
  };
},


GetLoginDetails(statusCode, message, loginDetails) { 
  return { 
    statusInfo : {
      statusCode : statusCode,
      message : message
    },
    data : loginDetails
    
  };
},

 
CommonResponse(statusCode, message, data) { 
  return { 
    statusInfo : {
      statusCode : statusCode,
      message : message
    },
    data : data
  };
},



};