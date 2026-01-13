import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    createReport,
    getAllReports,
    getTargetReports,
    getUserReports,
    resolveReport,
    deleteReport,
    getReportStats
} from "../controllers/report.controller.js";

const reportRouter = Router();

// Create a new report
reportRouter.route("/create").post(verifyJWT, createReport);

// Get all reports (admin/moderator use)
reportRouter.route("/").get(verifyJWT, getAllReports);

// Get report statistics (admin dashboard)
reportRouter.route("/stats").get(verifyJWT, getReportStats);

// Get reports for a specific target (post or comment)
reportRouter.route("/:targetType/:targetId").get(verifyJWT, getTargetReports);

// Get user's own reports
reportRouter.route("/user/reports").get(verifyJWT, getUserReports);

// Resolve/unresolve a specific report (admin/moderator use)
reportRouter.route("/:reportId/resolve").put(verifyJWT, resolveReport);

// Delete a specific report
reportRouter.route("/:reportId").delete(verifyJWT, deleteReport);

export default reportRouter;