# Backend Role Fix Guide

## Critical Issue: User Role is Null

### Problem Description

The frontend is receiving user objects with `role: null` instead of the expected role value (e.g., `'RESIDENT'` or `'ADMIN'`). This causes the frontend to not properly identify user permissions and access levels.

### Current Behavior (Incorrect)

```json
{
  "id": "fc65c6f5-2b0a-4be6-a643-60b1c59149b8",
  "fullName": "Shema Owen",
  "email": "shema@gmail.com",
  "phoneNumber": "+250 789 476 374",
  "role": null,  // ❌ PROBLEM: Role is null
  "locationId": "db08c87b-ed75-4b7b-8d67-e17f5db5a93c"
}
```

### Expected Behavior (Correct)

```json
{
  "id": "fc65c6f5-2b0a-4be6-a643-60b1c59149b8",
  "fullName": "Shema Owen",
  "email": "shema@gmail.com",
  "phoneNumber": "+250 789 476 374",
  "role": "RESIDENT",  // ✅ CORRECT: Role is set
  "locationId": "db08c87b-ed75-4b7b-8d67-e17f5db5a93c"
}
```

## Root Cause Analysis

The role field is likely:
1. Not being set during user creation (signup)
2. Not being included in the DTO mapping
3. Being set to null in the database
4. Not being populated from the database when fetching user data

## Required Fixes

### 1. User Entity/Database

Ensure the `role` field is:
- **NOT NULL** in the database schema
- Has a default value (e.g., `'RESIDENT'`)
- Is properly mapped in the entity class

#### Database Schema Example

```sql
ALTER TABLE users 
MODIFY COLUMN role VARCHAR(50) NOT NULL DEFAULT 'RESIDENT';

-- Or if using enum:
ALTER TABLE users 
MODIFY COLUMN role ENUM('ADMIN', 'RESIDENT') NOT NULL DEFAULT 'RESIDENT';
```

#### Entity Class Example (Java/Spring)

```java
@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(nullable = false)
    private String fullName;
    
    @Column(nullable = false, unique = true)
    private String email;
    
    @Column(nullable = false)
    private String password;
    
    private String phoneNumber;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role = Role.RESIDENT;  // ✅ Default value
    
    @ManyToOne
    @JoinColumn(name = "location_id")
    private Location location;
    
    @Column(name = "location_id", insertable = false, updatable = false)
    private UUID locationId;
    
    // Getters and setters
}

public enum Role {
    ADMIN,
    RESIDENT
}
```

### 2. Signup Endpoint (`POST /api/auth/signup`)

#### Request Body

```json
{
  "fullName": "Shema Owen",
  "email": "shema@gmail.com",
  "password": "password123",
  "phoneNumber": "+250 789 476 374",
  "role": "RESIDENT",  // Optional: can default to RESIDENT if not provided
  "villageCode": 101080110
}
```

#### Backend Implementation

```java
@Service
public class AuthService {
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private LocationService locationService;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
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
        
        // ✅ CRITICAL: Set role - default to RESIDENT if not provided
        if (request.getRole() != null && !request.getRole().isEmpty()) {
            try {
                user.setRole(Role.valueOf(request.getRole().toUpperCase()));
            } catch (IllegalArgumentException e) {
                user.setRole(Role.RESIDENT); // Default to RESIDENT if invalid
            }
        } else {
            user.setRole(Role.RESIDENT); // ✅ Default to RESIDENT
        }
        
        user.setLocation(location);
        user.setLocationId(location.getId());
        
        // Save user
        user = userRepository.save(user);
        
        // Generate token
        String token = jwtTokenProvider.generateToken(user.getEmail());
        
        // Map to DTO - ✅ Ensure role is included
        UserDTO userDTO = userMapper.toDTO(user);
        
        return AuthResponse.builder()
            .token(token)
            .user(userDTO)  // ✅ Must include role
            .build();
    }
}
```

### 3. Login Endpoint (`POST /api/auth/login`)

