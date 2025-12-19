# Tag Logic Implementation Guide

## Overview
Tags are labels used to classify reported issues. They help categorize issues, filter/search reports, generate statistics, and route issues to the correct authority.

## Role-Based Access Control

| Role | Permissions |
|------|-------------|
| **ADMIN** | Create, rename, activate/deactivate, delete tags |
| **RESIDENT** | Select tags from existing active tags when reporting issues |
| **System** | Validates and links tags to issues |

## Implementation Details

### 1. Tag Model
- Added `active` field (boolean, default: true)
- Tags can be deactivated (soft delete) without removing them from existing issues
- Active tags are visible to residents for selection

### 2. Tag Management (ADMIN Only)

#### Create Tag
```
POST /api/tags
Authorization: Bearer <admin-token>
Body: {
  "name": "Urgent",
  "description": "Requires immediate attention"
}
```

#### Update Tag (Rename, Change Description, Activate/Deactivate)
```
PUT /api/tags/{id}
Authorization: Bearer <admin-token>
Body: {
  "name": "Urgent",
  "description": "Updated description",
  "active": true
}
```

#### Deactivate Tag (Soft Delete)
```
PUT /api/tags/{id}/deactivate
Authorization: Bearer <admin-token>
```

#### Activate Tag
```
PUT /api/tags/{id}/activate
Authorization: Bearer <admin-token>
```

#### Delete Tag (Permanent - Removes from all issues)
```
DELETE /api/tags/{id}
Authorization: Bearer <admin-token>
```

### 3. Tag Selection (RESIDENT)

#### Get Active Tags (for selection)
```
GET /api/tags/active
Authorization: Bearer <resident-token>
```

#### Get All Tags (Role-Based)
- **ADMIN**: Sees all tags (active and inactive)
- **RESIDENT**: Sees only active tags
```
GET /api/tags?page=0&size=10
Authorization: Bearer <token>
```

### 4. Issue Creation with Tags

#### Create Issue with Tags
```
POST /api/issues
Authorization: Bearer <resident-token>
Body: {
  "title": "Pothole on Main Street",
  "description": "Large pothole causing damage to vehicles",
  "category": "Infrastructure",
  "locationId": "<uuid>",
  "reportedById": "<uuid>",
  "photoUrl": "https://...",
  "tagIds": ["<tag-uuid-1>", "<tag-uuid-2>"]  // Selected tags
}
```

**Validation:**
- System validates that all tag IDs exist
- System validates that all tags are active
- If validation fails, issue creation is rejected with error message

## API Endpoints Summary

### Tag Management Endpoints

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| POST | `/api/tags` | ADMIN | Create new tag |
| GET | `/api/tags` | ALL | Get tags (filtered by role) |
| GET | `/api/tags/active` | ALL | Get all active tags |
| GET | `/api/tags/{id}` | ALL | Get tag by ID |
| GET | `/api/tags/search?q=query` | ALL | Search tags |
| PUT | `/api/tags/{id}` | ADMIN | Update tag |
| PUT | `/api/tags/{id}/activate` | ADMIN | Activate tag |
| PUT | `/api/tags/{id}/deactivate` | ADMIN | Deactivate tag |
| DELETE | `/api/tags/{id}` | ADMIN | Delete tag permanently |
| GET | `/api/tags/used` | ALL | Get tags used in issues |
| GET | `/api/tags/unused` | ALL | Get tags not used in any issue |

## Frontend Integration Guide

### For Residents (Issue Reporting)

1. **Fetch Active Tags for Selection**
```javascript
// Get active tags for dropdown/checkbox list
const response = await api.get('/tags/active');
const activeTags = response.data;
```

2. **Create Issue with Selected Tags**
```javascript
const createIssue = async (issueData, selectedTagIds) => {
  const payload = {
    ...issueData,
    tagIds: selectedTagIds  // Array of tag UUIDs
  };
  
  return await api.post('/issues', payload);
};
```

### For Admins (Tag Management)

1. **Create Tag**
```javascript
const createTag = async (tagData) => {
  // Only admins can do this
  return await api.post('/tags', {
    name: tagData.name,
    description: tagData.description
  });
};
```

2. **Update Tag**
```javascript
const updateTag = async (tagId, tagData) => {
  return await api.put(`/tags/${tagId}`, {
    name: tagData.name,
    description: tagData.description,
    active: tagData.active
  });
};
```

3. **Deactivate Tag**
```javascript
const deactivateTag = async (tagId) => {
  return await api.put(`/tags/${tagId}/deactivate`);
};
```

4. **View All Tags (Including Inactive)**
```javascript
// Admin sees all tags
const response = await api.get('/tags', {
  params: { page: 0, size: 100 }
});
const allTags = response.data.content;
```

## Error Handling

### Common Errors

1. **403 Forbidden** - Non-admin trying to create/update/delete tags
   ```json
   {
     "error": "Only administrators can create tags"
   }
   ```

2. **400 Bad Request** - Invalid tag selection
   ```json
   {
     "error": "Tag with ID <uuid> not found"
   }
   ```

3. **400 Bad Request** - Inactive tag selected
   ```json
   {
     "error": "Tag 'Urgent' is not active and cannot be selected"
   }
   ```

## Database Migration

The `active` field has been added to the Tag entity. When you run the application:
- Existing tags will have `active = true` by default
- New tags will be active by default
- Deactivated tags remain in the database but are hidden from residents

## Testing Checklist

### As ADMIN:
- [ ] Create a new tag
- [ ] Update tag name and description
- [ ] Deactivate a tag
- [ ] Activate a deactivated tag
- [ ] Delete a tag permanently
- [ ] View all tags (including inactive ones)
- [ ] Verify deactivated tags don't appear in `/api/tags/active`

### As RESIDENT:
- [ ] View active tags list (`/api/tags/active`)
- [ ] Select tags when creating an issue
- [ ] Verify cannot create new tags (should get 403)
- [ ] Verify cannot update tags (should get 403)
- [ ] Verify cannot see inactive tags in selection list
- [ ] Verify cannot select inactive tags (validation error)

### System Validation:
- [ ] Try to create issue with non-existent tag ID → Should fail
- [ ] Try to create issue with inactive tag ID → Should fail
- [ ] Create issue with valid active tags → Should succeed
- [ ] Verify tags are linked to issues correctly

## Best Practices

1. **Tag Naming**: Use clear, descriptive names (e.g., "Urgent", "Infrastructure", "Safety")
2. **Tag Descriptions**: Add descriptions to help residents understand when to use each tag
3. **Deactivation vs Deletion**: 
   - Use deactivation for tags that might be needed again
   - Use deletion only when you're sure the tag won't be needed
4. **Tag Selection**: Residents can select multiple tags per issue
5. **Validation**: Always validate tag IDs and active status on the backend

## Statistics Use Cases

Tags enable statistics like:
- "Top 3 most used tags this month"
- "Issues by tag category"
- "Most urgent issues (tagged as 'Urgent')"
- "Tags that need attention (many issues but unresolved)"

These can be implemented by querying issues grouped by tags.

