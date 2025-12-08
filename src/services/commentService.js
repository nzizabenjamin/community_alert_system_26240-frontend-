import api from './api';

export const commentService = {
  // Add comment to issue
  addComment: (issueId, commentData) => {
    return api.post(`/issues/${issueId}/comments`, commentData);
  },

  // Get comments for issue
  getByIssue: (issueId) => {
    return api.get(`/issues/${issueId}/comments`);
  },

  // Delete comment
  delete: (issueId, commentId) => {
    return api.delete(`/issues/${issueId}/comments/${commentId}`);
  }
};