#### Response

```java
@Service
public class AuthService {
    
    public AuthResponse login(LoginRequest request) {
        // Authenticate user
        User user = userRepository.findByEmail(request.getEmail())
            .orElseThrow(() -> new BadCredentialsException("Invalid credentials"));
        
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new BadCredentialsException("Invalid credentials");
        }
        
        // ✅ CRITICAL: Ensure role is set (handle legacy users)
        if (user.getRole() == null) {
            // Default to RESIDENT for users without role
            user.setRole(Role.RESIDENT);
            user = userRepository.save(user);
        }
        
        // Generate token
        String token = jwtTokenProvider.generateToken(user.getEmail());
        
        // Map to DTO - ✅ Ensure role is included
        UserDTO userDTO = userMapper.toDTO(user);
        
        return AuthResponse.builder()
            .token(token)
            .user(userDTO)  // ✅ Must include role
            .build();
    }
}
```

### 4. User DTO Mapping

#### UserDTO Class

```java
public class UserDTO {
    private UUID id;
    private String fullName;
    private String email;
    private String phoneNumber;
    private String role;  // ✅ MUST be included
    private UUID locationId;
    private LocationDTO location;
    private LocalDateTime createdAt;
    
    // Getters and setters
    public String getRole() {
        return role;
    }
    
    public void setRole(String role) {
        this.role = role;  // ✅ MUST set this
    }
}
```

#### User Mapper

```java
@Component
public class UserMapper {
    
    public UserDTO toDTO(User user) {
        if (user == null) {
            return null;
        }
        
        UserDTO dto = new UserDTO();
        dto.setId(user.getId());
        dto.setFullName(user.getFullName());
        dto.setEmail(user.getEmail());
        dto.setPhoneNumber(user.getPhoneNumber());
        
        // ✅ CRITICAL: Map role - handle null case
        if (user.getRole() != null) {
            dto.setRole(user.getRole().name());  // Convert enum to string
        } else {
            dto.setRole("RESIDENT");  // Default if null
        }
        
        dto.setLocationId(user.getLocationId());
        
        if (user.getLocation() != null) {
            dto.setLocation(locationMapper.toDTO(user.getLocation()));
        }
        
        dto.setCreatedAt(user.getCreatedAt());
        
        return dto;
    }
}
```

### 5. User Profile Endpoint (`GET /api/users/me`)

```java
@RestController
@RequestMapping("/api/users")
public class UserController {
    
    @Autowired
    private UserService userService;
    
    @GetMapping("/me")
    public ResponseEntity<UserDTO> getCurrentUser(Authentication authentication) {
        String email = authentication.getName();
        User user = userService.findByEmail(email);
        
        // ✅ CRITICAL: Ensure role is set
        if (user.getRole() == null) {
            user.setRole(Role.RESIDENT);
            user = userService.save(user);
        }
        
        UserDTO userDTO = userMapper.toDTO(user);
        return ResponseEntity.ok(userDTO);
    }
}
```

## Data Migration for Existing Users

If you have existing users with `role: null`, run a migration:

### SQL Migration

```sql
-- Update all users with null role to RESIDENT
UPDATE users 
SET role = 'RESIDENT' 
WHERE role IS NULL;

-- Ensure role column is NOT NULL
ALTER TABLE users 
MODIFY COLUMN role VARCHAR(50) NOT NULL DEFAULT 'RESIDENT';
```

### Java Migration Script

```java
@Service
public class UserMigrationService {
    
    @Autowired
    private UserRepository userRepository;
    
    @Transactional
    public void migrateUserRoles() {
        List<User> usersWithoutRole = userRepository.findByRoleIsNull();
        
        for (User user : usersWithoutRole) {
            // Default to RESIDENT if role is null
            user.setRole(Role.RESIDENT);
            userRepository.save(user);
        }
        
        System.out.println("Migrated " + usersWithoutRole.size() + " users to RESIDENT role");
    }
}
```

## Testing Checklist

