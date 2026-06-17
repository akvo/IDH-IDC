import api from "../../lib/api";

const AcademyService = {
  /**
   * Fetches the list of available courses (metadata).
   */
  getCourses: async () => {
    try {
      const response = await api.get("academy/courses");
      return response.data;
    } catch (error) {
      console.error("Error fetching courses:", error);
      throw error;
    }
  },

  /**
   * Fetches a specific course JSON by its ID.
   */
  getCourse: async (courseId) => {
    try {
      // In PoC, we fetch directly from the assets hosted by the backend
      const response = await api.get(
        `/assets/academy/courses/${courseId}.json`
      );
      return response.data;
    } catch (error) {
      console.error(`Error fetching course ${courseId}:`, error);
      throw error;
    }
  },

  /**
   * Fetches user progress for all courses or a specific one.
   */
  getProgress: async () => {
    try {
      const response = await api.get("academy/progress");
      return response.data;
    } catch (error) {
      console.error("Error fetching progress:", error);
      return {}; // Return empty progress on error for PoC resilience
    }
  },

  /**
   * Syncs user progress to the backend.
   * @param {Object} progress - { courseId, currentChapterId, quizScores: { chapterId: score } }
   */
  syncProgress: async (progress) => {
    try {
      const response = await api.post("academy/progress", progress);
      return response.data;
    } catch (error) {
      console.error("Error syncing progress:", error);
      throw error;
    }
  },
};

export default AcademyService;
