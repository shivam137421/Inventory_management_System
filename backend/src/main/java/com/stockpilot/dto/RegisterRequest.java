package com.stockpilot.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class RegisterRequest {

    @NotBlank(message = "Business name is required")
    @Size(max = 150, message = "Business name must not exceed 150 characters")
    private String businessName;

    @NotBlank(message = "Owner name is required")
    @Size(max = 150, message = "Owner name must not exceed 150 characters")
    private String ownerName;

    @NotBlank(message = "Email is required")
    @Email(message = "Please enter a valid email address")
    @Size(max = 150, message = "Email must not exceed 150 characters")
    private String email;

    @Pattern(regexp = "^(?:(?:\\+91|0)?[6-9]\\d{9})?$", message = "Please enter a valid 10-digit mobile number")
    private String phone;

    @NotBlank(message = "Password is required")
    @Size(min = 8, max = 100, message = "Password must be at least 8 characters long")
    private String password;

    public RegisterRequest() {
    }

    public RegisterRequest(String businessName, String ownerName, String email, String phone, String password) {
        this.businessName = businessName;
        this.ownerName = ownerName;
        this.email = email;
        this.phone = phone;
        this.password = password;
    }

    public String getBusinessName() {
        return businessName;
    }

    public void setBusinessName(String businessName) {
        this.businessName = businessName;
    }

    public String getOwnerName() {
        return ownerName;
    }

    public void setOwnerName(String ownerName) {
        this.ownerName = ownerName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}
