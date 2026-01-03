/**
 * Utility functions for userData initialization
 */

/**
 * Creates default userData structure for new users or initialization
 */
export const createDefaultUserData = (userId: string) => ({
  userId,
  purchasedProducts: [],
  interviewProgress: {
    documentsUploaded: false,
    voiceInterview: false,
    mcqTest: false,
    codingChallenge: false,
  },
  idVerificationStatus: 'not-started' as const,
  referenceCheckStatus: 'not-started' as const,
});
