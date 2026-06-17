const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const File = require('../models/File');
const { authenticateToken, requireUser, requireAdmin } = require('../middleware/auth');
const upload = require('../utils/upload');

const router = express.Router();

// Test route to verify routing is working
router.get('/test', (req, res) => {
  res.json({ message: 'Files routes are working!' });
});

// Upload file (User only)
router.post('/upload', authenticateToken, requireUser, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Generate unique upload code
    const uploadCode = crypto.randomBytes(8).toString('hex').toUpperCase();

    // Create file record
    const fileRecord = new File({
      filename: req.file.filename,
      originalName: req.file.originalname,
      filePath: req.file.path,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      uploadCode: uploadCode,
      uploadedBy: req.user._id
    });

    await fileRecord.save();

    res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        fileId: fileRecord._id,
        uploadCode: uploadCode,
        filename: req.file.originalname,
        fileSize: req.file.size,
        uploadedAt: fileRecord.createdAt
      }
    });
  } catch (error) {
    // Clean up uploaded file if database save fails
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error during file upload',
      error: error.message
    });
  }
});

// Get user's uploaded files
router.get('/my-files', authenticateToken, requireUser, async (req, res) => {
  try {
    const files = await File.find({ uploadedBy: req.user._id })
      .select('-filePath')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: { files }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Admin: Check file by code (record when code was entered)
router.post('/check-code', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { uploadCode } = req.body;

    if (!uploadCode) {
      return res.status(400).json({
        success: false,
        message: 'Upload code is required'
      });
    }

    const file = await File.findOne({ uploadCode })
      .populate('uploadedBy', 'username email')
      .populate('checkedBy', 'username email');

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found with this code'
      });
    }

    // Record when the code was entered (if not already recorded)
    if (!file.codeEnteredAt) {
      file.codeEnteredAt = new Date();
      await file.save();
    }

    res.json({
      success: true,
      message: 'File found successfully',
      data: {
        file: {
          id: file._id,
          originalName: file.originalName,
          fileSize: file.fileSize,
          mimeType: file.mimeType,
          uploadedBy: file.uploadedBy,
          isCheckedByAdmin: file.isCheckedByAdmin,
          checkedAt: file.checkedAt,
          checkedBy: file.checkedBy,
          createdAt: file.createdAt,
          uploadCode: file.uploadCode,
          codeEnteredAt: file.codeEnteredAt
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Admin: Get file by code (without checking)
router.get('/get-file/:uploadCode', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { uploadCode } = req.params;

    const file = await File.findOne({ uploadCode })
      .populate('uploadedBy', 'username email')
      .populate('checkedBy', 'username email');

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found with this code'
      });
    }

    res.json({
      success: true,
      data: {
        file: {
          id: file._id,
          originalName: file.originalName,
          fileSize: file.fileSize,
          mimeType: file.mimeType,
          uploadedBy: file.uploadedBy,
          isCheckedByAdmin: file.isCheckedByAdmin,
          checkedAt: file.checkedAt,
          checkedBy: file.checkedBy,
          createdAt: file.createdAt
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Admin: Download file by file ID (regenerates code after download)
router.get('/download/:fileId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    console.log('Download route called with fileId:', req.params.fileId);
    const { fileId } = req.params;

    const file = await File.findById(fileId);

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    if (!fs.existsSync(file.filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found on server'
      });
    }

    // Check if 60 seconds have passed since code was entered
    const now = new Date();
    const codeEnteredTime = file.codeEnteredAt;
    const timeDiff = (now - codeEnteredTime) / 1000; // difference in seconds
    
    let newCode = null;
    
    if (codeEnteredTime && timeDiff >= 60) {
      // 60 seconds have passed, regenerate code
      file.isCheckedByAdmin = true;
      file.checkedAt = new Date();
      file.checkedBy = req.user._id;
      
      newCode = file.regenerateCode();
      file.codeEnteredAt = null; // Reset for next time
      await file.save();
    } else if (!codeEnteredTime) {
      // Code was never entered, just mark as checked
      file.isCheckedByAdmin = true;
      file.checkedAt = new Date();
      file.checkedBy = req.user._id;
      await file.save();
    }

    // Set response header to include new code
    if (newCode) {
      res.setHeader('X-New-Upload-Code', newCode);
    }
    
    res.download(file.filePath, file.originalName);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Admin: View file content by file ID (regenerates code after viewing)
router.get('/view/:fileId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    console.log('View route called with fileId:', req.params.fileId);
    const { fileId } = req.params;

    const file = await File.findById(fileId);

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    if (!fs.existsSync(file.filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found on server'
      });
    }

    // Check if 60 seconds have passed since code was entered
    const now = new Date();
    const codeEnteredTime = file.codeEnteredAt;
    const timeDiff = (now - codeEnteredTime) / 1000; // difference in seconds
    
    let newCode = null;
    
    if (codeEnteredTime && timeDiff >= 60) {
      // 60 seconds have passed, regenerate code
      file.isCheckedByAdmin = true;
      file.checkedAt = new Date();
      file.checkedBy = req.user._id;
      
      newCode = file.regenerateCode();
      file.codeEnteredAt = null; // Reset for next time
      await file.save();
    } else if (!codeEnteredTime) {
      // Code was never entered, just mark as checked
      file.isCheckedByAdmin = true;
      file.checkedAt = new Date();
      file.checkedBy = req.user._id;
      await file.save();
    }

    // Set response headers
    if (newCode) {
      res.setHeader('X-New-Upload-Code', newCode);
    }
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${file.originalName}"`);
    
    // Send file content
    res.sendFile(path.resolve(file.filePath));
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Admin: Get all files
router.get('/all', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const files = await File.find()
      .populate('uploadedBy', 'username email')
      .populate('checkedBy', 'username email')
      .select('filename originalName fileSize mimeType uploadCode uploadedBy isCheckedByAdmin checkedAt checkedBy createdAt')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: { files }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;

