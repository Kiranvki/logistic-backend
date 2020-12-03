module.exports = {
  // On boarding hooks 
  isValidPickerBoyId: require('./app/isValidPickerBoyId'),  //check whether the picker id is correct or not
  generateOtp: require('./app/generateOtp'), // generate the OTP
  hashPassword: require('./hashPassword'), // hash password 
  sendForgetEmail: require('./sendForgetEmail'), // send forget password email
  generateRandomHashPasswordArray: require('./generateRandomHashPasswordArray'), // generate random hash password
  sendInviteEmail: require('./sendInviteEmail'), // send invite email
  encryptTheFileInorderToStoreItInDb: require('./encryptTheFileInorderToStoreItInDb'), // encrypt the file inorder to store the file in the db
  getDecryptedImageBuffer: require('./getDecryptedImageBuffer'), // get the decrypted images
  generateRandomHashPasswordArrayForClosed: require('./generateRandomHashPasswordArrayForClosed'), // generate random hash for user onboard 
  sendInviteEmailForClosed: require('./sendInviteEmailForClosed'), // send invite email for closed users
}