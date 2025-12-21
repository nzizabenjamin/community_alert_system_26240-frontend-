# Backend Location Integration Guide

This guide explains what the backend needs to implement to ensure the frontend location functionality works correctly, especially for newly created RESIDENTS.

## Overview

The frontend expects the backend to:
1. Return complete user objects with `locationId` after signup and login
2. Support both `villageCode` and `locationId` for location specification
3. Automatically resolve/create Location entities from `villageCode`
4. Provide a user profile endpoint to refresh user data

## Critical Requirements

### 1. User Object Structure After Signup/Login

When a user signs up or logs in, the backend **MUST** return a user object that includes the `locationId` field.

#### Expected User Object Structure

```json
{
  "id": "user-uuid",
  "fullName": "John Doe",
  "email": "john@example.com",
  "phoneNumber": "+250123456789",
  "role": "RESIDENT",
  "locationId": "location-uuid-here",  // ✅ REQUIRED - Must be present
  "location": {                        // ✅ OPTIONAL - Can be nested object
    "id": "location-uuid-here",
    "name": "Village Name",
    "type": "VILLAGE"
  },
  "createdAt": "2025-01-15T10:30:00Z"
}
```

**Important Notes:**
- `locationId` is **REQUIRED** for RESIDENTS after signup/login
- The backend should automatically set `locationId` when creating a user with `villageCode`
- If `locationId` is missing, the frontend will try to refresh user data, but this should not be necessary

### 2. Signup Endpoint (`POST /api/auth/signup`)

#### Request Body

The frontend sends:
```json
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phoneNumber": "+250123456789",
  "role": "RESIDENT",
  "villageCode": 101080110  // Integer - village code from RwandaLocations
}
```

#### Backend Processing Steps

1. **Validate Input**
   - Validate all required fields
   - Validate `villageCode` exists in RwandaLocations
   - Validate email is unique
   - Validate password strength

2. **Resolve/Create Location**
   ```java
   // Pseudo-code example
   Location location = locationService.resolveOrCreateLocation(villageCode);
   // This should:
   // 1. Look up village in RwandaLocations by villageCode
   // 2. Search for existing Location by name (case-insensitive)
   // 3. Create new Location if not found
   // 4. Return the Location entity
   ```

3. **Create User**
   ```java
   User user = new User();
   user.setFullName(signupData.getFullName());
   user.setEmail(signupData.getEmail());
   user.setPassword(encodedPassword);
   user.setPhoneNumber(signupData.getPhoneNumber());
   user.setRole(signupData.getRole());
   user.setLocation(location);  // ✅ Set the location
   user.setLocationId(location.getId());  // ✅ Set locationId explicitly
   user = userRepository.save(user);
   ```

4. **Return Response**
   ```json
   {
     "token": "jwt-token-here",
     "user": {
       "id": "user-uuid",
       "fullName": "John Doe",
       "email": "john@example.com",
       "phoneNumber": "+250123456789",
       "role": "RESIDENT",
       "locationId": "location-uuid-here",  // ✅ MUST be included
       "createdAt": "2025-01-15T10:30:00Z"
     }
   }
   ```

#### Common Issues to Avoid

❌ **DON'T:**
- Return user without `locationId`
- Return `locationId` as `null` for RESIDENTS
- Skip location creation/resolution

✅ **DO:**
- Always set `locationId` when creating a user
- Validate `villageCode` before creating user
- Return complete user object with `locationId`

### 3. Login Endpoint (`POST /api/auth/login`)

#### Request Body

```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

#### Response (After 2FA if enabled)

```json
{
  "token": "jwt-token-here",
  "user": {
    "id": "user-uuid",
    "fullName": "John Doe",
    "email": "john@example.com",
    "phoneNumber": "+250123456789",
    "role": "RESIDENT",
    "locationId": "location-uuid-here",  // ✅ MUST be included
    "createdAt": "2025-01-15T10:30:00Z"
  }
}
```

**Important:**
- The user object returned after login **MUST** include `locationId`
- Even if the user was created before `locationId` was required, the backend should ensure it's populated
- Consider a migration or data fix for existing users without `locationId`

### 4. User Profile Endpoint (`GET /api/users/me`)

This endpoint is used by the frontend to refresh user data when `locationId` is missing.

#### Endpoint

```
GET /api/users/me
Authorization: Bearer <token>
```

#### Response

```json
{
  "id": "user-uuid",
  "fullName": "John Doe",
  "email": "john@example.com",
  "phoneNumber": "+250123456789",
  "role": "RESIDENT",
  "locationId": "location-uuid-here",  // ✅ MUST be included
  "location": {                         // ✅ OPTIONAL - Can include full location object
    "id": "location-uuid-here",
    "name": "Village Name, Cell Name, Sector Name, District Name, Province Name",
    "type": "VILLAGE"
  },
  "createdAt": "2025-01-15T10:30:00Z"
}
```

#### Implementation Example

```java
@GetMapping("/me")
public ResponseEntity<UserDTO> getCurrentUser(Authentication authentication) {
    String email = authentication.getName();
    User user = userRepository.findByEmail(email)
        .orElseThrow(() -> new UserNotFoundException("User not found"));
    
    // Ensure locationId is set
    if (user.getLocation() != null && user.getLocationId() == null) {
        user.setLocationId(user.getLocation().getId());
        user = userRepository.save(user);
    }
    
    UserDTO userDTO = userMapper.toDTO(user);
    return ResponseEntity.ok(userDTO);
}
```

### 5. Location Resolution from Village Code

When a `villageCode` is provided (in signup or issue creation), the backend should:

#### Step 1: Lookup Village in RwandaLocations

```java
RwandaLocation village = rwandaLocationRepository.findByCode(villageCode)
    .orElseThrow(() -> new VillageNotFoundException("Village not found: " + villageCode));
