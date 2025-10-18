import prisma from "../lib/prisma.js";

export type AccessLevel = "owner" | "edit" | "view" | "none";

export class AuthorizationService {
  /**
   * Check if user has access to a presentation
   * @returns Access level: "owner" | "edit" | "view" | "none"
   */
  static async checkPresentationAccess(
    userId: string | null,
    presentationId: string,
    shareId?: string
  ): Promise<{
    hasAccess: boolean;
    accessLevel: AccessLevel;
    presentation?: any;
  }> {
    // Get presentation
    const presentation = await prisma.presentation.findUnique({
      where: { id: presentationId },
      include: {
        slides: {
          orderBy: { position: "asc" },
        },
      },
    });

    if (!presentation) {
      return { hasAccess: false, accessLevel: "none" };
    }

    // Check if user is owner
    if (userId && presentation.userId === userId) {
      return {
        hasAccess: true,
        accessLevel: "owner",
        presentation: { ...presentation, accessLevel: "owner" },
      };
    }

    // Check if accessing via share link
    if (shareId) {
      const share = await prisma.share.findUnique({
        where: { shareId },
        include: {
          slide: true,
        },
      });

      if (!share || share.presentationId !== presentationId) {
        return { hasAccess: false, accessLevel: "none" };
      }

      // Check if share has expired
      if (share.expiresAt && share.expiresAt < new Date()) {
        return { hasAccess: false, accessLevel: "none" };
      }

      // Filter to only shared slide if single slide share
      let filteredPresentation = presentation;
      if (share.type === "SLIDE" && share.slide) {
        filteredPresentation = {
          ...presentation,
          slides: [share.slide],
        };
      }

      const accessLevel = share.permission as AccessLevel;

      return {
        hasAccess: true,
        accessLevel,
        presentation: {
          ...filteredPresentation,
          accessLevel,
          shareType: share.type,
          sharedSlideId: share.slideId,
        },
      };
    }

    // No access
    return { hasAccess: false, accessLevel: "none" };
  }

  /**
   * Check if user can edit a presentation
   */
  static async canEditPresentation(
    userId: string | null,
    presentationId: string,
    shareId?: string
  ): Promise<boolean> {
    const { hasAccess, accessLevel } = await this.checkPresentationAccess(
      userId,
      presentationId,
      shareId
    );

    return hasAccess && (accessLevel === "owner" || accessLevel === "edit");
  }

  /**
   * Check if user can share a presentation
   */
  static async canSharePresentation(
    userId: string | null,
    presentationId: string
  ): Promise<boolean> {
    if (!userId) return false;

    const { hasAccess, accessLevel } = await this.checkPresentationAccess(
      userId,
      presentationId
    );

    return hasAccess && accessLevel === "owner";
  }
}
