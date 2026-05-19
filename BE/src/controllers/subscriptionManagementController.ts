import { Request, Response } from "express";
import mongoose from "mongoose";
import Subscription from "../models/subscriptionModel.js";
import Plan from "../models/planModel.js";
import Court from "../models/courtModel.js";

/**
 * GET /api/subscriptions/my-status
 * 
 * Fetches the currently authenticated owner's active subscription status.
 * If no subscription is active, it returns a simulated "starter" plan subscription 
 * to guarantee that the frontend renders without error.
 */
export async function getCurrentSubscriptionStatus(req: Request, res: Response): Promise<void> {
  try {
    const user = req.user as any;
    const ownerId = user?._id || user?.id;
    if (!ownerId) {
      res.status(401).json({
        success: false,
        message: "Unauthorized. Owner context is missing.",
        error: "unauthorized"
      });
      return;
    }

    // Query the latest active subscription for this owner, sorting by end date
    const subscription = await Subscription.findOne({
      ownerId: new mongoose.Types.ObjectId(String(ownerId)),
      status: "active",
    })
      .sort({ endDate: -1 })
      .populate("planId", "name displayName description pricing features sortOrder isCustom isActive");

    if (subscription) {
      res.status(200).json({
        success: true,
        subscription,
      });
      return;
    }

    // Fallback: If no active subscription is found in DB, query the seeded "starter" plan
    const starterPlan = (await Plan.findOne({ name: "starter" }).lean()) as any;
    
    const simulatedFeatures = starterPlan?.features || {
      max_locations: 1,
      max_courts: 3,
      max_bookings_per_month: 50,
      online_booking: true,
      ai_matchmaking: false,
      api_integration: false,
      analytics_dashboard: false,
      priority_support: false,
      custom_branding: false,
    };

    const simulatedPlan = starterPlan || {
      _id: new mongoose.Types.ObjectId("65b2a3a4c5d6e7f8a9b0c1d1"),
      name: "starter",
      displayName: "Khởi Nghiệp",
      description: "Dành cho chủ sân mới bắt đầu, muốn trải nghiệm nền tảng.",
      pricing: { monthly: 0, yearly: 0 },
      features: simulatedFeatures,
      sortOrder: 1,
      isCustom: false,
      isActive: true,
    };

    // Construct high-fidelity mock subscription
    const simulatedSubscription = {
      _id: "simulated_starter_sub_id",
      ownerId: new mongoose.Types.ObjectId(String(ownerId)),
      planId: simulatedPlan,
      status: "active",
      billingCycle: "monthly",
      startDate: new Date(),
      endDate: new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000), // Far future mock expiry
      currentFeatures: simulatedFeatures,
      amountPaid: 0,
      isSimulated: true,
    };

    res.status(200).json({
      success: true,
      subscription: simulatedSubscription,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "unknown error";
    console.error("[subscriptionManagementController] getCurrentSubscriptionStatus error:", errorMessage);
    res.status(500).json({
      success: false,
      message: "Failed to fetch subscription status.",
      error: errorMessage,
    });
  }
}

/**
 * POST /api/subscriptions/validate-action
 * 
 * Compares the owner's CURRENT active subscription against a TARGET plan
 * to determine the valid billing operations: Upgrade, Renew, or Downgrade.
 * 
 * Request Body:
 *   { targetPlanId: string, billingCycle?: 'monthly' | 'yearly' }
 */
export async function validateSubscriptionAction(req: Request, res: Response): Promise<void> {
  try {
    const user = req.user as any;
    const ownerId = user?._id || user?.id;
    if (!ownerId) {
      res.status(401).json({
        success: false,
        message: "Unauthorized. Owner context is missing.",
        error: "unauthorized"
      });
      return;
    }

    const { targetPlanId, billingCycle } = req.body as {
      targetPlanId?: string;
      billingCycle?: "monthly" | "yearly";
    };

    if (!targetPlanId || !mongoose.Types.ObjectId.isValid(targetPlanId)) {
      res.status(400).json({
        success: false,
        message: "A valid targetPlanId is required.",
        error: "invalid_target_plan_id"
      });
      return;
    }

    const chosenCycle = billingCycle || "monthly";

    // 1. Fetch the target Plan
    const targetPlan = (await Plan.findById(targetPlanId)) as any;
    if (!targetPlan) {
      res.status(404).json({
        success: false,
        message: "Target plan not found.",
        error: "target_plan_not_found"
      });
      return;
    }

    if (!targetPlan.isActive) {
      res.status(400).json({
        success: false,
        message: "Target plan is currently inactive and cannot be selected.",
        error: "target_plan_inactive"
      });
      return;
    }

    // 2. Fetch the current active subscription
    const currentSub = await Subscription.findOne({
      ownerId: new mongoose.Types.ObjectId(String(ownerId)),
      status: "active",
    })
      .sort({ endDate: -1 })
      .populate("planId");

    // 3. Resolve the current plan data (use simulated Starter if no subscription exists in database)
    let currentSubscription: any = currentSub;
    let currentPlan: any = currentSub?.planId;

    if (!currentSub) {
      // Simulate Starter subscription
      const starterPlan = (await Plan.findOne({ name: "starter" }).lean()) as any;
      const simulatedFeatures = starterPlan?.features || {
        max_locations: 1,
        max_courts: 3,
        max_bookings_per_month: 50,
        online_booking: true,
        ai_matchmaking: false,
        api_integration: false,
        analytics_dashboard: false,
        priority_support: false,
        custom_branding: false,
      };

      currentPlan = starterPlan || {
        _id: new mongoose.Types.ObjectId("65b2a3a4c5d6e7f8a9b0c1d1"),
        name: "starter",
        displayName: "Khởi Nghiệp",
        pricing: { monthly: 0, yearly: 0 },
        features: simulatedFeatures,
        sortOrder: 1,
        isCustom: false,
        isActive: true,
      };

      currentSubscription = {
        _id: "simulated_starter_sub_id",
        ownerId: new mongoose.Types.ObjectId(String(ownerId)),
        planId: currentPlan._id,
        status: "active",
        billingCycle: "monthly",
        startDate: new Date(),
        endDate: new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000),
        currentFeatures: simulatedFeatures,
        amountPaid: 0,
        isSimulated: true,
      };
    }

    const currentSortOrder = currentPlan.sortOrder;
    const targetSortOrder = targetPlan.sortOrder;

    // ─── CASE A: RENEW (Same tier) ───────────────────────────────────────────────
    if (targetSortOrder === currentSortOrder) {
      let basePrice = 0;
      if (chosenCycle === "yearly") {
        basePrice = Math.round(targetPlan.pricing.monthly * 12 * 0.8);
      } else {
        basePrice = targetPlan.pricing.monthly;
      }

      let daysRemaining = 0;
      let closeToExpiry = false;

      if (currentSubscription && !currentSubscription.isSimulated) {
        const now = new Date();
        const remainingMs = currentSubscription.endDate.getTime() - now.getTime();
        if (remainingMs > 0) {
          daysRemaining = Math.ceil(remainingMs / (1000 * 60 * 60 * 24));
          // Propose renewal recommendation if less than 7 days left
          if (daysRemaining <= 7) {
            closeToExpiry = true;
          }
        }
      }

      res.status(200).json({
        success: true,
        action: "renew",
        allowed: true,
        message: currentPlan.name === "starter"
          ? "Gói Khởi Nghiệp là gói miễn phí trọn đời, không cần gia hạn."
          : "Yêu cầu gia hạn gói hợp lệ.",
        billingCycle: chosenCycle,
        closeToExpiry,
        currentPlan: {
          id: String(currentPlan._id),
          name: currentPlan.name,
          displayName: currentPlan.displayName,
          sortOrder: currentPlan.sortOrder,
        },
        pricing: {
          basePrice,
          unusedCredit: 0,
          netAmount: basePrice,
          daysRemaining,
        }
      });
      return;
    }

    // ─── CASE B: UPGRADE (Higher tier) ───────────────────────────────────────────
    if (targetSortOrder > currentSortOrder) {
      let basePrice = 0;
      if (chosenCycle === "yearly") {
        basePrice = Math.round(targetPlan.pricing.monthly * 12 * 0.8);
      } else {
        basePrice = targetPlan.pricing.monthly;
      }

      let unusedCredit = 0;
      let daysRemaining = 0;
      let netAmount = basePrice;

      // Unused credit calculations on upgrades (pro-rata logic)
      if (currentSubscription && !currentSubscription.isSimulated && currentSubscription.amountPaid > 0) {
        const now = new Date();
        const totalDurationMs = currentSubscription.endDate.getTime() - currentSubscription.startDate.getTime();
        const remainingDurationMs = currentSubscription.endDate.getTime() - now.getTime();

        if (totalDurationMs > 0 && remainingDurationMs > 0) {
          daysRemaining = Math.ceil(remainingDurationMs / (1000 * 60 * 60 * 24));
          const remainingRatio = remainingDurationMs / totalDurationMs;
          unusedCredit = Math.round(currentSubscription.amountPaid * remainingRatio);
          netAmount = Math.max(0, basePrice - unusedCredit);
        }
      }

      res.status(200).json({
        success: true,
        action: "upgrade",
        allowed: true,
        message: "Yêu cầu nâng cấp gói hợp lệ.",
        billingCycle: chosenCycle,
        currentPlan: {
          id: String(currentPlan._id),
          name: currentPlan.name,
          displayName: currentPlan.displayName,
          sortOrder: currentPlan.sortOrder,
        },
        targetPlan: {
          id: String(targetPlan._id),
          name: targetPlan.name,
          displayName: targetPlan.displayName,
          sortOrder: targetPlan.sortOrder,
        },
        pricing: {
          basePrice,
          unusedCredit,
          netAmount,
          daysRemaining,
        }
      });
      return;
    }

    // ─── CASE C: DOWNGRADE (Lower tier) ──────────────────────────────────────────
    // Downgrades are blocked automatically. We count user footprint dynamically 
    // to map out explicit resource violations and feature losses.
    if (targetSortOrder < currentSortOrder) {
      // 1. Fetch location (Court documents) footprint
      const locationCount = await Court.countDocuments({ owner_id: new mongoose.Types.ObjectId(String(ownerId)) });
      
      // 2. Fetch individual sub-courts footprint
      const courtsList = await Court.find({ owner_id: new mongoose.Types.ObjectId(String(ownerId)) });
      let subCourtsCount = 0;
      for (const court of courtsList) {
        subCourtsCount += court.sub_courts?.length || 0;
      }

      const errors: string[] = [];
      const recommendations: string[] = [];
      const targetFeatures = targetPlan.features;

      // Check resource limits
      if (targetFeatures.max_locations !== -1 && locationCount > targetFeatures.max_locations) {
        errors.push(`Số lượng cơ sở hiện tại của bạn (${locationCount}) vượt quá giới hạn gói mới (${targetFeatures.max_locations} cơ sở).`);
        recommendations.push(`Vui lòng xóa bớt ít nhất ${locationCount - targetFeatures.max_locations} cơ sở trước khi thực hiện hạ cấp.`);
      }

      if (targetFeatures.max_courts !== -1 && subCourtsCount > targetFeatures.max_courts) {
        errors.push(`Số lượng sân chơi hiện tại của bạn (${subCourtsCount}) vượt quá giới hạn gói mới (${targetFeatures.max_courts} sân).`);
        recommendations.push(`Vui lòng xóa bớt ít nhất ${subCourtsCount - targetFeatures.max_courts} sân chơi trước khi thực hiện hạ cấp.`);
      }

      // Check feature losses
      const featureLosses: string[] = [];
      const currentFeatures = currentPlan.features;

      if (currentFeatures.ai_matchmaking && !targetFeatures.ai_matchmaking) {
        featureLosses.push("Ghép cặp thông minh bằng AI (AI Matchmaking)");
      }
      if (currentFeatures.api_integration && !targetFeatures.api_integration) {
        featureLosses.push("Tích hợp API hệ thống (API Integration)");
      }
      if (currentFeatures.analytics_dashboard && !targetFeatures.analytics_dashboard) {
        featureLosses.push("Báo cáo phân tích nâng cao (Analytics Dashboard)");
      }
      if (currentFeatures.priority_support && !targetFeatures.priority_support) {
        featureLosses.push("Hỗ trợ kỹ thuật ưu tiên (Priority Support)");
      }
      if (currentFeatures.custom_branding && !targetFeatures.custom_branding) {
        featureLosses.push("Tùy biến thương hiệu riêng (Custom Branding)");
      }

      res.status(400).json({
        success: false,
        action: "downgrade",
        allowed: false,
        message: "Yêu cầu hạ cấp gói đã bị từ chối tự động.",
        reason: errors.length > 0 
          ? "Dữ liệu hiện tại vượt quá giới hạn tối đa cho phép của gói hạ cấp." 
          : "Hạ cấp sẽ làm vô hiệu hóa một số tính năng nâng cao.",
        details: {
          currentUsage: {
            locations: locationCount,
            courts: subCourtsCount,
          },
          targetLimits: {
            locations: targetFeatures.max_locations,
            courts: targetFeatures.max_courts,
          },
          violations: errors,
          recommendations,
          featureLosses,
        },
        warningMessage: errors.length > 0
          ? `Hạ cấp thất bại: Gói ${targetPlan.displayName} giới hạn tối đa ${targetFeatures.max_locations} cơ sở và ${targetFeatures.max_courts} sân. Hiện tại bạn đang hoạt động với ${locationCount} cơ sở và ${subCourtsCount} sân. Vui lòng cắt giảm cơ sở/sân thừa để tiếp tục.`
          : `Gói ${targetPlan.displayName} sẽ thu hồi một số đặc quyền cao cấp: ${featureLosses.join(", ")}. Việc hạ cấp gói tự động bị khóa, vui lòng liên hệ bộ phận CSKH hỗ trợ giao dịch chuyển vùng dữ liệu an toàn.`
      });
      return;
    }

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "unknown error";
    console.error("[subscriptionManagementController] validateSubscriptionAction error:", errorMessage);
    res.status(500).json({
      success: false,
      message: "Failed to validate subscription action.",
      error: errorMessage,
    });
  }
}