```

#### Step 2: Build Location String

```java
String locationString = String.format("%s, %s, %s, %s, %s",
    village.getName(),
    village.getCell().getName(),
    village.getSector().getName(),
    village.getDistrict().getName(),
    village.getProvince().getName()
);
```

#### Step 3: Find or Create Location

```java
Location location = locationRepository.findByNameIgnoreCase(locationString)
    .orElseGet(() -> {
        Location newLocation = new Location();
        newLocation.setName(locationString);
        newLocation.setType(LocationType.VILLAGE);
        newLocation.setVillageCode(villageCode);
        return locationRepository.save(newLocation);
    });
```

#### Step 4: Return Location

```java
return location;  // This location should have an ID
```

### 6. Issue Creation Endpoint (`POST /api/issues`)

#### Request Body

```json
{
  "title": "Road pothole",
  "description": "Large pothole on main road",
  "category": "Infrastructure",
  "villageCode": 101080110,  // Integer
  "reportedById": "user-uuid",
  "photoUrl": "https://example.com/photo.jpg",
  "tagIds": ["tag-uuid-1", "tag-uuid-2"]
}
```

#### Backend Processing

1. Validate `villageCode` exists in RwandaLocations
2. Resolve/create Location from `villageCode` (same logic as signup)
3. Create Issue with resolved Location
4. Return Issue with Location details

### 7. Data Migration for Existing Users

If you have existing users without `locationId``, consider a migration:

```java
@Transactional
public void migrateUserLocations() {
    List<User> usersWithoutLocationId = userRepository.findByLocationIdIsNull();
    
    for (User user : usersWithoutLocationId) {
        if (user.getLocation() != null) {
            user.setLocationId(user.getLocation().getId());
            userRepository.save(user);
        } else if (user.getVillageCode() != null) {
            // Try to resolve location from villageCode
            Location location = locationService.resolveOrCreateLocation(user.getVillageCode());
            user.setLocation(location);
            user.setLocationId(location.getId());
            userRepository.save(user);
        }
    }
}
```

## API Endpoints Summary

| Method | Endpoint | Description | Required Response Fields |
|--------|----------|-------------|-------------------------|
| POST | `/api/auth/signup` | User registration | `user.locationId` |
| POST | `/api/auth/login` | User login | `user.locationId` |
| POST | `/api/auth/verify-otp` | 2FA verification | `user.locationId` |
| GET | `/api/users/me` | Get current user | `locationId` |
| GET | `/api/locations/{id}` | Get location by ID | Location details |
| GET | `/api/locations/village/{villageCode}` | Get location by village code | Location with ID |
| POST | `/api/issues` | Create issue | Issue with Location |

## Error Handling

### Missing LocationId

If a user doesn't have a `locationId`:

1. **During Signup/Login:** The backend should automatically set it
2. **For Existing Users:** The backend should populate it when fetching user data
3. **Error Response:** If location cannot be determined, return appropriate error:

```json
{
  "error": "User location information is incomplete",
  "message": "Please contact support to update your location"
}
```

### Invalid Village Code

```json
{
  "error": "Invalid village code",
  "message": "Village code 999999999 does not exist in RwandaLocations"
}
```

## Testing Checklist

### ✅ Signup Flow

- [ ] User signs up with `villageCode`
- [ ] Backend creates/resolves Location
- [ ] User object returned includes `locationId`
- [ ] User can immediately see their location on Locations page

### ✅ Login Flow

- [ ] User logs in
- [ ] User object returned includes `locationId`
- [ ] User can see their location on Locations page

### ✅ User Profile Refresh

