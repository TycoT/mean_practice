var mongoose = require('mongoose');
var crypto = require('crypto'); // used to salt and hash the password so we can store it in the user field securely.
var jwt = require('jsonwebtoken'); //json web token for session tracking.

var UserSchema = new mongoose.Schema({
	username: {type: String, lowercase: true, unique: true},
	hash: String,
	salt: String
});

UserSchema.methods.setPassword = function(password){
	this.salt = crypto.randomBytes(16).toString('hex');

	this.hash = crypto.pbkdf2Sync(password, this.salt, 1000, 64).toString('hex');
};

UserSchema.methods.validPassword = function(password) {
	var hash = crypto.pbkdf2Sync(password, this.salt, 1000, 64).toString('hex');

	return this.hash === hash;
};

UserSchema.methods.generateJWT = function() {

	// set expiration to 60 days
	var today = new Date();
	var exp = new Date(today);
	exp.setDate(today.getDate() + 60);

	return jwt.sign({
		_id: this._id,
		username: this.username,
		exp: parseInt(exp.getTime() / 1000),
	}, 'SECRET'); // note the secret is hard-coded, strongly recommended that we use enivornment variable, and keep it out of our codebase.
};

mongoose.model('User', UserSchema);