### ✅ Signup Test

1. **Test with role provided:**
   ```json
   POST /api/auth/signup
   {
     "fullName": "Test User",
     "email": "test@example.com",
     "password": "password123",
     "phoneNumber": "+250123456789",
     "role": "RESIDENT",
     "villageCode": 101080110
   }
   ```
   **Expected Response:**
   ```json
   {
     "token": "...",
     "user": {
       "role": "RESIDENT"  // ✅ Must be "RESIDENT", not null
     }
   }
   ```

2. **Test without role (should default to RESIDENT):**
   ```json
   POST /api/auth/signup
   {
     "fullName": "Test User",
     "email": "test2@example.com",
     "password": "password123",
     "phoneNumber": "+250123456789",
     "villageCode": 101080110
   }
   ```
   **Expected Response:**
   ```json
   {
     "token": "...",
     "user": {
       "role": "RESIDENT"  // ✅ Should default to RESIDENT
     }
   }
   ```

### ✅ Login Test

1. **Login with existing user:**
   ```json
   POST /api/auth/login
   {
     "email": "shema@gmail.com",
     "password": "password123"
   }
   ```
   **Expected Response:**
   ```json
   {
     "token": "...",
     "user": {
       "role": "RESIDENT"  // ✅ Must be "RESIDENT", not null
     }
   }
   ```

### ✅ User Profile Test

1. **Get current user:**
   ```
   GET /api/users/me
   Authorization: Bearer <token>
   ```
   **Expected Response:**
   ```json
   {
     "id": "...",
     "fullName": "Shema Owen",
     "email": "shema@gmail.com",
     "role": "RESIDENT",  // ✅ Must be "RESIDENT", not null
     "locationId": "..."
   }
   ```

## Common Issues and Solutions

### Issue 1: Role is null in database

**Solution:**
- Run migration to set default role for existing users
- Ensure database constraint: `role NOT NULL DEFAULT 'RESIDENT'`

### Issue 2: Role not included in DTO

**Solution:**
- Check `UserMapper.toDTO()` method
- Ensure `dto.setRole()` is called
- Verify DTO has `role` field

### Issue 3: Role enum not mapped correctly

**Solution:**
- Use `@Enumerated(EnumType.STRING)` in entity
- Convert enum to string in mapper: `user.getRole().name()`

### Issue 4: Role field missing in JSON response

**Solution:**
- Check if DTO field is properly serialized
- Verify Jackson annotations if using custom serialization
- Ensure `role` getter exists in DTO

## Verification Steps

After implementing the fixes:

1. **Check Database:**
   ```sql
   SELECT id, email, role FROM users WHERE role IS NULL;
   -- Should return 0 rows
   ```

2. **Test Signup:**
   - Create a new user
   - Verify response includes `"role": "RESIDENT"`

3. **Test Login:**
   - Login with existing user
   - Verify response includes `"role": "RESIDENT"` (not null)

4. **Test Profile:**
   - Call `GET /api/users/me`
   - Verify response includes `"role": "RESIDENT"`

5. **Check Frontend:**
   - Login to frontend
   - Check browser console: `user.role` should be `"RESIDENT"`, not `null`
   - Locations page should show user's location

## Summary

**Critical Points:**
1. ✅ Set `role` field to `NOT NULL` in database
2. ✅ Default role to `RESIDENT` if not provided during signup
3. ✅ Include `role` in all DTO mappings
4. ✅ Handle null roles in login/profile endpoints (set default)
5. ✅ Run migration for existing users with null roles
6. ✅ Test all endpoints return role (not null)

**Expected User Object Structure:**
```json
{
  "id": "uuid",
  "fullName": "string",
  "email": "string",
  "phoneNumber": "string",
  "role": "RESIDENT" | "ADMIN",  // ✅ NEVER null
  "locationId": "uuid",
  "createdAt": "datetime"
}
```

Following this guide will ensure the frontend receives proper role information and can correctly identify user permissions.

