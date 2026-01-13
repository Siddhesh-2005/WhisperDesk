import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import Report from "../models/report.model.js";
import { Post } from "../models/post.model.js";
import { Comment } from "../models/comment.model.js";
import mongoose from "mongoose";

// Create a new report
export const createReport = asyncHandler(async (req, res) => {
    const { targetType, targetId, reason } = req.body;
    const reporterId = req.user._id;

    // Validate required fields
    if (!targetType || !targetId || !reason) {
        throw new ApiError(400, "Target type, target ID, and reason are required");
    }

    // Validate targetType
    if (!["POST", "COMMENT"].includes(targetType)) {
        throw new ApiError(400, "Target type must be either POST or COMMENT");
    }

    // Validate reason
    if (!["SPAM", "ABUSE", "HATE", "OTHER"].includes(reason)) {
        throw new ApiError(400, "Invalid reason provided");
    }

    // Validate targetId
    if (!mongoose.Types.ObjectId.isValid(targetId)) {
        throw new ApiError(400, "Invalid target ID");
    }

    // Check if target exists
    let target;
    if (targetType === "POST") {
        target = await Post.findById(targetId);
    } else if (targetType === "COMMENT") {
        target = await Comment.findById(targetId);
    }

    if (!target) {
        throw new ApiError(404, `${targetType.toLowerCase()} not found`);
    }

    // Check if user has already reported this target
    const existingReport = await Report.findOne({
        targetType,
        targetId,
        reporterId
    });

    if (existingReport) {
        throw new ApiError(409, "You have already reported this content");
    }

    // Create the report
    const report = await Report.create({
        targetType,
        targetId,
        reporterId,
        reason
    });

    if (targetType === "POST") {
        await Post.findByIdAndUpdate(targetId, { $inc: { reportsCount: 1 } });
    }

    // Populate reporter information
    const populatedReport = await Report.findById(report._id)
        .populate('reporterId', 'username')
        .lean();

    return res.status(201).json(
        new ApiResponse(201, populatedReport, "Report created successfully")
    );
});

// Get all reports (for admin/moderator use)
export const getAllReports = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Filter options
    const { targetType, reason, resolved } = req.query;
    const filter = {};

    if (targetType && ["POST", "COMMENT"].includes(targetType)) {
        filter.targetType = targetType;
    }

    if (reason && ["SPAM", "ABUSE", "HATE", "OTHER"].includes(reason)) {
        filter.reason = reason;
    }

    if (resolved !== undefined) {
        filter.resolved = resolved === 'true';
    }

    const reports = await Report.find(filter)
        .populate('reporterId', 'username')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

    const totalReports = await Report.countDocuments(filter);

    const pagination = {
        currentPage: page,
        totalPages: Math.ceil(totalReports / limit),
        totalReports,
        hasNextPage: page < Math.ceil(totalReports / limit),
        hasPrevPage: page > 1
    };

    return res.status(200).json(
        new ApiResponse(200, {
            reports,
            pagination
        }, "Reports retrieved successfully")
    );
});

// Get reports for a specific target
export const getTargetReports = asyncHandler(async (req, res) => {
    const { targetType, targetId } = req.params;

    // Validate targetType
    if (!["POST", "COMMENT"].includes(targetType.toUpperCase())) {
        throw new ApiError(400, "Target type must be either POST or COMMENT");
    }

    // Validate targetId
    if (!mongoose.Types.ObjectId.isValid(targetId)) {
        throw new ApiError(400, "Invalid target ID");
    }

    const reports = await Report.find({
        targetType: targetType.toUpperCase(),
        targetId
    })
    .populate('reporterId', 'username')
    .sort({ createdAt: -1 })
    .lean();

    // Get report summary
    const reportSummary = await Report.aggregate([
        {
            $match: {
                targetType: targetType.toUpperCase(),
                targetId: new mongoose.Types.ObjectId(targetId)
            }
        },
        {
            $group: {
                _id: "$reason",
                count: { $sum: 1 }
            }
        }
    ]);

    const totalReports = reports.length;
    const resolvedReports = reports.filter(report => report.resolved).length;

    return res.status(200).json(
        new ApiResponse(200, {
            reports,
            summary: {
                totalReports,
                resolvedReports,
                pendingReports: totalReports - resolvedReports,
                reasonBreakdown: reportSummary
            }
        }, "Target reports retrieved successfully")
    );
});

// Get user's reports
export const getUserReports = asyncHandler(async (req, res) => {
    const reporterId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const reports = await Report.find({ reporterId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

    const totalReports = await Report.countDocuments({ reporterId });

    const pagination = {
        currentPage: page,
        totalPages: Math.ceil(totalReports / limit),
        totalReports,
        hasNextPage: page < Math.ceil(totalReports / limit),
        hasPrevPage: page > 1
    };

    return res.status(200).json(
        new ApiResponse(200, {
            reports,
            pagination
        }, "User reports retrieved successfully")
    );
});

// Resolve a report (for admin/moderator use)
export const resolveReport = asyncHandler(async (req, res) => {
    const { reportId } = req.params;
    const { resolved } = req.body;

    if (!mongoose.Types.ObjectId.isValid(reportId)) {
        throw new ApiError(400, "Invalid report ID");
    }

    if (typeof resolved !== 'boolean') {
        throw new ApiError(400, "Resolved status must be a boolean value");
    }

    const report = await Report.findById(reportId);
    if (!report) {
        throw new ApiError(404, "Report not found");
    }

    report.resolved = resolved;
    await report.save();

    const updatedReport = await Report.findById(reportId)
        .populate('reporterId', 'username')
        .lean();

    return res.status(200).json(
        new ApiResponse(200, updatedReport, `Report ${resolved ? 'resolved' : 'reopened'} successfully`)
    );
});

// Delete a report
export const deleteReport = asyncHandler(async (req, res) => {
    const { reportId } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(reportId)) {
        throw new ApiError(400, "Invalid report ID");
    }

    const report = await Report.findById(reportId);
    if (!report) {
        throw new ApiError(404, "Report not found");
    }

    // Check if user is the reporter (users can only delete their own reports)
    if (report.reporterId.toString() !== userId.toString()) {
        throw new ApiError(403, "You can only delete your own reports");
    }

    await Report.findByIdAndDelete(reportId);

    return res.status(200).json(
        new ApiResponse(200, {}, "Report deleted successfully")
    );
});

// Get report statistics (for admin dashboard)
export const getReportStats = asyncHandler(async (req, res) => {
    const stats = await Report.aggregate([
        {
            $group: {
                _id: null,
                totalReports: { $sum: 1 },
                resolvedReports: {
                    $sum: { $cond: ["$resolved", 1, 0] }
                },
                pendingReports: {
                    $sum: { $cond: ["$resolved", 0, 1] }
                }
            }
        }
    ]);

    const reasonStats = await Report.aggregate([
        {
            $group: {
                _id: "$reason",
                count: { $sum: 1 }
            }
        },
        {
            $sort: { count: -1 }
        }
    ]);

    const targetTypeStats = await Report.aggregate([
        {
            $group: {
                _id: "$targetType",
                count: { $sum: 1 }
            }
        }
    ]);

    const recentReports = await Report.find()
        .populate('reporterId', 'username')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean();

    return res.status(200).json(
        new ApiResponse(200, {
            overview: stats[0] || { totalReports: 0, resolvedReports: 0, pendingReports: 0 },
            reasonBreakdown: reasonStats,
            targetTypeBreakdown: targetTypeStats,
            recentReports
        }, "Report statistics retrieved successfully")
    );
});