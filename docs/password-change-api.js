/**
 * PASSWORD CHANGE API DOCUMENTATION
 * 
 * Endpoint: POST /api/users/reset
 * Authentication: Required (Bearer Token)
 * 
 * BEFORE (Required username):
 * {
 *   "username": "RiceShowe",
 *   "password": "currentPassword123",
 *   "newPassword": "newPassword456",
 *   "confirmPassword": "newPassword456"
 * }
 * 
 * AFTER (No username required):
 * {
 *   "password": "currentPassword123",
 *   "newPassword": "newPassword456", 
 *   "confirmPassword": "newPassword456"
 * }
 * 
 * Headers:
 * {
 *   "Authorization": "Bearer <your-jwt-token>",
 *   "Content-Type": "application/json"
 * }
 * 
 * Success Response (200):
 * {
 *   "message": "Password updated successfully"
 * }
 * 
 * Error Responses:
 * 401: "Current password is incorrect"
 * 400: "New password must be different from the current password"
 * 403: "Account is inactive"
 * 404: "User not found"
 */

// Frontend JavaScript Example:
const changePassword = async (currentPassword, newPassword, confirmPassword) => {
    try {
        const token = localStorage.getItem('authToken'); // or wherever you store JWT
        
        const response = await fetch('/api/users/reset', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                password: currentPassword,
                newPassword: newPassword,
                confirmPassword: confirmPassword
            })
        });

        const data = await response.json();
        
        if (response.ok) {
            alert('Password updated successfully!');
            // Optional: Log out user to force re-login with new password
            // logout();
        } else {
            alert(`Error: ${data.message}`);
        }
    } catch (error) {
        console.error('Password change failed:', error);
        alert('Password change failed. Please try again.');
    }
};

// Usage example:
// changePassword('oldPassword123', 'newPassword456', 'newPassword456');
