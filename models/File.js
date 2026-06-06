const mongoose = require('mongoose');
const crypto = require('crypto');

const fileSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  uploadCode: {
    type: String,
    required: true,
    unique: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isCheckedByAdmin: {
    type: Boolean,
    default: false
  },
  checkedAt: {
    type: Date
  },
  checkedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  codeEnteredAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Generate unique upload code
fileSchema.methods.generateUploadCode = function() {
  return crypto.randomBytes(8).toString('hex').toUpperCase();
};

// Generate new code after admin check
fileSchema.methods.regenerateCode = function() {
  this.uploadCode = this.generateUploadCode();
  this.isCheckedByAdmin = false;
  this.checkedAt = undefined;
  this.checkedBy = undefined;
  return this.uploadCode;
};

module.exports = mongoose.model('File', fileSchema);
