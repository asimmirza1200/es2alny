const mongoose = require('mongoose');
var appSetting = require('./appsetting');  


mongoose.connect(appSetting.Database.ConnectionString.toString() + appSetting.Database.DatabaseName.toString(), (err) => {
    if (!err)
        console.log('MongoDB connection succeeded.');
    else
        console.log('Error in DB connection : ' + JSON.stringify(err, undefined, 2));
});

module.exports = mongoose;