- [ ] GET `/api/users/me` returns user with `locationId`
- [ ] Frontend can refresh user data successfully
- [ ] Location loads correctly after refresh

### ✅ Issue Creation

- [ ] Issue created with `villageCode`
- [ ] Location resolved/created correctly
- [ ] Issue linked to correct Location

### ✅ Edge Cases

- [ ] User with missing `locationId` gets it populated on login
- [ ] Invalid `villageCode` returns appropriate error
- [ ] Location resolution works for all village codes
- [ ] Existing users without `locationId` are handled gracefully

## Database Schema Recommendations

### User Entity

```java
@Entity
public class User {
    @Id
    private UUID id;
    
    private String fullName;
    private String email;
    private String password;
    private String phoneNumber;
    private Role role;
    
    @ManyToOne
    @JoinColumn(name = "location_id")
    private Location location;
    
    @Column(name = "location_id", insertable = false, updatable = false)
    private UUID locationId;  // ✅ Denormalized for quick access
    
    private Integer villageCode;  // Optional: store original village code
    
    // Getters and setters
}
```

**Important:**
- `locationId` should be automatically set when `location` is set
- Consider using `@PrePersist` and `@PreUpdate` to sync `locationId` with `location`

### Location Entity

```java
@Entity
public class Location {
    @Id
    private UUID id;
    
    private String name;  // Full location string: "Village, Cell, Sector, District, Province"
    private LocationType type;  // VILLAGE, CELL, SECTOR, etc.
    private Integer villageCode;  // Original village code from RwandaLocations
    
    // Relationships, timestamps, etc.
}
```

## Code Examples

### User Service - Signup Method

```java
@Service
public class UserService {
    
    @Autowired
    private LocationService locationService;
    
    @Autowired
    private UserRepository userRepository;
    
    @Transactional
    public AuthResponse signup(SignupRequest request) {
        // Validate request
        validateSignupRequest(request);
        
        // Resolve/create location from villageCode
        Location location = locationService.resolveOrCreateLocation(request.getVillageCode());
        
        // Create user
        User user = new User();
        user.setFullName(request.getFullName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setPhoneNumber(request.getPhoneNumber());
        user.setRole(request.getRole());
        user.setLocation(location);
        user.setLocationId(location.getId());  // ✅ Explicitly set
        user.setVillageCode(request.getVillageCode());  // Optional: store original
        
        user = userRepository.save(user);
        
        // Generate token
        String token = jwtTokenProvider.generateToken(user.getEmail());
        
        // Return response
        return AuthResponse.builder()
            .token(token)
            .user(userMapper.toDTO(user))  // ✅ DTO must include locationId
            .build();
    }
}
```

### User DTO

```java
public class UserDTO {
    private UUID id;
    private String fullName;
    private String email;
    private String phoneNumber;
    private Role role;
    private UUID locationId;  // ✅ REQUIRED field
    private LocationDTO location;  // Optional: full location object
    private LocalDateTime createdAt;
    
    // Getters and setters
}
```

### User Mapper

```java
@Component
public class UserMapper {
    
    public UserDTO toDTO(User user) {
        UserDTO dto = new UserDTO();
        dto.setId(user.getId());
        dto.setFullName(user.getFullName());
        dto.setEmail(user.getEmail());
        dto.setPhoneNumber(user.getPhoneNumber());
        dto.setRole(user.getRole());
        dto.setLocationId(user.getLocationId());  // ✅ Always set this
        if (user.getLocation() != null) {
            dto.setLocation(locationMapper.toDTO(user.getLocation()));
        }
        dto.setCreatedAt(user.getCreatedAt());
        return dto;
    }
}
```

## Troubleshooting

### Issue: Newly created RESIDENTS don't see their location

**Possible Causes:**
1. `locationId` not set during user creation
2. `locationId` not included in response DTO
3. Location not created/resolved from `villageCode`

**Solution:**
- Check user creation code - ensure `locationId` is set
- Check DTO mapping - ensure `locationId` is included
- Verify location resolution logic works correctly

### Issue: Frontend shows "location information not available"

**Possible Causes:**
1. User object missing `locationId`
2. GET `/api/users/me` not returning `locationId`
3. Location entity doesn't exist

**Solution:**
- Ensure all endpoints return `locationId`
- Check database - verify Location exists
- Run data migration if needed

## Summary

**Key Points:**
1. ✅ Always return `locationId` in user objects after signup/login
2. ✅ Automatically resolve/create Location from `villageCode`
3. ✅ Implement GET `/api/users/me` endpoint
4. ✅ Ensure DTOs include `locationId` field
5. ✅ Handle existing users without `locationId` gracefully
6. ✅ Validate `villageCode` before creating users/issues

Following this guide will ensure the frontend location functionality works correctly for all users, including newly created RESIDENTS.

